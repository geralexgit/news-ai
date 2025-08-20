import axios from 'axios';

export interface NewsArticle {
  title: string;
  summary: string;
  url?: string;
  source?: string;
  publishedAt?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  query: string;
  timestamp: string;
}

export class NewsService {
  private perplexityApiKey: string;
  private newsApiKey: string;
  private perplexityUrl = 'https://api.perplexity.ai/chat/completions';
  private newsApiUrl = 'https://newsapi.org/v2';

  constructor(perplexityApiKey: string, newsApiKey?: string) {
    this.perplexityApiKey = perplexityApiKey;
    this.newsApiKey = newsApiKey || '';
  }

  async getLatestNews(query: string = 'latest news today', limit: number = 5): Promise<NewsResponse> {
    // Try Perplexity first, fallback to NewsAPI if it fails
    try {
      return await this.getNewsFromPerplexity(query, limit);
    } catch (perplexityError) {
      console.log('Perplexity failed, trying NewsAPI fallback...');
      try {
        return await this.getNewsFromNewsAPI(query, limit);
      } catch (newsApiError) {
        console.error('Both APIs failed:', { perplexityError, newsApiError });
        // Return mock news as last resort
        return this.getMockNews(query, limit);
      }
    }
  }

  private async getNewsFromPerplexity(query: string, limit: number): Promise<NewsResponse> {
    const prompt = `Find the ${limit} most recent and important news stories about "${query}". 
    
    For each story, provide:
    - Title
    - Brief summary (2-3 sentences)
    - Source name if available
    
    Format as a numbered list. Focus on current, factual news from reliable sources.`;

    try {
      const response = await axios.post(
        this.perplexityUrl,
        {
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0]?.message?.content || '';
      const articles = this.parseNewsResponse(content);

      return {
        articles,
        query,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Perplexity API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  private async getNewsFromNewsAPI(query: string, limit: number): Promise<NewsResponse> {
    if (!this.newsApiKey) {
      throw new Error('NewsAPI key not available');
    }

    const response = await axios.get(`${this.newsApiUrl}/everything`, {
      params: {
        q: query,
        pageSize: limit,
        sortBy: 'publishedAt',
        language: 'en',
        apiKey: this.newsApiKey
      }
    });

    const articles: NewsArticle[] = response.data.articles.map((article: any) => ({
      title: article.title,
      summary: article.description || article.content?.substring(0, 200) + '...',
      url: article.url,
      source: article.source?.name,
      publishedAt: article.publishedAt
    }));

    return {
      articles,
      query,
      timestamp: new Date().toISOString()
    };
  }

  private getMockNews(query: string, limit: number): NewsResponse {
    const mockArticles: NewsArticle[] = [
      {
        title: `Latest Updates on ${query}`,
        summary: 'We are currently experiencing technical difficulties with our news sources. Please try again later for the most recent updates.',
        source: 'News AI Bot',
        publishedAt: new Date().toISOString()
      },
      {
        title: 'Service Notice',
        summary: 'Our news service is temporarily unavailable. We are working to restore full functionality as soon as possible.',
        source: 'System',
        publishedAt: new Date().toISOString()
      }
    ];

    return {
      articles: mockArticles.slice(0, limit),
      query,
      timestamp: new Date().toISOString()
    };
  }

  async getNewsByCategory(category: string, limit: number = 5): Promise<NewsResponse> {
    const categoryQueries = {
      'technology': 'latest technology news today',
      'business': 'latest business and finance news today',
      'sports': 'latest sports news today',
      'health': 'latest health and medical news today',
      'science': 'latest science and research news today',
      'politics': 'latest political news today',
      'world': 'latest world news today',
      'entertainment': 'latest entertainment news today'
    };

    const query = categoryQueries[category.toLowerCase() as keyof typeof categoryQueries] || `latest ${category} news today`;
    return this.getLatestNews(query, limit);
  }

  private parseNewsResponse(content: string): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    // Split content into potential articles (looking for numbered lists or clear separations)
    const lines = content.split('\n').filter(line => line.trim());
    let currentArticle: Partial<NewsArticle> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check if this looks like a title (starts with number, bullet, or is in caps/title case)
      if (this.looksLikeTitle(trimmedLine)) {
        // Save previous article if it exists
        if (currentArticle.title && currentArticle.summary) {
          articles.push(currentArticle as NewsArticle);
        }
        
        // Start new article
        currentArticle = {
          title: this.cleanTitle(trimmedLine),
          summary: '',
          source: this.extractSource(trimmedLine),
          publishedAt: this.extractDate(trimmedLine)
        };
      } else if (currentArticle.title && trimmedLine.length > 20) {
        // This looks like content for the current article
        if (!currentArticle.summary) {
          currentArticle.summary = trimmedLine;
        } else {
          currentArticle.summary += ' ' + trimmedLine;
        }
      }
    }
    
    // Don't forget the last article
    if (currentArticle.title && currentArticle.summary) {
      articles.push(currentArticle as NewsArticle);
    }
    
    // If parsing failed, create a single article with the full content
    if (articles.length === 0 && content.trim()) {
      articles.push({
        title: 'Latest News Summary',
        summary: content.trim().substring(0, 500) + (content.length > 500 ? '...' : ''),
        publishedAt: new Date().toISOString()
      });
    }
    
    return articles.slice(0, 5); // Limit to 5 articles
  }

  private looksLikeTitle(line: string): boolean {
    // Check if line looks like a title
    return /^\d+\./.test(line) || // Starts with number
           /^[•\-\*]/.test(line) || // Starts with bullet
           /^[A-Z][^.]*:/.test(line) || // Starts with caps and has colon
           (line.length < 100 && /^[A-Z]/.test(line) && !line.endsWith('.')); // Short, starts with caps, no period
  }

  private cleanTitle(title: string): string {
    // Remove numbering, bullets, and clean up title
    return title
      .replace(/^\d+\.\s*/, '')
      .replace(/^[•\-\*]\s*/, '')
      .replace(/\s*-\s*[^-]*$/, '') // Remove source at end
      .trim();
  }

  private extractSource(text: string): string | undefined {
    // Try to extract source from text
    const sourceMatch = text.match(/(?:Source:|via|from)\s*([A-Za-z\s]+)$/i) ||
                       text.match(/-\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/);
    return sourceMatch ? sourceMatch[1].trim() : undefined;
  }

  private extractDate(text: string): string | undefined {
    // Try to extract date information
    const dateMatch = text.match(/\b(?:today|yesterday|this morning|this afternoon|earlier today)\b/i);
    if (dateMatch) {
      return new Date().toISOString();
    }
    return undefined;
  }
}
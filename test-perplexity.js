const axios = require('axios');
require('dotenv').config();

async function testPerplexity() {
    try {
        console.log('Testing Perplexity API...');

        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar-pro',
                messages: [
                    {
                        role: 'user',
                        content: 'What are the top 3 news stories today? Please provide brief summaries.'
                    }
                ],
                max_tokens: 500,
                temperature: 0.2
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Perplexity API Response:');
        console.log(response.data.choices[0]?.message?.content || 'No content');
    } catch (error) {
        console.error('❌ Perplexity API Error:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testPerplexity();
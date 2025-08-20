#!/bin/bash

# News AI Telegram Bot - Database Setup Script
# This script helps configure PostgreSQL database for the bot

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_DB_NAME="news_ai_db"
DEFAULT_DB_USER="news_ai_user"
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_PORT="5432"

echo -e "${BLUE}🗄️  News AI Database Setup Script${NC}"
echo "=================================="
echo

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if PostgreSQL is installed
check_postgresql() {
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is installed"
        return 0
    else
        print_error "PostgreSQL is not installed"
        return 1
    fi
}

# Function to check if PostgreSQL service is running
check_postgresql_service() {
    if pg_isready -q; then
        print_success "PostgreSQL service is running"
        return 0
    else
        print_error "PostgreSQL service is not running"
        return 1
    fi
}

# Function to get user input with default value
get_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    read -p "$prompt [$default]: " input
    if [ -z "$input" ]; then
        eval "$var_name='$default'"
    else
        eval "$var_name='$input'"
    fi
}

# Function to create database and user
setup_database() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local db_host="$4"
    local db_port="$5"
    
    print_info "Creating database and user..."
    
    # Create user and database
    sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$db_user') THEN
        CREATE USER $db_user WITH PASSWORD '$db_password';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $db_name OWNER $db_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db_name')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;
GRANT CREATE ON SCHEMA public TO $db_user;

\q
EOF

    if [ $? -eq 0 ]; then
        print_success "Database '$db_name' and user '$db_user' created successfully"
    else
        print_error "Failed to create database or user"
        return 1
    fi
}

# Function to create database schema
create_schema() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local db_host="$4"
    local db_port="$5"
    
    print_info "Creating database schema..."
    
    PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" << 'EOF'
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News articles table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(255),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(100),
    keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

\q
EOF

    if [ $? -eq 0 ]; then
        print_success "Database schema created successfully"
    else
        print_error "Failed to create database schema"
        return 1
    fi
}

# Function to test database connection
test_connection() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local db_host="$4"
    local db_port="$5"
    
    print_info "Testing database connection..."
    
    PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT version();" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "Database connection test passed"
        return 0
    else
        print_error "Database connection test failed"
        return 1
    fi
}

# Function to update .env file
update_env_file() {
    local db_name="$1"
    local db_user="$2"
    local db_password="$3"
    local db_host="$4"
    local db_port="$5"
    
    local database_url="postgresql://$db_user:$db_password@$db_host:$db_port/$db_name"
    
    print_info "Updating .env file..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_info "Created .env file from .env.example"
        else
            touch .env
            print_info "Created new .env file"
        fi
    fi
    
    # Update or add DATABASE_URL
    if grep -q "^DATABASE_URL=" .env; then
        # Replace existing DATABASE_URL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$database_url|" .env
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$database_url|" .env
        fi
    else
        # Add new DATABASE_URL
        echo "DATABASE_URL=$database_url" >> .env
    fi
    
    print_success ".env file updated with database connection string"
    print_info "DATABASE_URL=$database_url"
}

# Main execution
main() {
    echo "This script will help you set up PostgreSQL database for the News AI bot."
    echo
    
    # Check if PostgreSQL is installed
    if ! check_postgresql; then
        print_error "Please install PostgreSQL first. See README.md for installation instructions."
        exit 1
    fi
    
    # Check if PostgreSQL service is running
    if ! check_postgresql_service; then
        print_warning "PostgreSQL service is not running. Attempting to start..."
        
        # Try to start PostgreSQL service
        if command -v systemctl &> /dev/null; then
            sudo systemctl start postgresql
        elif command -v brew &> /dev/null; then
            brew services start postgresql@15 || brew services start postgresql
        else
            print_error "Could not start PostgreSQL service automatically."
            print_info "Please start PostgreSQL manually and run this script again."
            exit 1
        fi
        
        # Check again
        sleep 2
        if ! check_postgresql_service; then
            print_error "Failed to start PostgreSQL service."
            exit 1
        fi
    fi
    
    echo
    print_info "Please provide database configuration details:"
    echo
    
    # Get database configuration from user
    get_input "Database name" "$DEFAULT_DB_NAME" "DB_NAME"
    get_input "Database user" "$DEFAULT_DB_USER" "DB_USER"
    get_input "Database host" "$DEFAULT_DB_HOST" "DB_HOST"
    get_input "Database port" "$DEFAULT_DB_PORT" "DB_PORT"
    
    # Get password (hidden input)
    echo -n "Database password: "
    read -s DB_PASSWORD
    echo
    
    if [ -z "$DB_PASSWORD" ]; then
        print_error "Password cannot be empty"
        exit 1
    fi
    
    echo
    print_info "Configuration summary:"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo
    
    read -p "Proceed with database setup? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled."
        exit 0
    fi
    
    echo
    print_info "Setting up database..."
    
    # Setup database and user
    if ! setup_database "$DB_NAME" "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT"; then
        exit 1
    fi
    
    # Create schema
    if ! create_schema "$DB_NAME" "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT"; then
        exit 1
    fi
    
    # Test connection
    if ! test_connection "$DB_NAME" "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT"; then
        exit 1
    fi
    
    # Update .env file
    update_env_file "$DB_NAME" "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT"
    
    echo
    print_success "🎉 Database setup completed successfully!"
    echo
    print_info "Next steps:"
    echo "  1. Make sure your TELEGRAM_BOT_TOKEN is set in .env"
    echo "  2. Run 'npm run dev' to start the bot"
    echo "  3. Test your bot on Telegram"
    echo
}

# Run main function
main "$@"
#!/bin/bash
# VPS Setup Script for IG Imports
# Run this on your VPS to configure the environment

set -e

echo "🚀 IG Imports VPS Setup"
echo "========================"

# Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create project directory
PROJECT_DIR="/opt/ig-imports"
echo "📁 Creating project directory: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Create environment file template
echo "⚙️ Creating environment configuration..."
cat > $PROJECT_DIR/.env << 'EOF'
# Project Name
COMPOSE_PROJECT_NAME=igimports

# Database Configuration
POSTGRES_DB=igimports_db
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_PORT=5432
POSTGRES_HOST=db

# JWT Configuration
JWT_SECRET=CHANGE_THIS_JWT_SECRET_MIN_32_CHARS
JWT_EXPIRY=604800

# API Configuration
API_EXTERNAL_URL=http://76.13.171.93:8000
SITE_URL=http://76.13.171.93:3000

# Studio Configuration
STUDIO_PORT=3002
STUDIO_DEFAULT_ORGANIZATION=IG Imports
STUDIO_DEFAULT_PROJECT=Production

# Kong Configuration
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# Backend Configuration
BACKEND_PORT=3001

# Analytics
LOGFLARE_PUBLIC_ACCESS_TOKEN=CHANGE_THIS
LOGFLARE_PRIVATE_ACCESS_TOKEN=CHANGE_THIS

# Secrets (Generate new ones!)
SECRET_KEY_BASE=$(openssl rand -base64 48)
VAULT_ENC_KEY=$(openssl rand -base64 32)
ANON_KEY=CHANGE_THIS
SERVICE_ROLE_KEY=CHANGE_THIS
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit $PROJECT_DIR/.env with your actual values"
echo "2. Copy your docker-compose.yml to $PROJECT_DIR/"
echo "3. Run: cd $PROJECT_DIR && docker-compose up -d"
echo ""
echo "🔑 Generate secure secrets with:"
echo "   openssl rand -base64 32"

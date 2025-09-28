#!/bin/bash

# Hostinger Deployment Script for Comic Catalog Manager
# Run this script on your Hostinger VPS

echo "🚀 Starting Comic Catalog Manager Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js found: $(node --version)"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing PM2..."
    npm install -g pm2
else
    echo "✅ PM2 found: $(pm2 --version)"
fi

# Create application directory
APP_DIR="/var/www/comic-catalog-manager"
echo "📁 Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone repository (replace with your actual repository URL)
echo "📥 Cloning repository..."
cd $APP_DIR
git clone https://github.com/yourusername/comic-catalog-manager.git .

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create production environment file
echo "⚙️ Creating production environment file..."
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wumulexiqkdwrgrlenah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Shopify Integration
NEXT_PUBLIC_FEATURE_SHOPIFY=true
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Next.js Configuration
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret_here
EOF

echo "⚠️  Please edit .env.local with your actual values!"

# Build application
echo "🔨 Building application..."
npm run build

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start npm --name "comic-catalog" -- start
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Edit .env.local with your actual environment variables"
echo "2. Configure your domain DNS to point to this server"
echo "3. Set up SSL certificate"
echo "4. Test your application at http://your-domain.com"

echo "🔧 Useful PM2 commands:"
echo "pm2 status          - Check application status"
echo "pm2 logs comic-catalog - View application logs"
echo "pm2 restart comic-catalog - Restart application"
echo "pm2 stop comic-catalog - Stop application"

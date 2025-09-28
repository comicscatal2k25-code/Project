# Environment Setup Script
# Run this script to create your .env.local file

Write-Host "Creating .env.local file..." -ForegroundColor Green

$envContent = @"
# Supabase Configuration
# Get these values from your Supabase project dashboard
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Shopify Configuration (optional - for Shopify integration)
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret_here

# Feature Flags
FEATURE_SHOPIFY=true
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ .env.local file created!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to update the values in .env.local with your actual Supabase credentials:" -ForegroundColor Yellow
Write-Host "   1. Go to your Supabase project dashboard" -ForegroundColor White
Write-Host "   2. Go to Settings > API" -ForegroundColor White
Write-Host "   3. Copy the Project URL and replace 'your_supabase_url_here'" -ForegroundColor White
Write-Host "   4. Copy the anon public key and replace 'your_supabase_anon_key_here'" -ForegroundColor White
Write-Host "   5. Copy the service_role secret key and replace 'your_supabase_service_role_key_here'" -ForegroundColor White
Write-Host ""
Write-Host "After updating .env.local, restart your development server with: npm run dev" -ForegroundColor Cyan

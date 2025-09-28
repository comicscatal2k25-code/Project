# Hostinger Deployment Guide for Comic Catalog Manager

## 🚀 Complete Deployment Instructions

### Prerequisites
- Hostinger VPS or Shared Hosting account
- Domain name (optional)
- Git repository access
- Supabase project configured

### Step 1: Prepare Application for Production

1. **Update next.config.js** (already created):
   - Uses `output: 'standalone'` for better hosting compatibility
   - Includes security headers
   - Optimizes images for production

2. **Environment Variables Setup**:
   Create `.env.local` on your Hostinger server with:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://wumulexiqkdwrgrlenah.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   
   # Shopify Integration (if enabled)
   NEXT_PUBLIC_FEATURE_SHOPIFY=true
   SHOPIFY_API_KEY=your_shopify_api_key_here
   SHOPIFY_API_SECRET=your_shopify_api_secret_here
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   
   # Next.js Configuration
   NODE_ENV=production
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

### Step 2: VPS Deployment (Recommended)

1. **Connect to VPS via SSH**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js 18+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2 for Process Management**:
   ```bash
   npm install -g pm2
   ```

4. **Clone Your Repository**:
   ```bash
   git clone https://github.com/yourusername/comic-catalog-manager.git
   cd comic-catalog-manager
   ```

5. **Install Dependencies**:
   ```bash
   npm install
   ```

6. **Build Application**:
   ```bash
   npm run build
   ```

7. **Start with PM2**:
   ```bash
   pm2 start npm --name "comic-catalog" -- start
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx** (if using VPS):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Step 3: Shared Hosting Deployment (Alternative)

1. **Upload Files via File Manager**:
   - Upload your project files to `public_html` folder
   - Ensure `.env.local` is uploaded

2. **Install Dependencies**:
   - Use Hostinger's Node.js installer
   - Run `npm install` in terminal

3. **Build Application**:
   ```bash
   npm run build
   ```

4. **Start Application**:
   ```bash
   npm start
   ```

### Step 4: Domain Configuration

1. **Point Domain to Hostinger**:
   - Update DNS records to point to Hostinger's servers
   - Wait for DNS propagation (24-48 hours)

2. **SSL Certificate**:
   - Enable Let's Encrypt SSL in Hostinger control panel
   - Force HTTPS redirect

### Step 5: Database Setup

1. **Supabase Configuration**:
   - Update Supabase project settings
   - Add your domain to allowed origins
   - Configure RLS policies for production

2. **Environment Variables**:
   - Update `NEXT_PUBLIC_APP_URL` with your actual domain
   - Ensure all API keys are correct

### Step 6: Testing & Monitoring

1. **Test Application**:
   - Visit your domain
   - Test login functionality
   - Verify Shopify integration (if enabled)

2. **Monitor Performance**:
   - Use Hostinger's monitoring tools
   - Set up PM2 monitoring (for VPS)
   - Monitor Supabase usage

### Troubleshooting

**Common Issues**:
- **Build Errors**: Check Node.js version compatibility
- **Environment Variables**: Ensure all required variables are set
- **Database Connection**: Verify Supabase configuration
- **SSL Issues**: Check certificate installation

**Performance Optimization**:
- Enable gzip compression
- Use CDN for static assets
- Optimize images
- Monitor database queries

### Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **HTTPS**: Always use SSL in production
4. **Updates**: Keep dependencies updated
5. **Backups**: Regular database backups

### Cost Estimation

- **VPS Plan**: $3.99-7.99/month
- **Shared Hosting**: $1.99-3.99/month
- **Domain**: $0.99-15/year
- **SSL**: Free with Let's Encrypt

### Support Resources

- Hostinger Knowledge Base
- Next.js Deployment Documentation
- Supabase Production Guide
- PM2 Process Manager Docs

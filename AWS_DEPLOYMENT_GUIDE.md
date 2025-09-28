# Comic Catalog Manager - AWS Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [EC2 Instance Setup](#ec2-instance-setup)
4. [Server Configuration](#server-configuration)
5. [Application Deployment](#application-deployment)
6. [Domain and SSL Setup](#domain-and-ssl-setup)
7. [Database Migration](#database-migration)
8. [Environment Variables](#environment-variables)
9. [Testing and Monitoring](#testing-and-monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need:
- AWS Account (free tier available)
- Domain name (optional, but recommended)
- Credit card for AWS billing (free tier covers most costs)
- Basic computer skills

### Estimated Costs:
- **Free Tier (12 months):** $0-5/month
- **After Free Tier:** $10-20/month for small app
- **Domain:** $10-15/year

---

## AWS Account Setup

### Step 1: Create AWS Account
1. **Go to AWS Website:**
   - Visit [aws.amazon.com](https://aws.amazon.com)
   - Click "Create an AWS Account"

2. **Account Information:**
   - Enter email address
   - Choose "Personal" account type
   - Create password
   - Choose account name (e.g., "Comic Catalog Manager")

3. **Contact Information:**
   - Fill in your details
   - Choose "Personal" for account type
   - Enter phone number for verification

4. **Payment Information:**
   - Add credit card (required even for free tier)
   - AWS will charge $1 for verification (refunded)

5. **Identity Verification:**
   - Choose phone verification
   - Enter verification code
   - Select support plan: "Basic Plan" (free)

6. **Account Created:**
   - You'll receive confirmation email
   - Sign in to AWS Console

### Step 2: Enable Free Tier Monitoring
1. **Go to Billing Dashboard:**
   - Click "Billing" in AWS Console
   - Click "Free Tier" in left sidebar
   - Monitor usage to stay within limits

---

## EC2 Instance Setup

### Step 1: Launch EC2 Instance
1. **Navigate to EC2:**
   - In AWS Console, search "EC2"
   - Click "EC2" service
   - Click "Launch Instance"

2. **Choose AMI (Operating System):**
   - Select "Ubuntu Server 22.04 LTS"
   - Choose "64-bit (x86)" architecture
   - Click "Select"

3. **Choose Instance Type:**
   - Select "t2.micro" (free tier eligible)
   - 1 vCPU, 1 GB RAM
   - Click "Next: Configure Instance Details"

4. **Configure Instance:**
   - Number of instances: 1
   - Leave other settings as default
   - Click "Next: Add Storage"

5. **Add Storage:**
   - Size: 8 GB (free tier limit)
   - Volume type: gp3
   - Click "Next: Add Tags"

6. **Add Tags (Optional):**
   - Key: Name
   - Value: Comic-Catalog-Manager
   - Click "Next: Configure Security Group"

7. **Configure Security Group:**
   - Security group name: comic-catalog-sg
   - Description: Security group for Comic Catalog Manager
   
   **Add Rules:**
   - **SSH:** Port 22, Source: My IP
   - **HTTP:** Port 80, Source: 0.0.0.0/0
   - **HTTPS:** Port 443, Source: 0.0.0.0/0
   - **Custom TCP:** Port 3000, Source: 0.0.0.0/0
   
   Click "Review and Launch"

8. **Review and Launch:**
   - Review all settings
   - Click "Launch"

9. **Create Key Pair:**
   - Choose "Create a new key pair"
   - Key pair name: comic-catalog-key
   - Click "Download Key Pair"
   - **IMPORTANT:** Save the .pem file securely
   - Click "Launch Instances"

### Step 2: Get Instance Information
1. **View Instances:**
   - Click "View Instances"
   - Wait for instance to be "Running"
   - Note the "Public IPv4 address"

2. **Instance Details:**
   - Public IP: `xx.xx.xx.xx` (your instance IP)
   - Instance ID: `i-xxxxxxxxx`
   - State: Running

---

## Server Configuration

### Step 1: Connect to Your Server
1. **Windows Users (PowerShell):**
   ```powershell
   # Navigate to where you saved the .pem file
   cd C:\Users\YourName\Downloads
   
   # Set permissions (Windows)
   icacls comic-catalog-key.pem /inheritance:r
   icacls comic-catalog-key.pem /grant:r "%USERNAME%":R
   
   # Connect to server
   ssh -i comic-catalog-key.pem ubuntu@YOUR_PUBLIC_IP
   ```

2. **Mac/Linux Users:**
   ```bash
   # Navigate to where you saved the .pem file
   cd ~/Downloads
   
   # Set permissions
   chmod 400 comic-catalog-key.pem
   
   # Connect to server
   ssh -i comic-catalog-key.pem ubuntu@YOUR_PUBLIC_IP
   ```

3. **First Connection:**
   - Type "yes" when prompted
   - You should see: `ubuntu@ip-xx-xx-xx-xx:~$`

### Step 2: Update System
```bash
# Update package list
sudo apt update

# Upgrade system
sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common
```

### Step 3: Install Node.js
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 5: Install Nginx (Web Server)
```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Application Deployment

### Step 1: Upload Your Application
1. **Create Application Directory:**
   ```bash
   # Create directory
   sudo mkdir -p /var/www/comic-catalog-manager
   sudo chown ubuntu:ubuntu /var/www/comic-catalog-manager
   cd /var/www/comic-catalog-manager
   ```

2. **Upload Files (Choose one method):**

   **Method A: Using Git (Recommended)**
   ```bash
   # Clone your repository
   git clone https://github.com/yourusername/comic-catalog-manager.git .
   
   # Or if you have the files locally, use SCP
   ```

   **Method B: Using SCP from Windows**
   ```powershell
   # From your local machine
   scp -i comic-catalog-key.pem -r "C:\path\to\your\project\*" ubuntu@YOUR_PUBLIC_IP:/var/www/comic-catalog-manager/
   ```

   **Method C: Using SCP from Mac/Linux**
   ```bash
   # From your local machine
   scp -i comic-catalog-key.pem -r /path/to/your/project/* ubuntu@YOUR_PUBLIC_IP:/var/www/comic-catalog-manager/
   ```

### Step 2: Install Dependencies
```bash
# Navigate to application directory
cd /var/www/comic-catalog-manager

# Install dependencies
npm install

# Build the application
npm run build
```

### Step 3: Configure Environment Variables
```bash
# Create environment file
nano .env.local
```

**Add your environment variables:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Shopify Configuration (if using)
FEATURE_SHOPIFY=true
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# App Configuration
NODE_ENV=production
PORT=3000
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Start Application with PM2
```bash
# Start application
pm2 start npm --name "comic-catalog-manager" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown

# Check status
pm2 status
pm2 logs comic-catalog-manager
```

---

## Domain and SSL Setup

### Step 1: Configure Domain (Optional)
1. **Buy Domain (if needed):**
   - Go to [Namecheap.com](https://namecheap.com) or [GoDaddy.com](https://godaddy.com)
   - Search for your desired domain
   - Purchase domain (e.g., `yourcomicstore.com`)

2. **Point Domain to AWS:**
   - In your domain registrar's control panel
   - Go to DNS settings
   - Add A record:
     - Type: A
     - Name: @
     - Value: YOUR_EC2_PUBLIC_IP
     - TTL: 300

### Step 2: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/comic-catalog-manager
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/comic-catalog-manager /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 3: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to share email
# - Select redirect option (recommended: 2)
```

**Auto-renewal setup:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up renewal
```

---

## Database Migration

### Step 1: Update Supabase Configuration
1. **Go to Supabase Dashboard:**
   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your project

2. **Update Settings:**
   - Go to Settings → API
   - Copy your project URL and anon key
   - Update your `.env.local` file on the server

### Step 2: Run Database Migrations
```bash
# If you have database migration scripts
npm run db:migrate

# Or run SQL scripts manually in Supabase SQL editor
```

---

## Environment Variables

### Complete Environment File
```bash
# Edit environment file
nano .env.local
```

**Full configuration:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Shopify Configuration
FEATURE_SHOPIFY=true
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# App Configuration
NODE_ENV=production
PORT=3000

# Security
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=https://yourdomain.com
```

**Save and restart:**
```bash
# Restart application
pm2 restart comic-catalog-manager

# Check logs
pm2 logs comic-catalog-manager
```

---

## Testing and Monitoring

### Step 1: Test Your Application
1. **Check Application Status:**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Check application logs
   pm2 logs comic-catalog-manager
   
   # Check Nginx status
   sudo systemctl status nginx
   ```

2. **Test in Browser:**
   - Visit `http://YOUR_PUBLIC_IP` (should redirect to HTTPS)
   - Visit `https://yourdomain.com`
   - Test all functionality

### Step 2: Setup Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

### Step 3: Setup Log Rotation
```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs comic-catalog-manager

# Check if port is in use
sudo netstat -tlnp | grep :3000

# Restart application
pm2 restart comic-catalog-manager
```

#### 2. Nginx Issues
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep "Not After"
```

#### 4. Database Connection Issues
```bash
# Check environment variables
cat .env.local

# Test database connection
curl -X GET "https://yourdomain.com/api/health"
```

#### 5. High Memory Usage
```bash
# Check memory usage
free -h

# Restart application if needed
pm2 restart comic-catalog-manager

# Monitor with htop
htop
```

### Useful Commands
```bash
# View all running processes
pm2 list

# View application logs
pm2 logs comic-catalog-manager --lines 100

# Restart application
pm2 restart comic-catalog-manager

# Stop application
pm2 stop comic-catalog-manager

# Delete application from PM2
pm2 delete comic-catalog-manager

# Check system resources
htop
df -h
free -h

# Check network connections
sudo netstat -tlnp

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates
```

---

## Security Best Practices

### 1. Firewall Configuration
```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Regular Updates
```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm update

# Restart application after updates
pm2 restart comic-catalog-manager
```

### 3. Backup Strategy
```bash
# Create backup script
nano backup.sh
```

**Backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/var/www/comic-catalog-manager"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: app_backup_$DATE.tar.gz"
```

```bash
# Make script executable
chmod +x backup.sh

# Run backup
./backup.sh

# Setup daily backup (crontab)
crontab -e
# Add this line:
# 0 2 * * * /home/ubuntu/backup.sh
```

---

## Cost Optimization

### 1. Monitor AWS Costs
- Set up billing alerts in AWS Console
- Monitor free tier usage
- Use AWS Cost Explorer

### 2. Optimize Instance Size
- Start with t2.micro (free tier)
- Monitor usage with CloudWatch
- Upgrade only if needed

### 3. Use Reserved Instances (After Free Tier)
- Save up to 75% on EC2 costs
- Commit to 1-3 year terms
- Only if you plan to run long-term

---

## Summary

### What You've Accomplished:
✅ **AWS Account Setup** - Created AWS account and enabled free tier  
✅ **EC2 Instance** - Launched Ubuntu server with proper security  
✅ **Server Configuration** - Installed Node.js, PM2, and Nginx  
✅ **Application Deployment** - Uploaded and configured your app  
✅ **Domain & SSL** - Set up custom domain with HTTPS  
✅ **Database Migration** - Connected to Supabase  
✅ **Monitoring** - Set up logging and monitoring  
✅ **Security** - Configured firewall and SSL  

### Your Application is Now Live At:
- **HTTPS:** `https://yourdomain.com`
- **HTTP:** `http://yourdomain.com` (redirects to HTTPS)

### Next Steps:
1. **Test all functionality** in production
2. **Set up monitoring** alerts
3. **Create regular backups**
4. **Monitor costs** and usage
5. **Update application** regularly

### Support Resources:
- **AWS Documentation:** [docs.aws.amazon.com](https://docs.aws.amazon.com)
- **PM2 Documentation:** [pm2.keymetrics.io](https://pm2.keymetrics.io)
- **Nginx Documentation:** [nginx.org](https://nginx.org)
- **Let's Encrypt:** [letsencrypt.org](https://letsencrypt.org)

---

**Congratulations!** Your Comic Catalog Manager is now live on AWS! 🎉

For any issues, refer to the troubleshooting section or check the application logs with `pm2 logs comic-catalog-manager`.

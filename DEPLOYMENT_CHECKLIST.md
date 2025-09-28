# 🚀 Hostinger Deployment Checklist

## Pre-Deployment Setup

### ✅ Hostinger Account
- [ ] VPS or Shared Hosting plan activated
- [ ] Domain name registered/pointed to Hostinger
- [ ] SSH access configured (for VPS)
- [ ] Control panel access confirmed

### ✅ Application Preparation
- [ ] `next.config.js` updated for production
- [ ] Environment variables documented
- [ ] Dependencies checked for compatibility
- [ ] Build process tested locally

### ✅ Database Setup
- [ ] Supabase project configured for production
- [ ] Database migrations applied
- [ ] RLS policies updated for production domain
- [ ] API keys generated and secured

## Deployment Steps

### ✅ VPS Deployment (Recommended)
- [ ] Connect to server via SSH
- [ ] Install Node.js 18+
- [ ] Install PM2 process manager
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Configure environment variables (`.env.local`)
- [ ] Build application (`npm run build`)
- [ ] Start with PM2 (`pm2 start`)
- [ ] Configure PM2 startup (`pm2 startup`)

### ✅ Domain & SSL
- [ ] DNS records updated
- [ ] SSL certificate installed
- [ ] HTTPS redirect configured
- [ ] Domain verified in Supabase

### ✅ Testing & Verification
- [ ] Application loads correctly
- [ ] Login functionality works
- [ ] Database connections successful
- [ ] Shopify integration functional (if enabled)
- [ ] All API endpoints responding
- [ ] Images loading properly
- [ ] Mobile responsiveness checked

## Post-Deployment

### ✅ Monitoring & Maintenance
- [ ] PM2 monitoring configured
- [ ] Log rotation set up
- [ ] Backup strategy implemented
- [ ] Update schedule planned
- [ ] Performance monitoring active

### ✅ Security Checklist
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Regular updates scheduled

## Troubleshooting

### Common Issues & Solutions

**❌ Build Errors**
- Check Node.js version compatibility
- Verify all dependencies installed
- Clear npm cache: `npm cache clean --force`

**❌ Environment Variables**
- Verify `.env.local` file exists
- Check variable names match exactly
- Ensure no trailing spaces

**❌ Database Connection**
- Verify Supabase URL and keys
- Check RLS policies for production domain
- Test connection from server

**❌ SSL Issues**
- Verify certificate installation
- Check domain configuration
- Ensure HTTPS redirect working

**❌ Performance Issues**
- Monitor PM2 process status
- Check server resources
- Optimize database queries
- Enable gzip compression

## Quick Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs comic-catalog

# Restart application
pm2 restart comic-catalog

# Stop application
pm2 stop comic-catalog

# Update application
git pull
npm install
npm run build
pm2 restart comic-catalog
```

## Support Resources

- **Hostinger Knowledge Base**: https://support.hostinger.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Supabase Production**: https://supabase.com/docs/guides/platform/going-into-prod

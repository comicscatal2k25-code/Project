# Shopify Integration Documentation

## Overview

This document describes the Shopify integration features added to the comic catalog manager. The integration provides role-based access to Shopify store management, comic publishing, and job monitoring.

## Features

### Role-Based Access Control (RBAC)

- **Admin**: Full access to store connections, publish jobs, and all job history
- **Lister**: Can create publish jobs and view their own job history
- **Analyst**: Read-only access to job history and reports
- **Viewer**: Basic read-only access to job status

### Core Functionality

1. **Store Connections**: OAuth-based connection to Shopify stores (Admin only)
2. **Publish Jobs**: Create and manage comic publishing jobs (Admin/Lister)
3. **CSV Export**: Generate Shopify-compatible CSV files
4. **Image Handling**: Validate and process images for Shopify
5. **Job Monitoring**: Track job progress and handle failures

## Setup Instructions

### 1. Enable Feature Flag

Set the environment variable to enable Shopify integration:

```bash
FEATURE_SHOPIFY=true
```

### 2. Configure Shopify Credentials

Add your Shopify app credentials to environment variables:

```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_ACCESS_TOKEN=your_access_token
```

### 3. Run Database Migrations

Execute the migration scripts to create required tables:

```bash
# Apply migrations
psql -f scripts/103_create_shopify_tables.sql

# Rollback if needed
psql -f scripts/104_drop_shopify_tables.sql
```

### 4. Create Storage Buckets

Create Supabase storage buckets for images and exports:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('shopify_images', 'shopify_images', true),
('shopify_exports', 'shopify_exports', true);
```

## API Endpoints

### Store Connections

- `GET /api/shopify/connections` - List connected stores (Admin only)
- `POST /api/shopify/connections` - Initiate OAuth connection (Admin only)
- `GET /api/shopify/callback` - OAuth callback handler
- `DELETE /api/shopify/connections/:id` - Disconnect store (Admin only)

### Publish Jobs

- `GET /api/shopify/publish` - List publish jobs (RBAC filtered)
- `POST /api/shopify/publish` - Create publish job (Admin/Lister)
- `GET /api/shopify/jobs/:id` - Get job details (RBAC filtered)
- `POST /api/shopify/jobs/:id/retry` - Retry failed rows (Admin/Lister)

## Database Schema

### store_connections

```sql
CREATE TABLE store_connections (
  id UUID PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  shopify_shop VARCHAR(255) NOT NULL UNIQUE,
  oauth_access_token TEXT NOT NULL, -- encrypted
  scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### publish_jobs

```sql
CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  store_connection_id UUID REFERENCES store_connections(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  type VARCHAR(50) NOT NULL,
  payload_summary JSONB,
  rows_total INTEGER DEFAULT 0,
  rows_success INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### publish_job_rows

```sql
CREATE TABLE publish_job_rows (
  id UUID PRIMARY KEY,
  publish_job_id UUID NOT NULL REFERENCES publish_jobs(id),
  local_variant_id UUID REFERENCES comic_variants(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  shopify_product_id VARCHAR(255),
  shopify_variant_id VARCHAR(255),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Examples

### Connect a Shopify Store (Admin)

1. Navigate to `/shopify` page
2. Click "Store Connections" tab
3. Enter shop name (e.g., `my-store.myshopify.com`)
4. Click "Connect Store"
5. Complete OAuth flow

### Create a Publish Job (Admin/Lister)

1. Navigate to `/shopify` page
2. Click "Publish Jobs" tab
3. Select store connection
4. Choose publish mode (API or CSV)
5. Select comic variants
6. Click "Start Publish"

### Monitor Job Progress

1. View job list in "Publish Jobs" tab
2. Click "View Details" for specific job
3. See per-row status and error messages
4. Retry failed rows if needed

## Security Considerations

- All Shopify access tokens are encrypted before storage
- RBAC is enforced on both client and server side
- Rate limiting prevents abuse
- Audit logging tracks all actions
- Input validation prevents injection attacks

## Troubleshooting

### Common Issues

1. **"Shopify integration not enabled"**
   - Set `FEATURE_SHOPIFY=true` in environment variables

2. **"Insufficient permissions"**
   - Check user role and required permissions
   - Ensure proper RBAC configuration

3. **"Store connection not found"**
   - Verify store connection exists
   - Check if user has access to the connection

4. **"Job processing failed"**
   - Check Shopify API credentials
   - Verify store connection is valid
   - Review error messages in job details

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=shopify:*
```

## Testing

Run the test suite:

```bash
npm test tests/shopify-rbac.test.ts
```

## Rollback

To disable Shopify integration:

1. Set `FEATURE_SHOPIFY=false`
2. Run rollback migration: `psql -f scripts/104_drop_shopify_tables.sql`
3. Remove environment variables
4. Restart application

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review audit logs for error details
3. Contact system administrator
4. Check Shopify API documentation for external issues

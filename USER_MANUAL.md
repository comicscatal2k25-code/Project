# Comic Catalog Manager - Complete User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Roles & Access Control](#user-roles--access-control)
3. [Comics Management](#comics-management)
4. [Shopify Integration](#shopify-integration)
5. [Export Features](#export-features)
6. [User Management](#user-management)
7. [Troubleshooting](#troubleshooting)
8. [Support](#support)

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Admin or Lister account (provided by your administrator)

### First Login
1. Navigate to your application URL
2. Click "Login" in the top-right corner
3. Enter your credentials:
   - **Email:** Your registered email address
   - **Password:** Your account password
4. Click "Sign In"

### Dashboard Overview
After login, you'll see the main dashboard with:
- **Comics Grid:** All your comic books
- **Navigation Menu:** Access to different sections
- **User Profile:** Your account information
- **Search & Filters:** Find specific comics quickly

---

## User Roles & Access Control

### Admin Role
**Full access to all features:**
- Create, edit, and delete comics
- Manage user accounts
- Configure Shopify connections
- Access all export options
- View and manage all publishing jobs
- System configuration

### Lister Role
**Limited access for cataloging:**
- Create and edit comics
- View comics (own and others)
- Export comics data
- View Shopify connections
- Publish comics to Shopify
- View job history

### Viewer Role
**Read-only access:**
- View comics only
- Export comics data
- No editing or publishing capabilities

---

## Comics Management

### Adding New Comics

#### Method 1: Single Comic Entry
1. Click the **"+"** button in the top-right corner
2. Fill in the comic details:

   **Basic Information:**
   - **Title:** Comic book title
   - **Series:** Series name
   - **Issue Number:** Issue number
   - **Publisher:** Publishing company
   - **Publication Date:** When it was published
   - **Cover Price:** Original retail price

   **Condition & Grading:**
   - **Condition:** Physical condition (Mint, Near Mint, etc.)
   - **Grade:** Numerical grade (if graded)
   - **Grading Service:** CGC, PGX, CBCS, etc.
   - **Era:** Golden Age, Silver Age, Bronze Age, etc.

   **Financial Information:**
   - **Current Value:** Current market value
   - **Purchase Price:** What you paid
   - **Purchase Date:** When you bought it

   **Additional Details:**
   - **Description:** Additional notes
   - **Tags:** Keywords for searching
   - **Cover Image:** Upload a photo

3. Click **"Save Comic"**

#### Method 2: Bulk Import
1. Click **"Import Comics"** in the header
2. Download the template CSV file
3. Fill in your comic data using the template
4. Upload the completed CSV file
5. Review the import preview
6. Click **"Import Comics"**

### Editing Comics
1. Find the comic in the grid
2. Click the **"Edit"** button (pencil icon)
3. Modify the information
4. Click **"Save Changes"**

### Deleting Comics
1. Find the comic in the grid
2. Click the **"Delete"** button (trash icon)
3. Confirm the deletion in the popup

### Searching & Filtering
- **Search Bar:** Type any text to search across all fields
- **Filters:** Use the filter panel to narrow results by:
  - Publisher
  - Condition
  - Era
  - Grading Service
  - Price Range
  - Date Range

### Viewing Comic Details
Click on any comic card to view:
- Full comic information
- High-resolution cover image
- Purchase history
- Value tracking
- Related comics

---

## Shopify Integration

### Setting Up Your Shopify Store Connection

#### Step 1: Create a Shopify App (Required for OAuth)
1. **Access Shopify Partners:**
   - Go to [partners.shopify.com](https://partners.shopify.com)
   - Sign in or create a Partners account
   - Open the Partner Dashboard

2. **Create a New App:**
   - Click **"Apps"**
   - Click **"Create app"**
   - Choose **"Create app manually"**
   - Fill in:
     - **App name:** `Comic Catalog Manager`
     - **App URL:** `https://yourdomain.com` (your deployed domain)
     - **Allowed redirection URL(s):** `https://yourdomain.com/api/shopify/callback`

3. **Configure App Settings:**
   - In the app, open **"App setup"**
   - Set:
     - **App URL:** `https://yourdomain.com`
     - **Allowed redirection URL(s):** `https://yourdomain.com/api/shopify/callback`
   - Save the configuration

4. **Get App Credentials:**
   - Open **"App Settings"**
   - Copy:
     - **Client ID** (API key)
     - **Client Secret** (API secret key)

#### Step 2: Configure the Application (Admin Only)
1. **Access Server Environment:**
   - Contact your system administrator
   - Provide them with your Shopify app credentials

2. **Environment Variables Setup:**
   The administrator needs to add these to the server's `.env.local`:
   ```env
   FEATURE_SHOPIFY=true
   SHOPIFY_API_KEY=your_client_id_from_step_1
   SHOPIFY_API_SECRET=your_client_secret_from_step_1
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Restart Application:**
   - The administrator will restart the application
   - Shopify integration will be enabled

#### Step 3: Connect Your Store (OAuth Flow)
1. **Access the Comic Catalog Manager:**
   - Go to your deployed application
   - Log in with your account
   - Click **"Shopify"** in the navigation menu

2. **Add Store Connection:**
   - Click **"Store Connections"** tab
   - In the "Connect Store" section, enter your store name:
     - **Store Name:** Your store name (e.g., `my-comic-store.myshopify.com`)
   - Click **"Connect Store"**

3. **Complete OAuth Authorization:**
   - You'll be redirected to Shopify's authorization page
   - Log in to your Shopify store if prompted
   - Review the permissions being requested:
     - Read and write products
     - Read and write inventory
     - Read and write orders
   - Click **"Install app"** to authorize the connection

4. **Return to the App:**
   - You'll be automatically redirected back to the Comic Catalog Manager
   - Your store should now appear in the connections list
   - Status should show as "Connected"

#### Step 4: Verify Connection
1. **Check Connection Status:**
   - Your store should appear in the "Connected Stores" section
   - Status should show as "Connected"
   - You should see the granted permissions listed
   - Note the connection date and time

### Publishing Comics to Shopify

#### Single Comic Publishing
1. **Navigate to Comics:**
   - Go to the main comics page
   - Find the comic you want to publish

2. **Publish the Comic:**
   - Hover over the comic card
   - Click **"Publish to Shopify"** button
   - Select your store from the dropdown
   - Click **"Confirm"**

3. **Monitor the Process:**
   - The comic will be processed in the background
   - Check the "Publish Jobs" tab for status updates
   - Successful publications will appear in your Shopify store

#### Bulk Publishing
1. **Select Multiple Comics:**
   - Use the checkboxes to select multiple comics
   - Or use "Select All" for all visible comics

2. **Bulk Actions:**
   - Click **"Bulk Actions"** dropdown
   - Select **"Publish to Shopify"**
   - Choose your store
   - Confirm the bulk operation

3. **Monitor Progress:**
   - Check "Publish Jobs" for bulk job status
   - Individual comics will show their status
   - Failed items can be retried individually

### Managing Publishing Jobs

#### Viewing Job Status
1. **Access Job History:**
   - Go to **"Shopify"** → **"Job History"** tab
   - View all publishing attempts

2. **Job Information:**
   - **Status:** Success, Failed, or In Progress
   - **Store:** Which store was targeted
   - **Items:** Number of comics processed
   - **Date:** When the job was run
   - **Details:** Click to see specific results

#### Retrying Failed Jobs
1. **Identify Failed Items:**
   - Look for jobs with "Failed" status
   - Click **"View Details"** to see specific errors

2. **Retry Options:**
   - **Retry Failed:** Retry only the failed items
   - **Retry All:** Retry the entire job
   - **Individual Retry:** Retry specific comics

### Shopify Product Mapping

Your comics are automatically mapped to Shopify products with:

**Product Information:**
- **Title:** Comic title
- **Description:** Comic description with era information
- **Product Type:** "Comic Book"
- **Vendor:** Publisher name
- **Tags:** Comic tags and categories

**Variant Information:**
- **Price:** Current value
- **Compare at Price:** Higher value for comparison
- **SKU:** Comic's unique identifier
- **Barcode:** ISBN or custom barcode
- **Inventory:** Set to 1 (single item)
- **Weight:** 0.1 lbs (standard comic weight)

**Custom Fields (Metafields):**
- **Condition:** Physical condition
- **Grade:** Numerical grade
- **Grading Service:** CGC, PGX, etc.
- **Era:** Golden Age, Silver Age, etc.

---

## Export Features

### CSV Export (Shopify Compatible)
1. **Access Export:**
   - Go to the comics page
   - Click **"Export"** button in the header

2. **Configure Export:**
   - Select **"CSV"** format
   - Choose export options:
     - **All Comics:** Export everything
     - **Filtered Comics:** Export current search results
     - **Selected Comics:** Export only checked items

3. **Download:**
   - Click **"Export Comics"**
   - File downloads as `shopify-comics-import-YYYY-MM-DD.csv`
   - Ready for Shopify import

### Excel Export
1. **Access Export:**
   - Click **"Export"** button
   - Select **"Excel"** format

2. **Configure Options:**
   - Choose what to export
   - Select date range (optional)
   - Include images (optional)

3. **Download:**
   - Click **"Export Comics"**
   - File downloads as `shopify-comics-import-YYYY-MM-DD.xlsx`

### Export Format Details

**CSV Format (Shopify Compatible):**
- Headers match Shopify's product import format
- Includes all required fields for product creation
- Custom fields for comic-specific information
- Ready for direct import into Shopify

**Excel Format:**
- Multiple sheets for different data types
- Formatted for easy reading
- Includes charts and summaries
- Professional presentation

---

## User Management

### Managing User Accounts (Admin Only)

#### Adding New Users
1. **Access User Management:**
   - Go to **"Users"** in the navigation
   - Click **"Add User"**

2. **User Information:**
   - **Email:** User's email address
   - **Password:** Temporary password
   - **Role:** Admin, Lister, or Viewer
   - **Name:** Full name

3. **Save User:**
   - Click **"Create User"**
   - User will receive login credentials

#### Editing Users
1. **Find User:**
   - Go to **"Users"** page
   - Search for the user

2. **Edit Information:**
   - Click **"Edit"** button
   - Modify details as needed
   - Change role if necessary
   - Reset password if needed

3. **Save Changes:**
   - Click **"Update User"**

#### Deactivating Users
1. **Access User:**
   - Go to **"Users"** page
   - Find the user to deactivate

2. **Deactivate:**
   - Click **"Deactivate"** button
   - Confirm the action
   - User will lose access immediately

### Profile Management

#### Updating Your Profile
1. **Access Profile:**
   - Click your name in the top-right corner
   - Select **"Profile"**

2. **Edit Information:**
   - Update your name
   - Change your email
   - Update your password

3. **Save Changes:**
   - Click **"Update Profile"**

---

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
**Issue:** Cannot log in with correct credentials
**Solutions:**
1. Check email and password spelling
2. Ensure Caps Lock is off
3. Clear browser cache and cookies
4. Try a different browser
5. Contact administrator if problem persists

#### Shopify Connection Issues
**Issue:** "Store not connected" error
**Solutions:**
1. Ensure Shopify app credentials are configured in server environment
2. Complete the OAuth flow by clicking "Install app" on Shopify
3. Check if the store name format is correct (e.g., `store.myshopify.com`)
4. Ensure you have admin access to the Shopify store
5. Try disconnecting and reconnecting the store
6. Check internet connection

**Issue:** "Shopify API key not configured" error
**Solutions:**
1. Contact administrator to verify environment variables are set
2. Ensure `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are in `.env.local`
3. Verify `FEATURE_SHOPIFY=true` is set
4. Administrator should restart the application after adding variables

**Issue:** "Permission denied" when publishing
**Solutions:**
1. Verify the OAuth connection was completed successfully
2. Check if store is active in Shopify
3. Ensure you granted all required permissions during OAuth
4. Reconnect the store if permissions were denied

#### Publishing Problems
**Issue:** Comics not appearing in Shopify
**Solutions:**
1. Check job status in "Job History"
2. Look for error messages in job details
3. Verify comic has all required fields
4. Check Shopify store settings
5. Retry failed jobs

**Issue:** "Image processing failed"
**Solutions:**
1. Ensure image file is not corrupted
2. Check image file size (should be under 10MB)
3. Verify image format (JPG, PNG, GIF)
4. Try uploading a different image

#### Export Issues
**Issue:** Export file is empty
**Solutions:**
1. Check if you have comics in your catalog
2. Verify search filters aren't too restrictive
3. Try exporting a smaller date range
4. Check browser download settings

**Issue:** CSV format errors in Shopify
**Solutions:**
1. Ensure you're using the latest export format
2. Check for special characters in comic data
3. Verify all required fields are filled
4. Try exporting a single comic first

#### Performance Issues
**Issue:** Slow loading or timeouts
**Solutions:**
1. Check internet connection speed
2. Clear browser cache
3. Try a different browser
4. Reduce the number of comics displayed
5. Contact support if problem persists

### Error Messages

#### "Access Denied"
- **Cause:** Insufficient permissions for the action
- **Solution:** Contact administrator to update your role

#### "Store Connection Failed"
- **Cause:** OAuth flow not completed, invalid store name, or missing environment variables
- **Solution:** Ensure server has Shopify credentials configured, complete OAuth authorization on Shopify, and verify store name format is correct

#### "Publishing Failed"
- **Cause:** Missing required fields or Shopify API issues
- **Solution:** Check comic data completeness and retry

#### "Export Failed"
- **Cause:** Too many items or system resource limits
- **Solution:** Try exporting smaller batches or contact support

---

## Support

### Getting Help

#### Self-Service Resources
1. **User Manual:** This document
2. **FAQ Section:** Common questions and answers
3. **Video Tutorials:** Step-by-step guides
4. **Knowledge Base:** Detailed technical information

#### Contact Support
**Email Support:** support@yourdomain.com
**Response Time:** 24-48 hours during business days

**When contacting support, include:**
- Your account email
- Description of the issue
- Steps to reproduce the problem
- Screenshots if applicable
- Browser and operating system information

#### Emergency Support
**Phone:** +1-XXX-XXX-XXXX (Business hours only)
**Live Chat:** Available on the website during business hours

### System Status
**Status Page:** https://status.yourdomain.com
**Maintenance Notices:** Check the status page for scheduled maintenance

### Feature Requests
**Submit Ideas:** features@yourdomain.com
**Vote on Features:** Community feature voting system
**Roadmap:** Public development roadmap available

---

## Appendix

### Keyboard Shortcuts
- **Ctrl + F:** Search comics
- **Ctrl + N:** Add new comic
- **Ctrl + E:** Export comics
- **Esc:** Close modals/dialogs

### Browser Compatibility
- **Chrome:** Version 90+
- **Firefox:** Version 88+
- **Safari:** Version 14+
- **Edge:** Version 90+

### Mobile Access
- Responsive design works on tablets
- Full functionality on mobile devices
- Touch-friendly interface
- Optimized for portrait and landscape modes

### Data Backup
- Automatic daily backups
- Export your data regularly
- Keep local copies of important exports
- Contact support for data recovery if needed

### Quick Reference
**Required Information for Shopify Connection:**
- **Shopify Store URL:** `https://yourstore.myshopify.com`
- **Store Name:** `yourstore.myshopify.com` (for OAuth connection)
- **App URL:** `https://yourdomain.com`
- **OAuth Redirect URL:** `https://yourdomain.com/api/shopify/callback`
- **Shopify App Credentials:** Client ID and Client Secret from Partners dashboard

**Setup Process:**
1. Create Shopify app in Partners dashboard
2. Get Client ID and Client Secret
3. Provide credentials to administrator for server configuration
4. Administrator adds environment variables and restarts app
5. Enter store name in the app
6. Click "Connect Store"
7. Complete OAuth on Shopify
8. Return to app automatically

**Environment Variables (Admin Only):**
```env
FEATURE_SHOPIFY=true
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

**Last Updated:** [Current Date]
**Version:** 1.0
**Document Owner:** Comic Catalog Manager Team

For the most up-to-date information, visit our documentation website or contact support.

# Image Upload Setup Guide

## Issue: "Failed to upload image" Error

The image upload functionality requires proper Supabase Storage configuration. Follow these steps to fix the issue:

## Step 1: Run Database Scripts

1. **Add image_url column to comics table:**
   ```sql
   -- Run this in your Supabase SQL editor
   ALTER TABLE public.comics 
   ADD COLUMN IF NOT EXISTS image_url TEXT;
   ```

2. **Set up storage policies:**
   ```sql
   -- Run this in your Supabase SQL editor
   -- (The full script is in scripts/029_setup_storage_bucket.sql)
   ```

## Step 2: Create Storage Bucket

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage**
3. **Click "New bucket"**
4. **Configure the bucket:**
   - **Name:** `comic-images`
   - **Public:** ✅ (checked) - This allows direct access to images
   - **File size limit:** 50MB (or your preference)
   - **Allowed MIME types:** `image/jpeg,image/jpg,image/png,image/webp`

## Step 3: Set Up Storage Policies

**⚠️ IMPORTANT:** Storage policies must be created through the Supabase Dashboard, not SQL!

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage → Policies**
3. **Click "New Policy" for the `comic-images` bucket**
4. **Create these policies one by one:**

#### Policy 1: Allow users to upload images
- **Policy name:** `Users can upload comic images`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **Policy definition:**
  ```sql
  bucket_id = 'comic-images' 
  AND (storage.foldername(name))[1] = 'comic-covers'
  ```

#### Policy 2: Allow users to view their own images
- **Policy name:** `Users can view their own comic images`
- **Allowed operation:** `SELECT`
- **Target roles:** `authenticated`
- **Policy definition:**
  ```sql
  bucket_id = 'comic-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
  ```

#### Policy 3: Allow users to update their own images
- **Policy name:** `Users can update their own comic images`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **Policy definition:**
  ```sql
  bucket_id = 'comic-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
  ```

#### Policy 4: Allow users to delete their own images
- **Policy name:** `Users can delete their own comic images`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **Policy definition:**
  ```sql
  bucket_id = 'comic-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
  ```

### Method 2: Alternative - Make Bucket Public (Simpler) ⭐ RECOMMENDED

If you want to skip the complex policies, you can make the bucket public:

1. **Go to Storage → Buckets**
2. **Click on the `comic-images` bucket**
3. **Toggle "Public bucket" to ON**
4. **This allows anyone to read images, but only authenticated users can upload**

**Note:** This is less secure but easier to set up for development.

### Method 3: Quick Fix for RLS Policy Error

If you're getting "new row violates row-level security policy" error:

1. **Go to Storage → Policies**
2. **Find the `comic-images` bucket**
3. **Delete all existing policies** (if any)
4. **Make the bucket public** (Method 2 above)
5. **OR create a simple policy:**

   **Policy Name:** `Allow authenticated uploads`
   **Operation:** `INSERT`
   **Target Roles:** `authenticated`
   **Policy Definition:**
   ```sql
   bucket_id = 'comic-images'
   ```

## Step 4: Test the Upload

1. **Save a comic first** (the image upload only appears after saving)
2. **Try uploading an image** - it should now work!

## Troubleshooting

### Common Error Messages:

1. **"Storage bucket 'comic-images' not found"**
   - Solution: Create the bucket in Supabase Dashboard > Storage

2. **"Permission denied"**
   - Solution: Check that the storage policies are set up correctly

3. **"Comic must be saved before uploading images"**
   - Solution: Save the comic first, then upload the image

4. **"File too large"**
   - Solution: Use images smaller than 10MB

### File Requirements:
- **Supported formats:** JPEG, PNG, WebP
- **Maximum size:** 10MB
- **Recommended dimensions:** 300x400px (3:4 aspect ratio)

## How It Works

1. **User saves comic** → Comic gets an ID
2. **Image upload becomes available** → User can upload cover image
3. **Image is stored** in `comic-images/comic-covers/{user_id}/{filename}`
4. **Image URL is saved** to the comic record
5. **Image displays** in comics grid and detail pages

## Security

- Users can only upload/access their own images
- Images are organized by user ID in the storage bucket
- RLS policies ensure proper access control
- File type and size validation on both client and server

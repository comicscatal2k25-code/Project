# 🚨 URGENT: Fix Storage RLS Policy Error

## Current Error:
```
"new row violates row-level security policy"
```

## ✅ STEP-BY-STEP FIX:

### Step 1: Check Your Bucket Status
1. Go to **Supabase Dashboard**
2. Navigate to **Storage → Buckets**
3. Find the `comic-images` bucket
4. **Check if it's marked as "Public"**

### Step 2: Make Bucket Public (EASIEST FIX)
1. Click on the `comic-images` bucket
2. **Toggle "Public bucket" to ON** ✅
3. **Click "Save"**
4. This should immediately fix the issue

### Step 3: If Step 2 Doesn't Work - Check Policies
1. Go to **Storage → Policies**
2. Look for any policies related to `comic-images`
3. **Delete ALL existing policies** for this bucket
4. Go back to **Storage → Buckets**
5. Make sure the bucket is **Public**

### Step 4: Alternative - Create Simple Policy
If making it public doesn't work:

1. Go to **Storage → Policies**
2. Click **"New Policy"**
3. Select the `comic-images` bucket
4. Fill in:
   - **Policy name:** `Allow all authenticated users`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **Policy definition:** `true`
5. **Save the policy**

### Step 5: Test Again
1. Go to `/test-upload`
2. Enter a comic ID
3. Upload an image
4. Should work now!

## 🔍 TROUBLESHOOTING:

### If you can't find the bucket:
- The bucket doesn't exist
- **Solution:** Create it in Storage → Buckets → New bucket → Name: `comic-images` → Make it public

### If the bucket exists but still gives errors:
- RLS policies are blocking uploads
- **Solution:** Make bucket public OR create simple INSERT policy

### If you get "Bucket not found" error:
- The bucket name is wrong
- **Solution:** Check the exact name is `comic-images` (case-sensitive)

## 🎯 QUICK CHECKLIST:
- [ ] Bucket `comic-images` exists
- [ ] Bucket is marked as "Public"
- [ ] No conflicting RLS policies
- [ ] Using correct comic ID
- [ ] Image file is valid (JPEG/PNG/WebP, <10MB)

## 📞 If Still Not Working:
1. **Screenshot your Storage → Buckets page**
2. **Screenshot your Storage → Policies page**
3. **Share the exact error message**
4. **Tell me which step you're stuck on**

The most common fix is simply making the bucket public! 🎯

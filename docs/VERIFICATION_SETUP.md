# Provider Verification System Setup

This document explains how to set up the provider verification system for the trust layer.

## Overview

The verification system allows providers to upload three types of documents:
1. **ID Document** - Government-issued identification
2. **Insurance Certificate** - Public liability insurance
3. **Qualifications** - Proof of qualifications or certifications

Admins can review and approve/reject these documents through the admin dashboard.

## Database Setup

1. Run the migration to create the `provider_verifications` table:

```bash
# The migration file is located at:
supabase/migrations/20250127_provider_verifications.sql
```

This migration:
- Creates the `provider_verifications` table
- Adds indexes for efficient queries
- Sets up RLS (Row Level Security) policies
- Adds triggers to automatically update overall status
- Adds `verification_status` column to `providers` table

## Supabase Storage Setup

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New bucket**
4. Name: `verifications`
5. **Public bucket**: Set to **Private** (recommended for security)
6. Click **Create bucket**

### 2. Configure Storage Policies

You need to set up policies so that:
- Providers can upload files to their own folder
- Providers can view their own files
- Admins can view all files (using service role key)

#### Policy 1: Providers can upload to their own folder

```sql
CREATE POLICY "Providers can upload own verification files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Providers can view their own files

```sql
CREATE POLICY "Providers can view own verification files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Admins can view all files (optional - uses service role)

Admins will use the service role key which bypasses RLS, so no policy is needed for admin access.

### 3. Alternative: Public Bucket (Less Secure)

If you prefer a public bucket for easier access:
1. Set the bucket to **Public** when creating it
2. Files will be accessible via public URLs
3. Note: This means anyone with the URL can access the files

## File Structure

Files are stored in the following structure:
```
verifications/
  {provider_id}/
    id_{timestamp}.{ext}
    insurance_{timestamp}.{ext}
    qualifications_{timestamp}.{ext}
```

## API Endpoints

### Provider Endpoints

- `POST /api/provider/verification/upload` - Upload a verification document
- `GET /api/provider/verification/status?provider_id={id}` - Get verification status

### Admin Endpoints

- `GET /api/admin/verifications?status={status}` - List verifications
- `POST /api/admin/verifications` - Approve or reject a verification

## Usage

### For Providers

1. Navigate to `/provider/verification`
2. Upload each required document (ID, Insurance, Qualifications)
3. Wait for admin review
4. Check status on the same page

### For Admins

1. Navigate to `/admin/verifications`
2. Review each uploaded document
3. Approve or reject individual documents or all at once
4. Add rejection reasons and notes

## Verification Status Flow

1. **not_verified** - No verification submitted
2. **pending** - Verification submitted, awaiting review
3. **in_review** - Some documents approved, others pending
4. **verified** - All documents approved
5. **rejected** - One or more documents rejected
6. **expired** - Verification has expired (if expiration is implemented)

## Security Considerations

1. **File Validation**: Files are validated for type (JPEG, PNG, WebP, PDF) and size (max 10MB)
2. **Access Control**: RLS policies ensure providers can only access their own files
3. **Admin Access**: Admins use service role key for full access
4. **Storage**: Files are stored in Supabase Storage with proper access controls

## Testing

1. Create a test provider account
2. Upload verification documents
3. Verify files appear in Supabase Storage
4. Test admin approval/rejection flow
5. Verify status updates correctly

## Troubleshooting

### Files not uploading
- Check storage bucket exists and is named `verifications`
- Verify storage policies are set correctly
- Check file size and type restrictions

### Admin can't view files
- Admins use service role key which bypasses RLS
- If using public bucket, files should be accessible
- If using private bucket, admins need signed URLs (not implemented yet)

### Status not updating
- Check database triggers are created
- Verify `overall_status` is being calculated correctly
- Check `sync_provider_verification_status` trigger is working

## Future Enhancements

- [ ] Signed URLs for private bucket access
- [ ] Email notifications when verification is approved/rejected
- [ ] Verification expiration dates
- [ ] Document versioning (keep history of uploaded documents)
- [ ] Bulk approval/rejection
- [ ] Verification badges on provider profiles


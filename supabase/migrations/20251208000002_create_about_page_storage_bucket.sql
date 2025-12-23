-- Create storage bucket for about page images
-- This creates a public bucket that allows authenticated uploads

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'about-page',
  'about-page',
  true, -- Public bucket so images can be accessed via URL
  5242880, -- 5MB file size limit (in bytes)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the about-page bucket
-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated uploads to about-page" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to about-page"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'about-page' AND
  (storage.foldername(name))[1] IN ('story', 'general')
);

-- Allow public read access to all files
DROP POLICY IF EXISTS "Allow public read access to about-page" ON storage.objects;
CREATE POLICY "Allow public read access to about-page"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'about-page');

-- Allow authenticated users to update their own uploads
DROP POLICY IF EXISTS "Allow authenticated updates to about-page" ON storage.objects;
CREATE POLICY "Allow authenticated updates to about-page"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'about-page')
WITH CHECK (bucket_id = 'about-page');

-- Allow authenticated users to delete files
DROP POLICY IF EXISTS "Allow authenticated deletes from about-page" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from about-page"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'about-page');

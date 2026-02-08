-- Enable RLS on storage.objects (no longer needed apparently as its now the default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated users to read objects from all buckets
CREATE POLICY "Allow public read access on images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Allow public read access on videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'videos');

CREATE POLICY "Allow public read access on exercise_videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'exercise_videos');

CREATE POLICY "Allow public read access on exercise_pictures"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'exercise_pictures');

CREATE POLICY "Allow public read access on tutorial_videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'tutorial_videos');

CREATE POLICY "Allow public read access on tutorial_pictures"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'tutorial_pictures');

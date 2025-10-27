CREATE TABLE IF NOT EXISTS public.class_views (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL,
  user_id UUID,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_views_class_id ON public.class_views (class_id);

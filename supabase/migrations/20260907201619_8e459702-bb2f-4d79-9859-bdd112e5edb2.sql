ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS wa_provider TEXT NOT NULL DEFAULT 'callmebot',
  ADD COLUMN IF NOT EXISTS wa_base_url TEXT,
  ADD COLUMN IF NOT EXISTS wa_token TEXT;
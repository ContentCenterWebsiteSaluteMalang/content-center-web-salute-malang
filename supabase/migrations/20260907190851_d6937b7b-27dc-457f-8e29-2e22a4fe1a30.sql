CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  page TEXT NOT NULL,
  subpage TEXT,
  section TEXT NOT NULL,
  konten_text TEXT,
  media_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  referensi TEXT,
  screenshot_mobile TEXT,
  screenshot_desktop TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
GRANT ALL ON public.content_items TO service_role;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own content" ON public.content_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notification_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  email_address TEXT,
  wa_enabled BOOLEAN NOT NULL DEFAULT false,
  wa_number TEXT,
  wa_api_key TEXT,
  notify_new BOOLEAN NOT NULL DEFAULT true,
  notify_status BOOLEAN NOT NULL DEFAULT true,
  notify_notes BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification settings" ON public.notification_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
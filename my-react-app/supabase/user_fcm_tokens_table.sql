-- Tabel untuk menyimpan FCM token per user (untuk push notification)
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android', -- 'android' | 'ios' | 'web'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_token ON user_fcm_tokens(token);

-- RLS (untuk app dengan custom auth, allow insert/update dari anon - token disimpan saat user login)
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert update FCM tokens" ON user_fcm_tokens;
CREATE POLICY "Allow insert update FCM tokens" ON user_fcm_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger update updated_at
CREATE OR REPLACE FUNCTION update_user_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_fcm_tokens_updated_at ON user_fcm_tokens;
CREATE TRIGGER user_fcm_tokens_updated_at
  BEFORE UPDATE ON user_fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION update_user_fcm_tokens_updated_at();

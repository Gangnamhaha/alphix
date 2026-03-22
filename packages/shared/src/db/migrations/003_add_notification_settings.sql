CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) UNIQUE,
  encrypted_slack_webhook TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notification_settings" ON notification_settings
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

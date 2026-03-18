CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free'
);

CREATE TABLE IF NOT EXISTS broker_configs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  broker_type TEXT NOT NULL,
  encrypted_api_key TEXT,
  encrypted_secret TEXT,
  is_active BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name TEXT,
  type TEXT,
  params JSONB,
  broker_config_id INT REFERENCES broker_configs(id),
  is_active BOOLEAN DEFAULT false,
  is_paper BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  strategy_id INT REFERENCES strategies(id),
  broker_type TEXT,
  symbol TEXT,
  side TEXT,
  quantity NUMERIC,
  price NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  broker_type TEXT,
  symbol TEXT,
  quantity NUMERIC,
  avg_price NUMERIC,
  current_price NUMERIC,
  pnl NUMERIC
);

CREATE TABLE IF NOT EXISTS backtest_results (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  strategy_id INT REFERENCES strategies(id),
  params JSONB,
  result_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  toss_customer_key TEXT,
  current_period_end TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  type TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  strategy_id INT REFERENCES strategies(id),
  action TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON users
  FOR ALL
  USING (id = auth.uid()::int)
  WITH CHECK (id = auth.uid()::int);

CREATE POLICY "users_own_data" ON broker_configs
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "users_own_data" ON strategies
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "users_own_data" ON orders
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "users_own_data" ON positions
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "users_own_data" ON backtest_results
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "users_own_data" ON subscriptions
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "users_own_data" ON notifications
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "users_own_data" ON trade_logs
  FOR ALL
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

ALTER TABLE bots ADD COLUMN telegram_bot_token text;
ALTER TABLE bots ADD COLUMN telegram_enabled boolean DEFAULT false;

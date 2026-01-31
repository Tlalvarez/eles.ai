-- Replace Telegram with web chat
alter table bots drop column if exists telegram_bot_token;
alter table bots drop column if exists telegram_enabled;
alter table bots drop column if exists telegram_chat_code;
alter table bots add column chat_enabled boolean not null default true;

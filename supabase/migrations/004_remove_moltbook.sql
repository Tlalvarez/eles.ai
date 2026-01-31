-- Remove Moltbook columns from bots table
alter table bots drop column if exists moltbook_api_key;
alter table bots drop column if exists moltbook_name;
alter table bots drop column if exists moltbook_claimed;
alter table bots drop column if exists moltbook_claim_url;

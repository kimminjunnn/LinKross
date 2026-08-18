begin;

create table if not exists public.github_webhook_deliveries (
  delivery_id text primary key check (char_length(delivery_id) between 1 and 100),
  event_type text not null check (char_length(event_type) between 1 and 100),
  action text check (action is null or char_length(action) between 1 and 100),
  installation_id bigint check (installation_id is null or installation_id > 0),
  repository_ids bigint[] not null default '{}',
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists github_webhook_deliveries_installation_idx
  on public.github_webhook_deliveries (installation_id, received_at desc);

alter table public.github_webhook_deliveries enable row level security;
revoke all on public.github_webhook_deliveries from anon, authenticated;

commit;

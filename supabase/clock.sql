-- Run after the app is reachable over HTTPS, not from a laptop address.
-- In Vault, store clock_url (https://example.com/api/clock) and clock_secret.
-- clock_secret is the same value as CRON_SECRET on the server. Neither belongs in the app bundle.
-- The job runs every minute. The app still waits out each person's interval, usually 5 minutes.

select cron.schedule(
  'route-on-time-clock',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'clock_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'clock_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  ) as request_id;
  $$
);

select cron.schedule(
  'advance-virtual-buoys-every-10-minutes',
  '*/10 * * * *',
  $job$
    select net.http_post(
      url := 'https://dbsuryesimzatxhznurh.supabase.co/functions/v1/advance-virtual-buoys',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-vbuoy-scheduler-token', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'vbuoy_scheduler_token'
        )
      ),
      body := jsonb_build_object('action', 'advance'),
      timeout_milliseconds := 10000
    );
  $job$
);

-- This file schedules a cron job.
-- It is not a standard schema migration, but it is included here to automate the setup process.
-- This command is idempotent, so it can be run multiple times without causing issues.

-- This command creates the job if it does not exist, or updates it if it does exist.
SELECT cron.schedule(
  'equipment-maintenance-notifications',
  '0 2 * * *',
  $$
  SELECT invoke_cron_job('equipment-maintenance-notifications');
  $$
);
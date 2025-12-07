-- Add wizard-specific fields to provider_onboarding table
-- This migration is non-destructive: only adds new columns with safe defaults

-- Add current_step column to track which wizard step the provider is on
alter table public.provider_onboarding
  add column if not exists current_step text default 'step-1-account';

-- Add saved_data column to store draft form data per step
alter table public.provider_onboarding
  add column if not exists saved_data jsonb default '{}'::jsonb;

-- Create index for faster lookups by current_step
create index if not exists provider_onboarding_current_step_idx
  on public.provider_onboarding(current_step)
  where current_step is not null;

-- Add comment for documentation
comment on column public.provider_onboarding.current_step is 'Current wizard step ID (e.g., step-1-account, step-2-business, etc.)';
comment on column public.provider_onboarding.saved_data is 'Draft form data stored per step as JSON object';


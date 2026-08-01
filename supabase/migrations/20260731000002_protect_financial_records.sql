-- ---------------------------------------------------------------------------
-- H6: Protect financial audit trail from cascade deletion (2026-07-31 audit)
--
-- sellers.id -> profiles(id) ON DELETE CASCADE chains through
-- subscriptions/payments/invoices (all ON DELETE CASCADE on the seller/
-- payment reference), so deleting a profile silently destroys billing and
-- GST-relevant invoice history with no archival step — contradicting the
-- documented retention policy for financial/audit records.
--
-- Fix: change the three financial FKs from CASCADE to RESTRICT. A
-- profile/seller with billing history can no longer be deleted at all
-- (the delete will fail with a foreign-key violation) until that history is
-- explicitly archived or reassigned — turning a silent, irreversible data
-- loss into a deliberate, blocked action. sellers.id -> profiles(id) itself
-- is left untouched: RESTRICT further down the chain is sufficient to stop
-- the cascade from ever reaching financial data.
--
-- Constraint names are looked up dynamically (not hardcoded) because
-- `dealers`/`dealer_id` -> `sellers`/`seller_id` renames in the prior
-- migration do not rename the underlying auto-generated constraint names,
-- and this avoids guessing them.
-- ---------------------------------------------------------------------------

do $$
declare
  con record;
begin
  -- subscriptions.seller_id -> sellers(id)
  select c.conname into con
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'subscriptions' and c.contype = 'f'
    and c.conkey = (
      select array_agg(a.attnum order by a.attnum)
      from pg_attribute a
      where a.attrelid = t.oid and a.attname = 'seller_id'
    );
  if con.conname is not null then
    execute format('alter table public.subscriptions drop constraint %I', con.conname);
  end if;
  alter table public.subscriptions
    add constraint subscriptions_seller_id_fkey
    foreign key (seller_id) references public.sellers(id) on delete restrict;

  -- payments.seller_id -> sellers(id)
  select c.conname into con
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'payments' and c.contype = 'f'
    and c.conkey = (
      select array_agg(a.attnum order by a.attnum)
      from pg_attribute a
      where a.attrelid = t.oid and a.attname = 'seller_id'
    );
  if con.conname is not null then
    execute format('alter table public.payments drop constraint %I', con.conname);
  end if;
  alter table public.payments
    add constraint payments_seller_id_fkey
    foreign key (seller_id) references public.sellers(id) on delete restrict;

  -- invoices.payment_id -> payments(id)
  select c.conname into con
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'invoices' and c.contype = 'f'
    and c.conkey = (
      select array_agg(a.attnum order by a.attnum)
      from pg_attribute a
      where a.attrelid = t.oid and a.attname = 'payment_id'
    );
  if con.conname is not null then
    execute format('alter table public.invoices drop constraint %I', con.conname);
  end if;
  alter table public.invoices
    add constraint invoices_payment_id_fkey
    foreign key (payment_id) references public.payments(id) on delete restrict;
end $$;

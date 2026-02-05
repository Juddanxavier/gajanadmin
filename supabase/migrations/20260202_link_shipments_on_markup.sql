
-- Function to link shipments to a newly created user based on email
create or replace function public.link_shipments_to_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Check if the new user has an email
  if new.email is not null then
    -- Update shipments that have a matching customer email but no user_id
    update public.shipments
    set user_id = new.id
    where 
      customer_details->>'email' ilike new.email
      and user_id is null;
      
    -- Also update leads? Optional but helpful
    update public.leads
    set customer_id = new.id
    where 
      customer_email ilike new.email
      and customer_id is null;
  end if;
  return new;
end;
$$;

-- Trigger logic is tricky because we need to know WHEN to run it.
-- auth.users is not directly accessible for triggers in standard migrations unless we have permissions.
-- However, we can create a trigger on public.profiles if our system guarantees profile creation.
-- But shipments might be linked by auth.users insert.
-- Supabase allows triggers on auth.users if we are superuser (admin client in migration might work).

-- For safety in this project structure, we often use `public.profiles` as the anchor.
-- Assuming `handle_new_user` triggers profile creation, we can chain this.

-- Let's attach to public.profiles AFTER INSERT
drop trigger if exists on_profile_created_link_shipments on public.profiles;

create trigger on_profile_created_link_shipments
  after insert on public.profiles
  for each row execute procedure public.link_shipments_to_new_user();

-- Also, what if the user changes their email? 
-- Probably less critical for now, but handling UPDATE on users would need auth hook. 
-- We stick to INSERT on profiles (which implies new user).

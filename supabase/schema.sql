-- Mathestraße: Datenbank für den Lernfortschritt
-- Grundsatz: keine echten Namen. Kinder sind „Tier + Zahl“ plus ein geheimer QR-Schlüssel.
-- Kinder haben KEINEN direkten Zugriff auf Tabellen, nur über die Funktionen unten.

-- ---------- Tabellen ----------
create table public.kinder (
  id          uuid primary key default gen_random_uuid(),
  tier        text not null check (char_length(tier) between 2 and 20),
  zahl        int  not null check (zahl between 100 and 999),
  token       text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  erstellt_am timestamptz not null default now(),
  unique (tier, zahl)
);

create table public.durchgaenge (
  id            uuid primary key,                 -- vom Gerät erzeugt: doppeltes Senden zählt nur einmal
  kind_id       uuid not null references public.kinder(id) on delete cascade,
  haus          int  not null check (haus between 1 and 999),
  raum          text not null check (raum ~ '^[a-z0-9-]{1,40}$'),
  sterne        int  not null check (sterne between 1 and 3),
  fehler        int  not null check (fehler between 0 and 999),
  dauer_s       int  not null check (dauer_s between 0 and 86400),
  einschaetzung text check (einschaetzung in ('leicht','mittel','schwer')),
  erstellt_am   timestamptz not null default now()
);
create index durchgaenge_kind_haus on public.durchgaenge (kind_id, haus);

create table public.lehrkraefte (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create schema if not exists private;
revoke all on schema private from public;

-- Fehlversuche bei „Tier + Zahl“ (Schutz gegen Durchprobieren), ohne IP oder andere Daten
create table private.fehlversuche (zeit timestamptz not null default now());

-- ---------- Zugriffsregeln ----------
alter table public.kinder      enable row level security;
alter table public.durchgaenge enable row level security;
alter table public.lehrkraefte enable row level security;
alter table private.fehlversuche enable row level security;

revoke all on public.kinder, public.durchgaenge, public.lehrkraefte from anon, authenticated;
grant select, delete on public.kinder      to authenticated;
grant update (token)  on public.kinder     to authenticated;
grant select, delete on public.durchgaenge to authenticated;
grant select          on public.lehrkraefte to authenticated;

create function private.ist_lehrkraft() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lehrkraefte l where l.user_id = (select auth.uid()));
$$;
revoke all on function private.ist_lehrkraft() from public;
grant usage on schema private to authenticated;
grant execute on function private.ist_lehrkraft() to authenticated;

create policy lehrkraft_liest_kinder on public.kinder
  for select to authenticated using ((select private.ist_lehrkraft()));
create policy lehrkraft_aendert_kinder on public.kinder
  for update to authenticated using ((select private.ist_lehrkraft())) with check ((select private.ist_lehrkraft()));
create policy lehrkraft_loescht_kinder on public.kinder
  for delete to authenticated using ((select private.ist_lehrkraft()));
create policy lehrkraft_liest_durchgaenge on public.durchgaenge
  for select to authenticated using ((select private.ist_lehrkraft()));
create policy lehrkraft_loescht_durchgaenge on public.durchgaenge
  for delete to authenticated using ((select private.ist_lehrkraft()));
create policy eigene_lehrkraft_zeile on public.lehrkraefte
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- Funktionen für Kinder ----------
create function private.profil(p_kind public.kinder) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'tier', p_kind.tier,
    'zahl', p_kind.zahl,
    'fortschritt', coalesce((
      select jsonb_agg(jsonb_build_object('haus', d.haus, 'raum', d.raum, 'sterne', d.sterne))
      from (
        select haus, raum, max(sterne) as sterne
        from public.durchgaenge
        where kind_id = p_kind.id
        group by haus, raum
      ) d
    ), '[]'::jsonb)
  );
$$;
revoke all on function private.profil(public.kinder) from public;

-- Anmeldung per QR-Schlüssel
create function public.kind_anmelden(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare k public.kinder;
begin
  select * into k from public.kinder where token = p_token;
  if not found then return null; end if;
  return private.profil(k);
end;
$$;

-- Anmeldung per Tier + Zahl (mit Bremse gegen Durchprobieren)
create function public.kind_anmelden_tier(p_tier text, p_zahl int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare k public.kinder; versuche int;
begin
  delete from private.fehlversuche where zeit < now() - interval '10 minutes';
  select count(*) into versuche from private.fehlversuche;
  if versuche >= 40 then
    return jsonb_build_object('ok', false, 'grund', 'pause');
  end if;
  select * into k from public.kinder where tier = p_tier and zahl = p_zahl;
  if not found then
    insert into private.fehlversuche default values;
    return jsonb_build_object('ok', false, 'grund', 'unbekannt');
  end if;
  return jsonb_build_object('ok', true, 'token', k.token) || private.profil(k);
end;
$$;

-- Ergebnis eines Zimmers speichern (zweiter Aufruf mit gleicher id ergänzt die Selbsteinschätzung)
create function public.durchgang_speichern(
  p_token text, p_id uuid, p_haus int, p_raum text, p_sterne int,
  p_fehler int, p_dauer int, p_einschaetzung text default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_kind uuid; v_heute int;
begin
  select id into v_kind from public.kinder where token = p_token;
  if v_kind is null then return false; end if;

  if not exists (select 1 from public.durchgaenge where id = p_id) then
    select count(*) into v_heute from public.durchgaenge
      where kind_id = v_kind and erstellt_am > now() - interval '1 day';
    if v_heute >= 400 then return false; end if;
  end if;

  insert into public.durchgaenge as d (id, kind_id, haus, raum, sterne, fehler, dauer_s, einschaetzung)
  values (p_id, v_kind, p_haus, p_raum, p_sterne, p_fehler, p_dauer, p_einschaetzung)
  on conflict (id) do update
    set einschaetzung = coalesce(excluded.einschaetzung, d.einschaetzung)
    where d.kind_id = excluded.kind_id;
  return true;
end;
$$;

-- ---------- Funktion für die Lehrkraft ----------
create function public.kinder_anlegen(p_anzahl int) returns setof public.kinder
language plpgsql security definer set search_path = '' as $$
declare
  tiere constant text[] := array['Fuchs','Igel','Eule','Bär','Hase','Löwe','Tiger','Frosch',
    'Pinguin','Koala','Panda','Affe','Katze','Hund','Pferd','Wal','Delfin','Biene',
    'Schildkröte','Elefant','Giraffe','Zebra','Otter','Faultier'];
  i int; neu public.kinder; v_tier text; v_zahl int;
begin
  if not private.ist_lehrkraft() then
    raise exception 'Nur für Lehrkräfte' using errcode = '42501';
  end if;
  if p_anzahl is null or p_anzahl < 1 or p_anzahl > 40 then
    raise exception 'Anzahl muss zwischen 1 und 40 liegen';
  end if;
  for i in 1..p_anzahl loop
    -- möglichst jedes Tier nur so oft wie nötig, damit sich Kinder gut unterscheiden
    select t into v_tier
      from unnest(tiere) t
      left join public.kinder k on k.tier = t
      group by t
      order by count(k.id), random()
      limit 1;
    loop
      v_zahl := 100 + floor(random() * 900)::int;
      exit when not exists (select 1 from public.kinder where tier = v_tier and zahl = v_zahl);
    end loop;
    insert into public.kinder (tier, zahl) values (v_tier, v_zahl) returning * into neu;
    return next neu;
  end loop;
end;
$$;

-- ---------- Rechte auf die Funktionen ----------
revoke all on function public.kind_anmelden(text) from public, anon, authenticated;
revoke all on function public.kind_anmelden_tier(text, int) from public, anon, authenticated;
revoke all on function public.durchgang_speichern(text, uuid, int, text, int, int, int, text) from public, anon, authenticated;
revoke all on function public.kinder_anlegen(int) from public, anon, authenticated;
grant execute on function public.kind_anmelden(text) to anon, authenticated;
grant execute on function public.kind_anmelden_tier(text, int) to anon, authenticated;
grant execute on function public.durchgang_speichern(text, uuid, int, text, int, int, int, text) to anon, authenticated;
grant execute on function public.kinder_anlegen(int) to authenticated;

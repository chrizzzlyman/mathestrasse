-- Mathestraße: tägliches Zeitlimit (Ergänzung zu schema.sql, danach ausführen)
-- Gespeichert werden nur: die Einstellung der Lehrkraft und je Kind die heute genutzten Sekunden.
-- Ältere Tage werden beim nächsten Üben des Kindes gelöscht.

-- ---------- Tabellen ----------
create table public.einstellungen (
  id             boolean primary key default true check (id),        -- genau eine Zeile
  tageslimit_min int check (tageslimit_min between 1 and 240),       -- leer = kein Limit
  zimmer_beenden boolean not null default true
);
insert into public.einstellungen default values;

create table private.nutzung (
  kind_id  uuid not null references public.kinder(id) on delete cascade,
  tag      date not null,
  sekunden int  not null check (sekunden between 0 and 86400),
  primary key (kind_id, tag)
);

-- ---------- Zugriffsregeln ----------
alter table public.einstellungen enable row level security;
alter table private.nutzung      enable row level security;

revoke all on public.einstellungen from anon, authenticated;
revoke all on private.nutzung from public, anon, authenticated;
grant select on public.einstellungen to authenticated;
grant update (tageslimit_min, zimmer_beenden) on public.einstellungen to authenticated;

create policy lehrkraft_liest_einstellungen on public.einstellungen
  for select to authenticated using ((select private.ist_lehrkraft()));
create policy lehrkraft_aendert_einstellungen on public.einstellungen
  for update to authenticated using ((select private.ist_lehrkraft())) with check ((select private.ist_lehrkraft()));

-- ---------- Funktionen ----------
-- Welche Regel gilt? Ohne Anmeldung lesbar: enthält nichts über Kinder.
create function public.zeitregel() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('limit_min', e.tageslimit_min, 'zimmer_beenden', e.zimmer_beenden)
  from public.einstellungen e;
$$;

-- Genutzte Sekunden dazuzählen (nie abziehen). Antwort: heutiger Stand und Regel.
create function public.zeit_melden(p_token text, p_tag date, p_sekunden int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_kind uuid;
  v_tag date := (now() at time zone 'Europe/Berlin')::date;
  v_plus int := least(greatest(coalesce(p_sekunden, 0), 0), 86400);
  v_summe int;
begin
  select id into v_kind from public.kinder where token = p_token;
  if v_kind is null then return null; end if;
  -- Zeit von einem früheren Tag (z. B. ohne Netz gesammelt) zählt nicht für heute
  if p_tag is null or p_tag < v_tag then v_plus := 0; end if;
  delete from private.nutzung where kind_id = v_kind and tag < v_tag;
  insert into private.nutzung as n (kind_id, tag, sekunden) values (v_kind, v_tag, v_plus)
  on conflict (kind_id, tag) do update set sekunden = least(n.sekunden + excluded.sekunden, 86400)
  returning n.sekunden into v_summe;
  return public.zeitregel() || jsonb_build_object('tag', v_tag, 'sekunden', v_summe);
end;
$$;

-- ---------- Rechte auf die Funktionen ----------
revoke all on function public.zeitregel() from public, anon, authenticated;
revoke all on function public.zeit_melden(text, date, int) from public, anon, authenticated;
grant execute on function public.zeitregel() to anon, authenticated;
grant execute on function public.zeit_melden(text, date, int) to anon, authenticated;

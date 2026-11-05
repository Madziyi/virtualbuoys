create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.buoys (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('west', 'central', 'east')),
  name text not null,
  description text not null,
  latitude double precision not null check (latitude between 41 and 43),
  longitude double precision not null check (longitude between -84 and -81),
  is_synthetic boolean not null default true check (is_synthetic),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.parameters (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  display_name text not null,
  standard_name text not null,
  description text not null,
  unit_symbol text not null,
  unit_provenance text not null,
  direction_convention text check (direction_convention in ('to', 'from')),
  is_relative boolean not null default false,
  created_at timestamptz not null default now(),
  check (not is_relative or unit_symbol = '1')
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  buoy_id uuid not null references public.buoys(id) on delete restrict,
  parameter_id uuid not null references public.parameters(id) on delete restrict,
  depth_m numeric(5,2) check (depth_m is null or depth_m > 0),
  created_at timestamptz not null default now()
);
create unique index channels_buoy_parameter_depth_unique
  on public.channels (buoy_id, parameter_id, coalesce(depth_m, -1));
create index channels_buoy_idx on public.channels (buoy_id);

create table public.observations (
  channel_id uuid not null references public.channels(id) on delete restrict,
  observed_at timestamptz not null,
  value double precision not null check (value > '-Infinity'::float8 and value < 'Infinity'::float8),
  provenance text not null default 'synthetic' check (provenance = 'synthetic'),
  created_at timestamptz not null default now(),
  primary key (channel_id, observed_at)
);
create index observations_observed_at_idx on public.observations (observed_at desc);

create table public.generator_state (
  singleton smallint primary key default 1 check (singleton = 1),
  seed integer not null,
  generator_version integer not null check (generator_version = 1),
  last_observed_at timestamptz not null,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.buoys enable row level security;
alter table public.parameters enable row level security;
alter table public.channels enable row level security;
alter table public.observations enable row level security;
alter table public.generator_state enable row level security;

create policy "public reads synthetic buoy definitions" on public.buoys
  for select to anon, authenticated using (is_synthetic and is_active);
create policy "public reads synthetic parameter catalogue" on public.parameters
  for select to anon, authenticated using (true);
create policy "public reads synthetic channels" on public.channels
  for select to anon, authenticated using (true);
create policy "public reads synthetic observations" on public.observations
  for select to anon, authenticated using (provenance = 'synthetic');

revoke all on public.buoys, public.parameters, public.channels, public.observations, public.generator_state from public, anon, authenticated;
grant select on public.buoys, public.parameters, public.channels, public.observations to anon, authenticated;
grant all on public.buoys, public.parameters, public.channels, public.observations, public.generator_state to service_role;

create view public.latest_observations with (security_invoker = true) as
select distinct on (c.id)
  b.slug as buoy_slug,
  b.name as buoy_name,
  p.key,
  p.display_name,
  p.unit_symbol,
  p.is_relative,
  p.direction_convention,
  c.depth_m,
  o.value,
  o.observed_at,
  o.provenance as data_source
from public.observations o
join public.channels c on c.id = o.channel_id
join public.buoys b on b.id = c.buoy_id
join public.parameters p on p.id = c.parameter_id
where b.is_active and b.is_synthetic
order by c.id, o.observed_at desc;
grant select on public.latest_observations to anon, authenticated;

create function public.commit_simulation_step(
  p_expected_at timestamptz,
  p_next_at timestamptz,
  p_state jsonb,
  p_observations jsonb
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_last timestamptz;
  v_inserted integer;
begin
  select last_observed_at into v_last
    from public.generator_state
    where singleton = 1
    for update;

  if not found or v_last is distinct from p_expected_at then
    return false;
  end if;
  if p_next_at <> v_last + interval '10 minutes'
     or p_next_at > date_bin(interval '10 minutes', clock_timestamp(), timestamptz '2000-01-01 00:00:00+00') then
    return false;
  end if;

  insert into public.observations (channel_id, observed_at, value, provenance)
  select c.id, p_next_at, x.value, 'synthetic'
  from jsonb_to_recordset(p_observations) as x(buoy_slug text, parameter_key text, depth_m numeric, value double precision)
  join public.buoys b on b.slug = x.buoy_slug
  join public.parameters p on p.key = x.parameter_key
  join public.channels c on c.buoy_id = b.id and c.parameter_id = p.id and c.depth_m is not distinct from x.depth_m
  on conflict (channel_id, observed_at) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted <> 69 then
    raise exception 'expected 69 new observations, inserted %', v_inserted using errcode = 'check_violation';
  end if;

  update public.generator_state
     set last_observed_at = p_next_at, state_json = p_state, updated_at = clock_timestamp()
   where singleton = 1;
  return true;
end;
$$;
revoke all on function public.commit_simulation_step(timestamptz, timestamptz, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.commit_simulation_step(timestamptz, timestamptz, jsonb, jsonb) to service_role;

insert into public.buoys (slug, name, description, latitude, longitude) values
  ('west', 'West Virtual Buoy', 'Synthetic educational station near the Essex County shore of western Lake Erie.', 42.025, -82.96),
  ('central', 'Central Virtual Buoy', 'Synthetic educational station near the Essex County shore of western Lake Erie.', 41.985, -82.72),
  ('east', 'East Virtual Buoy', 'Synthetic educational station near the Essex County shore of western Lake Erie.', 41.93, -82.49);

insert into public.parameters (key, display_name, standard_name, description, unit_symbol, unit_provenance, direction_convention, is_relative) values
  ('water_temperature', 'Water temperature', 'sea_water_temperature', 'Synthetic water temperature at the stated virtual depth.', '°C', 'Converted and presented in degrees Celsius.', null, false),
  ('current_speed', 'Current speed', 'sea_water_velocity', 'Speed derived from latent eastward and northward water velocity.', 'm/s', 'Derived from velocity components in metres per second.', null, false),
  ('current_direction', 'Current direction', 'sea_water_to_direction', 'Bearing of water motion, clockwise from true north.', '°', 'Derived from velocity components; direction is TO.', 'to', false),
  ('dissolved_oxygen_saturation', 'Dissolved oxygen saturation', 'fractional_saturation_of_oxygen_in_sea_water', 'Dissolved oxygen saturation, not dissolved oxygen concentration.', '%', 'Percent saturation.', null, false),
  ('phycocyanin', 'Phycocyanin', 'mass_concentration_of_phycocyanin_in_water', 'Synthetic cyanobacteria-associated pigment estimate.', 'µg/L', 'Calibrated to reference source distributions.', null, false),
  ('chlorophyll', 'Chlorophyll', 'mass_concentration_of_chlorophyll_a_in_water', 'Synthetic chlorophyll estimate; reference kg/m³ values are converted using 1 kg/m³ = 1,000,000 µg/L.', 'µg/L', 'Explicit conversion from historical kg/m³ reference values.', null, false),
  ('cdom', 'CDOM (relative signal)', 'colored_dissolved_organic_matter_relative_signal', 'Relative colored dissolved organic matter signal, not an absolute concentration.', '1', 'Dimensionless relative source scale; no absolute concentration is implied.', null, true),
  ('turbidity', 'Turbidity', 'sea_water_turbidity', 'Synthetic turbidity estimate at the stated virtual depth.', 'NTU', 'Nephelometric turbidity units.', null, false),
  ('air_temperature', 'Air temperature', 'air_temperature', 'Synthetic near-surface air temperature.', '°C', 'Presented in degrees Celsius.', null, false),
  ('barometric_pressure', 'Barometric pressure', 'air_pressure', 'Synthetic atmospheric pressure.', 'hPa', 'Presented in hectopascals.', null, false),
  ('wind_speed', 'Wind speed', 'wind_speed', 'Synthetic sustained wind speed.', 'm/s', 'Metres per second.', null, false),
  ('wind_gust', 'Wind gust', 'wind_speed_of_gust', 'Synthetic peak gust speed.', 'm/s', 'Metres per second; not below sustained wind.', null, false),
  ('wind_direction', 'Wind direction', 'wind_from_direction', 'Meteorological bearing clockwise from true north, indicating where wind comes from.', '°', 'Meteorological FROM convention.', 'from', false),
  ('significant_wave_height', 'Significant wave height', 'sea_surface_wave_significant_height', 'Synthetic significant wave height.', 'm', 'Metres.', null, false),
  ('wave_mean_period', 'Wave mean period', 'sea_surface_wave_mean_period', 'Synthetic mean wave period.', 's', 'Seconds.', null, false),
  ('wave_direction', 'Wave direction', 'sea_surface_wave_from_direction', 'Synthetic wave approach direction, clockwise from true north.', '°', 'Direction presented as FROM.', 'from', false);

with channel_catalogue(parameter_key, depth_m) as (values
  ('water_temperature', 1::numeric), ('water_temperature', 4), ('water_temperature', 8),
  ('current_speed', 1), ('current_speed', 4), ('current_speed', 8),
  ('current_direction', 1), ('current_direction', 4), ('current_direction', 8),
  ('dissolved_oxygen_saturation', 1), ('dissolved_oxygen_saturation', 8),
  ('phycocyanin', 1), ('chlorophyll', 1), ('cdom', 1), ('turbidity', 2),
  ('air_temperature', null), ('barometric_pressure', null), ('wind_speed', null), ('wind_gust', null), ('wind_direction', null),
  ('significant_wave_height', null), ('wave_mean_period', null), ('wave_direction', null)
)
insert into public.channels (buoy_id, parameter_id, depth_m)
select b.id, p.id, cc.depth_m
from public.buoys b cross join channel_catalogue cc
join public.parameters p on p.key = cc.parameter_key;

comment on table public.observations is 'Synthetic educational observations only; the production stream never stores raw reference buoy rows.';
comment on table public.generator_state is 'Server-only persistent state for the seeded normal-mode permanent stream.';
comment on view public.latest_observations is 'Public read path for the latest synthetic observation per channel.';

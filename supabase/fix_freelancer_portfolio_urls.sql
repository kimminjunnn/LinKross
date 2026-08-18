-- Supabase SQL Editor에서 실행.
-- freelancer_profiles.portfolio_url(단수, text) -> portfolio_urls(복수, text[])로 교체.
-- 아직 테스트 데이터뿐이라 기존 값은 보존하지 않고 컬럼을 다시 만든다.

alter table public.freelancer_profiles drop column if exists portfolio_url;
alter table public.freelancer_profiles add column portfolio_urls text[] not null default '{}';

-- PostgREST가 바뀐 스키마를 바로 인식하도록 캐시를 갱신한다.
notify pgrst, 'reload schema';

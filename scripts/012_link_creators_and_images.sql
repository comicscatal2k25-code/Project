-- Link creators to comics and add sample images
-- This script links the creators we created to the comics and adds placeholder images

-- Link creators to comics
INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'Amazing Fantasy' AND c.issue_number = '15' AND cr.name = 'Stan Lee' AND cr.role = 'Writer'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'Amazing Fantasy' AND c.issue_number = '15' AND cr.name = 'Steve Ditko' AND cr.role = 'Artist'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'The Amazing Spider-Man' AND c.issue_number = '1' AND cr.name = 'Stan Lee' AND cr.role = 'Writer'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'The Amazing Spider-Man' AND c.issue_number = '1' AND cr.name = 'Steve Ditko' AND cr.role = 'Artist'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'X-Men' AND c.issue_number = '1' AND cr.name = 'Stan Lee' AND cr.role = 'Writer'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'X-Men' AND c.issue_number = '1' AND cr.name = 'Jack Kirby' AND cr.role = 'Artist'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'Watchmen' AND c.issue_number = '1' AND cr.name = 'Alan Moore' AND cr.role = 'Writer'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'The Dark Knight Returns' AND c.issue_number = '1' AND cr.name = 'Frank Miller' AND cr.role = 'Writer'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'Spawn' AND c.issue_number = '1' AND cr.name = 'Todd McFarlane' AND cr.role = 'Artist'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_creators (comic_id, creator_id) 
SELECT c.id, cr.id
FROM public.comics c, public.creators cr
WHERE c.title = 'WildC.A.T.s' AND c.issue_number = '1' AND cr.name = 'Jim Lee' AND cr.role = 'Artist'
ON CONFLICT DO NOTHING;

-- Add sample images for comics (using placeholder URLs)
INSERT INTO public.comic_images (comic_id, url, alt_text, file_name, image_type, is_primary, created_at, updated_at)
SELECT 
  c.id,
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
  CONCAT(c.title, ' #', c.issue_number, ' cover'),
  CONCAT(LOWER(REPLACE(c.title, ' ', '-')), '-', c.issue_number, '-cover.jpg'),
  'cover',
  true,
  NOW(),
  NOW()
FROM public.comics c
WHERE c.title IN ('Amazing Fantasy', 'The Amazing Spider-Man', 'X-Men', 'Watchmen', 'The Dark Knight Returns', 'Spawn', 'WildC.A.T.s', 'Batman', 'Superman', 'Detective Comics')
ON CONFLICT DO NOTHING;

-- Add additional variant covers for some comics
INSERT INTO public.comic_images (comic_id, url, alt_text, file_name, image_type, is_primary, created_at, updated_at)
SELECT 
  c.id,
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
  CONCAT(c.title, ' #', c.issue_number, ' variant cover'),
  CONCAT(LOWER(REPLACE(c.title, ' ', '-')), '-', c.issue_number, '-variant.jpg'),
  'variant',
  false,
  NOW(),
  NOW()
FROM public.comics c
WHERE c.title IN ('The Amazing Spider-Man', 'X-Men', 'Batman')
AND c.issue_number IN ('1', '300', '121')
ON CONFLICT DO NOTHING;

-- Link tags to comics
INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.is_key_issue = true AND t.name = 'Key Issue'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.title IN ('Amazing Fantasy', 'X-Men', 'Detective Comics', 'Action Comics', 'Batman', 'Superman') 
AND c.issue_number IN ('15', '1', '27', '1', '1', '1')
AND t.name = 'First Appearance'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.title = 'The Amazing Spider-Man' AND c.issue_number = '121' AND t.name = 'Death of Character'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.title = 'Giant-Size X-Men' AND c.issue_number = '1' AND t.name = 'Team Formation'
ON CONFLICT DO NOTHING;

INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.title = 'The Amazing Spider-Man' AND c.issue_number = '300' AND t.name = 'First Appearance'
ON CONFLICT DO NOTHING;

-- Add some variant covers as tags
INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.title = 'The Amazing Spider-Man' AND c.issue_number = '300' AND t.name = 'Variant Cover'
ON CONFLICT DO NOTHING;

-- Add anniversary tags
INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.title = 'The Amazing Spider-Man' AND c.issue_number = '700' AND t.name = 'Anniversary Issue'
ON CONFLICT DO NOTHING;

-- Add final issue tags
INSERT INTO public.comic_tags (comic_id, tag_id)
SELECT c.id, t.id
FROM public.comics c, public.tags t
WHERE c.title = 'The Amazing Spider-Man' AND c.issue_number = '700' AND t.name = 'Final Issue'
ON CONFLICT DO NOTHING;

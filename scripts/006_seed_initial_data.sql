-- Insert some popular comic publishers
insert into public.publishers (name, description, website) values
  ('Marvel Comics', 'American comic book publisher and the flagship property of Marvel Entertainment', 'https://www.marvel.com'),
  ('DC Comics', 'American comic book publisher and the flagship unit of DC Entertainment', 'https://www.dccomics.com'),
  ('Image Comics', 'American comic book publisher and is the third largest comic book and graphic novel publisher', 'https://imagecomics.com'),
  ('Dark Horse Comics', 'American comic book, graphic novel, and manga publisher', 'https://www.darkhorse.com'),
  ('IDW Publishing', 'American publisher of comic books, graphic novels, art books, and comic strip collections', 'https://www.idwpublishing.com'),
  ('Boom! Studios', 'American comic book and graphic novel publisher', 'https://www.boom-studios.com'),
  ('Dynamite Entertainment', 'American comic book publisher', 'https://www.dynamite.com'),
  ('Valiant Entertainment', 'American comic book publisher', 'https://valiantentertainment.com')
on conflict (name) do nothing;

-- Insert some popular series (using publisher IDs)
insert into public.series (title, publisher_id, description, start_year, status)
select 
  'The Amazing Spider-Man',
  p.id,
  'The flagship Spider-Man comic series',
  1963,
  'ongoing'
from public.publishers p where p.name = 'Marvel Comics'
union all
select 
  'Batman',
  p.id,
  'The main Batman comic series',
  1940,
  'ongoing'
from public.publishers p where p.name = 'DC Comics'
union all
select 
  'The Walking Dead',
  p.id,
  'Post-apocalyptic horror comic series',
  2003,
  'completed'
from public.publishers p where p.name = 'Image Comics'
union all
select 
  'Hellboy',
  p.id,
  'Supernatural superhero comic series',
  1993,
  'ongoing'
from public.publishers p where p.name = 'Dark Horse Comics'
on conflict do nothing;

-- Insert default listing template
insert into public.listing_templates (user_id, name, title_template, description_template, tags_template, product_type, vendor, is_default)
select 
  auth.uid(),
  'Default Comic Template',
  '{{title}} #{{issue_number}} {{variant}} ({{publisher}}, {{publication_date}})',
  'Condition: {{condition}}\nGrade: {{grade}}\nPublication Date: {{publication_date}}\nPublisher: {{publisher}}\n\n{{description}}\n\nTags: {{tags}}',
  array['comics', 'collectibles', 'vintage'],
  'Comic Books',
  'Comic Collector',
  true
where auth.uid() is not null;

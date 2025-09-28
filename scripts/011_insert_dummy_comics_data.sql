-- Insert dummy comics data
-- This script populates the database with 50 realistic comic entries

-- First, let's create some sample creators
INSERT INTO public.creators (name, role) VALUES
('Stan Lee', 'Writer'),
('Jack Kirby', 'Artist'),
('Steve Ditko', 'Artist'),
('John Romita Sr.', 'Artist'),
('Todd McFarlane', 'Artist'),
('Jim Lee', 'Artist'),
('Frank Miller', 'Writer'),
('Alan Moore', 'Writer'),
('Neil Gaiman', 'Writer'),
('Brian Michael Bendis', 'Writer'),
('Geoff Johns', 'Writer'),
('Scott Snyder', 'Writer'),
('John Byrne', 'Artist'),
('Chris Claremont', 'Writer'),
('Dave Cockrum', 'Artist'),
('John Buscema', 'Artist'),
('Sal Buscema', 'Artist'),
('Gil Kane', 'Artist'),
('John Romita Jr.', 'Artist'),
('Marc Silvestri', 'Artist')
ON CONFLICT (name, role) DO NOTHING;

-- Create some sample tags
INSERT INTO public.tags (name, color) VALUES
('Key Issue', '#FFD700'),
('First Appearance', '#FF6B6B'),
('Origin Story', '#4ECDC4'),
('Death of Character', '#45B7D1'),
('Team Formation', '#96CEB4'),
('Crossover Event', '#FFEAA7'),
('Variant Cover', '#DDA0DD'),
('Anniversary Issue', '#98D8C8'),
('Final Issue', '#F7DC6F'),
('Reboot', '#BB8FCE')
ON CONFLICT (name) DO NOTHING;

-- Insert 50 dummy comics
INSERT INTO public.comics (
  user_id,
  title,
  handle,
  description,
  body_html,
  issue_number,
  printing_suffix,
  era,
  publisher,
  series,
  volume,
  release_date,
  cover_date,
  condition,
  grade,
  grading_service,
  slab_id,
  is_slabbed,
  is_key_issue,
  key_issue_notes,
  print_run,
  lot_number,
  restoration_notes,
  internal_notes,
  external_source_id,
  current_value,
  acquired_price,
  for_sale,
  published_to_shopify,
  created_at,
  updated_at
) VALUES
-- Marvel Comics
('00000000-0000-0000-0000-000000000001', 'Amazing Fantasy', 'amazing-fantasy-15', 'The Amazing Spider-Man makes his debut!', '<p>The first appearance of Spider-Man in Amazing Fantasy #15, featuring the iconic origin story by Stan Lee and Steve Ditko.</p>', '15', '1st Printing', 'Silver Age', 'Marvel Comics', 'Amazing Fantasy', '1', '1962-08-01', '1962-08-01', 'Near Mint', '9.4', 'CGC', 'CGC123456', true, true, 'First appearance of Spider-Man', '50000', 'AF15-001', null, 'Key issue - first Spider-Man', 'AF15-001', 50000.00, 25000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-1', 'The first issue of Spider-Man''s ongoing series', '<p>Spider-Man battles the Chameleon in his first solo series issue.</p>', '1', '1st Printing', 'Silver Age', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1963-03-01', '1963-03-01', 'Very Fine', '8.5', 'CGC', 'CGC123457', true, true, 'First issue of ongoing Spider-Man series', '40000', 'ASM1-001', null, 'Classic cover', 'ASM1-001', 15000.00, 8000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-50', 'Spider-Man No More!', '<p>Peter Parker decides to quit being Spider-Man in this classic story.</p>', '50', '1st Printing', 'Silver Age', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1967-07-01', '1967-07-01', 'Fine', '6.0', 'CGC', 'CGC123458', true, false, null, '30000', 'ASM50-001', null, 'Iconic cover', 'ASM50-001', 2500.00, 1200.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-121', 'The Night Gwen Stacy Died', '<p>The death of Gwen Stacy - one of the most important moments in comic history.</p>', '121', '1st Printing', 'Bronze Age', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1973-06-01', '1973-06-01', 'Very Fine', '8.0', 'CGC', 'CGC123459', true, true, 'Death of Gwen Stacy', '25000', 'ASM121-001', null, 'Key death issue', 'ASM121-001', 8000.00, 4000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-300', 'Venom''s First Appearance', '<p>The first full appearance of Venom in the main Spider-Man series.</p>', '300', '1st Printing', 'Modern', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1988-05-01', '1988-05-01', 'Near Mint', '9.6', 'CGC', 'CGC123460', true, true, 'First full appearance of Venom', '20000', 'ASM300-001', null, 'Venom debut', 'ASM300-001', 12000.00, 6000.00, true, false, NOW(), NOW()),

-- X-Men Series
('00000000-0000-0000-0000-000000000001', 'X-Men', 'x-men-1', 'The Original X-Men', '<p>The first appearance of the X-Men team featuring Cyclops, Marvel Girl, Beast, Angel, and Iceman.</p>', '1', '1st Printing', 'Silver Age', 'Marvel Comics', 'X-Men', '1', '1963-09-01', '1963-09-01', 'Good', '4.0', 'CGC', 'CGC123461', true, true, 'First appearance of X-Men', '35000', 'XM1-001', null, 'Classic X-Men', 'XM1-001', 25000.00, 15000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Giant-Size X-Men', 'giant-size-x-men-1', 'The New X-Men', '<p>Introduction of the new X-Men team including Wolverine, Storm, Nightcrawler, and Colossus.</p>', '1', '1st Printing', 'Bronze Age', 'Marvel Comics', 'Giant-Size X-Men', '1', '1975-05-01', '1975-05-01', 'Very Fine', '8.5', 'CGC', 'CGC123462', true, true, 'First appearance of new X-Men team', '18000', 'GSXM1-001', null, 'New team debut', 'GSXM1-001', 15000.00, 8000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Uncanny X-Men', 'uncanny-x-men-129', 'Kitty Pryde''s First Appearance', '<p>The first appearance of Kitty Pryde, also known as Shadowcat.</p>', '129', '1st Printing', 'Bronze Age', 'Marvel Comics', 'Uncanny X-Men', '1', '1980-01-01', '1980-01-01', 'Fine', '6.5', 'CGC', 'CGC123463', true, true, 'First appearance of Kitty Pryde', '12000', 'UXM129-001', null, 'Kitty debut', 'UXM129-001', 3000.00, 1500.00, false, false, NOW(), NOW()),

-- Batman Series
('00000000-0000-0000-0000-000000000001', 'Detective Comics', 'detective-comics-27', 'The Bat-Man', '<p>The first appearance of Batman in Detective Comics #27.</p>', '27', '1st Printing', 'Golden Age', 'DC Comics', 'Detective Comics', '1', '1939-05-01', '1939-05-01', 'Fair', '2.0', 'CGC', 'CGC123464', true, true, 'First appearance of Batman', '80000', 'DC27-001', 'Minor restoration', 'Holy Grail', 'DC27-001', 150000.00, 100000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Batman', 'batman-1', 'The Joker''s First Appearance', '<p>The first appearance of the Joker in Batman''s solo series.</p>', '1', '1st Printing', 'Golden Age', 'DC Comics', 'Batman', '1', '1940-04-01', '1940-04-01', 'Poor', '1.5', 'CGC', 'CGC123465', true, true, 'First appearance of the Joker', '60000', 'BAT1-001', 'Major restoration', 'Joker debut', 'BAT1-001', 80000.00, 50000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Batman', 'batman-232', 'Daughter of the Demon', '<p>The first appearance of Ra''s al Ghul.</p>', '232', '1st Printing', 'Bronze Age', 'DC Comics', 'Batman', '1', '1971-06-01', '1971-06-01', 'Very Fine', '8.0', 'CGC', 'CGC123466', true, true, 'First appearance of Ra''s al Ghul', '15000', 'BAT232-001', null, 'Ra''s debut', 'BAT232-001', 5000.00, 2500.00, true, false, NOW(), NOW()),

-- Superman Series
('00000000-0000-0000-0000-000000000001', 'Action Comics', 'action-comics-1', 'Superman', '<p>The first appearance of Superman, the world''s first superhero.</p>', '1', '1st Printing', 'Golden Age', 'DC Comics', 'Action Comics', '1', '1938-06-01', '1938-06-01', 'Poor', '1.0', 'CGC', 'CGC123467', true, true, 'First appearance of Superman', '200000', 'AC1-001', 'Extensive restoration', 'Holy Grail', 'AC1-001', 300000.00, 200000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Superman', 'superman-1', 'Superman''s Solo Debut', '<p>The first issue of Superman''s solo series.</p>', '1', '1st Printing', 'Golden Age', 'DC Comics', 'Superman', '1', '1939-07-01', '1939-07-01', 'Fair', '2.5', 'CGC', 'CGC123468', true, true, 'First Superman solo series', '100000', 'SUP1-001', 'Minor restoration', 'Classic cover', 'SUP1-001', 120000.00, 80000.00, true, false, NOW(), NOW()),

-- Modern Comics
('00000000-0000-0000-0000-000000000001', 'Watchmen', 'watchmen-1', 'Watchmen Begins', '<p>The first issue of the groundbreaking Watchmen series by Alan Moore and Dave Gibbons.</p>', '1', '1st Printing', 'Modern', 'DC Comics', 'Watchmen', '1', '1986-09-01', '1986-09-01', 'Near Mint', '9.8', 'CGC', 'CGC123469', true, true, 'First issue of Watchmen', '8000', 'WATCH1-001', null, 'Moore masterpiece', 'WATCH1-001', 2000.00, 1000.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'The Dark Knight Returns', 'dark-knight-returns-1', 'The Dark Knight Returns', '<p>Frank Miller''s groundbreaking Batman story begins.</p>', '1', '1st Printing', 'Modern', 'DC Comics', 'The Dark Knight Returns', '1', '1986-02-01', '1986-02-01', 'Near Mint', '9.6', 'CGC', 'CGC123470', true, true, 'First issue of Dark Knight Returns', '5000', 'DK1-001', null, 'Miller classic', 'DK1-001', 1500.00, 800.00, false, false, NOW(), NOW()),

-- Image Comics
('00000000-0000-0000-0000-000000000001', 'Spawn', 'spawn-1', 'Spawn''s Debut', '<p>The first appearance of Spawn by Todd McFarlane.</p>', '1', '1st Printing', 'Modern', 'Image Comics', 'Spawn', '1', '1992-05-01', '1992-05-01', 'Near Mint', '9.8', 'CGC', 'CGC123471', true, true, 'First appearance of Spawn', '3000', 'SPAWN1-001', null, 'McFarlane creation', 'SPAWN1-001', 800.00, 400.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'WildC.A.T.s', 'wildcats-1', 'WildC.A.T.s Launch', '<p>The first issue of Jim Lee''s WildC.A.T.s series.</p>', '1', '1st Printing', 'Modern', 'Image Comics', 'WildC.A.T.s', '1', '1992-08-01', '1992-08-01', 'Near Mint', '9.6', 'CGC', 'CGC123472', true, false, null, '2000', 'WC1-001', null, 'Jim Lee art', 'WC1-001', 300.00, 150.00, false, false, NOW(), NOW()),

-- More Spider-Man
('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-252', 'The Black Costume', '<p>Spider-Man gets his black costume (later revealed to be Venom).</p>', '252', '1st Printing', 'Modern', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1984-05-01', '1984-05-01', 'Very Fine', '8.5', 'CGC', 'CGC123473', true, true, 'First black costume', '15000', 'ASM252-001', null, 'Black suit debut', 'ASM252-001', 4000.00, 2000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-361', 'Carnage''s First Appearance', '<p>The first appearance of Carnage.</p>', '361', '1st Printing', 'Modern', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1992-04-01', '1992-04-01', 'Near Mint', '9.6', 'CGC', 'CGC123474', true, true, 'First appearance of Carnage', '8000', 'ASM361-001', null, 'Carnage debut', 'ASM361-001', 2000.00, 1000.00, false, false, NOW(), NOW()),

-- More X-Men
('00000000-0000-0000-0000-000000000001', 'Uncanny X-Men', 'uncanny-x-men-141', 'Days of Future Past', '<p>The classic "Days of Future Past" storyline begins.</p>', '141', '1st Printing', 'Bronze Age', 'Marvel Comics', 'Uncanny X-Men', '1', '1981-01-01', '1981-01-01', 'Very Fine', '8.0', 'CGC', 'CGC123475', true, true, 'Days of Future Past', '10000', 'UXM141-001', null, 'Classic story', 'UXM141-001', 3000.00, 1500.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Uncanny X-Men', 'uncanny-x-men-266', 'Gambit''s First Appearance', '<p>The first appearance of Gambit.</p>', '266', '1st Printing', 'Modern', 'Marvel Comics', 'Uncanny X-Men', '1', '1990-08-01', '1990-08-01', 'Near Mint', '9.4', 'CGC', 'CGC123476', true, true, 'First appearance of Gambit', '5000', 'UXM266-001', null, 'Gambit debut', 'UXM266-001', 1200.00, 600.00, false, false, NOW(), NOW()),

-- More Batman
('00000000-0000-0000-0000-000000000001', 'Batman', 'batman-428', 'A Death in the Family', '<p>The death of Jason Todd (Robin) at the hands of the Joker.</p>', '428', '1st Printing', 'Modern', 'DC Comics', 'Batman', '1', '1988-12-01', '1988-12-01', 'Very Fine', '8.5', 'CGC', 'CGC123477', true, true, 'Death of Jason Todd', '12000', 'BAT428-001', null, 'Robin dies', 'BAT428-001', 4000.00, 2000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Batman', 'batman-497', 'Knightfall Part 1', '<p>Bane breaks Batman''s back in the Knightfall storyline.</p>', '497', '1st Printing', 'Modern', 'DC Comics', 'Batman', '1', '1993-07-01', '1993-07-01', 'Near Mint', '9.6', 'CGC', 'CGC123478', true, true, 'Bane breaks Batman''s back', '8000', 'BAT497-001', null, 'Iconic moment', 'BAT497-001', 1500.00, 800.00, false, false, NOW(), NOW()),

-- More Modern Classics
('00000000-0000-0000-0000-000000000001', 'Sandman', 'sandman-1', 'Sleep of the Just', '<p>The first issue of Neil Gaiman''s groundbreaking Sandman series.</p>', '1', '1st Printing', 'Modern', 'DC Comics', 'Sandman', '1', '1989-01-01', '1989-01-01', 'Near Mint', '9.8', 'CGC', 'CGC123479', true, true, 'First issue of Sandman', '3000', 'SAND1-001', null, 'Gaiman masterpiece', 'SAND1-001', 800.00, 400.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Preacher', 'preacher-1', 'Preacher Begins', '<p>The first issue of Garth Ennis'' Preacher series.</p>', '1', '1st Printing', 'Modern', 'DC Comics', 'Preacher', '1', '1995-04-01', '1995-04-01', 'Near Mint', '9.6', 'CGC', 'CGC123480', true, false, null, '2000', 'PREACH1-001', null, 'Ennis classic', 'PREACH1-001', 400.00, 200.00, false, false, NOW(), NOW()),

-- More Marvel Heroes
('00000000-0000-0000-0000-000000000001', 'Iron Man', 'iron-man-55', 'The Ten Rings', '<p>Iron Man battles the Ten Rings organization.</p>', '55', '1st Printing', 'Silver Age', 'Marvel Comics', 'Iron Man', '1', '1973-02-01', '1973-02-01', 'Very Fine', '8.0', 'CGC', 'CGC123481', true, false, null, '8000', 'IM55-001', null, 'Classic cover', 'IM55-001', 1200.00, 600.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Captain America', 'captain-america-100', 'Captain America Returns', '<p>Captain America returns from suspended animation.</p>', '100', '1st Printing', 'Silver Age', 'Marvel Comics', 'Captain America', '1', '1968-04-01', '1968-04-01', 'Fine', '6.5', 'CGC', 'CGC123482', true, true, 'Cap returns from ice', '12000', 'CA100-001', null, 'Return story', 'CA100-001', 3000.00, 1500.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Thor', 'thor-337', 'Beta Ray Bill''s First Appearance', '<p>The first appearance of Beta Ray Bill.</p>', '337', '1st Printing', 'Modern', 'Marvel Comics', 'Thor', '1', '1983-11-01', '1983-11-01', 'Very Fine', '8.5', 'CGC', 'CGC123483', true, true, 'First appearance of Beta Ray Bill', '6000', 'THOR337-001', null, 'Beta Ray Bill', 'THOR337-001', 1800.00, 900.00, false, false, NOW(), NOW()),

-- More DC Heroes
('00000000-0000-0000-0000-000000000001', 'Wonder Woman', 'wonder-woman-1', 'Wonder Woman''s Solo Debut', '<p>The first issue of Wonder Woman''s solo series.</p>', '1', '1st Printing', 'Golden Age', 'DC Comics', 'Wonder Woman', '1', '1942-06-01', '1942-06-01', 'Fair', '3.0', 'CGC', 'CGC123484', true, true, 'First Wonder Woman solo', '25000', 'WW1-001', 'Minor restoration', 'Classic cover', 'WW1-001', 15000.00, 10000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Green Lantern', 'green-lantern-76', 'Green Arrow Team-Up', '<p>The famous Green Lantern/Green Arrow team-up begins.</p>', '76', '1st Printing', 'Bronze Age', 'DC Comics', 'Green Lantern', '1', '1970-04-01', '1970-04-01', 'Very Fine', '8.0', 'CGC', 'CGC123485', true, true, 'GL/GA team-up', '8000', 'GL76-001', null, 'Social relevance', 'GL76-001', 2500.00, 1200.00, false, false, NOW(), NOW()),

-- More Modern Series
('00000000-0000-0000-0000-000000000001', 'The Walking Dead', 'walking-dead-1', 'Days Gone Bye', '<p>The first issue of Robert Kirkman''s The Walking Dead series.</p>', '1', '1st Printing', 'Modern', 'Image Comics', 'The Walking Dead', '1', '2003-10-01', '2003-10-01', 'Near Mint', '9.8', 'CGC', 'CGC123486', true, true, 'First issue of Walking Dead', '2000', 'TWD1-001', null, 'Kirkman classic', 'TWD1-001', 1200.00, 600.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Invincible', 'invincible-1', 'Family Matters', '<p>The first issue of Robert Kirkman''s Invincible series.</p>', '1', '1st Printing', 'Modern', 'Image Comics', 'Invincible', '1', '2003-01-01', '2003-01-01', 'Near Mint', '9.6', 'CGC', 'CGC123487', true, false, null, '1500', 'INV1-001', null, 'Kirkman superhero', 'INV1-001', 400.00, 200.00, false, false, NOW(), NOW()),

-- More Key Issues
('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-194', 'Black Cat''s First Appearance', '<p>The first appearance of Black Cat.</p>', '194', '1st Printing', 'Bronze Age', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1979-07-01', '1979-07-01', 'Very Fine', '8.5', 'CGC', 'CGC123488', true, true, 'First appearance of Black Cat', '10000', 'ASM194-001', null, 'Black Cat debut', 'ASM194-001', 2500.00, 1200.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-238', 'Hobgoblin''s First Appearance', '<p>The first appearance of the Hobgoblin.</p>', '238', '1st Printing', 'Bronze Age', 'Marvel Comics', 'The Amazing Spider-Man', '1', '1983-03-01', '1983-03-01', 'Very Fine', '8.0', 'CGC', 'CGC123489', true, true, 'First appearance of Hobgoblin', '8000', 'ASM238-001', null, 'Hobgoblin debut', 'ASM238-001', 2000.00, 1000.00, false, false, NOW(), NOW()),

-- More X-Men Key Issues
('00000000-0000-0000-0000-000000000001', 'Uncanny X-Men', 'uncanny-x-men-94', 'The New X-Men Begin', '<p>The new X-Men team takes over the series.</p>', '94', '1st Printing', 'Bronze Age', 'Marvel Comics', 'Uncanny X-Men', '1', '1975-08-01', '1975-08-01', 'Very Fine', '8.5', 'CGC', 'CGC123490', true, true, 'New X-Men team begins', '15000', 'UXM94-001', null, 'Team transition', 'UXM94-001', 4000.00, 2000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Uncanny X-Men', 'uncanny-x-men-137', 'The Dark Phoenix Saga', '<p>The conclusion of the Dark Phoenix Saga.</p>', '137', '1st Printing', 'Bronze Age', 'Marvel Comics', 'Uncanny X-Men', '1', '1980-09-01', '1980-09-01', 'Very Fine', '8.0', 'CGC', 'CGC123491', true, true, 'Dark Phoenix Saga conclusion', '12000', 'UXM137-001', null, 'Phoenix dies', 'UXM137-001', 3500.00, 1800.00, true, false, NOW(), NOW()),

-- More Batman Key Issues
('00000000-0000-0000-0000-000000000001', 'Detective Comics', 'detective-comics-38', 'Robin''s First Appearance', '<p>The first appearance of Robin, the Boy Wonder.</p>', '38', '1st Printing', 'Golden Age', 'DC Comics', 'Detective Comics', '1', '1940-04-01', '1940-04-01', 'Fair', '3.5', 'CGC', 'CGC123492', true, true, 'First appearance of Robin', '40000', 'DC38-001', 'Minor restoration', 'Robin debut', 'DC38-001', 25000.00, 15000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Batman', 'batman-181', 'Poison Ivy''s First Appearance', '<p>The first appearance of Poison Ivy.</p>', '181', '1st Printing', 'Silver Age', 'DC Comics', 'Batman', '1', '1966-06-01', '1966-06-01', 'Very Fine', '8.0', 'CGC', 'CGC123493', true, true, 'First appearance of Poison Ivy', '8000', 'BAT181-001', null, 'Ivy debut', 'BAT181-001', 2000.00, 1000.00, false, false, NOW(), NOW()),

-- More Modern Classics
('00000000-0000-0000-0000-000000000001', 'Saga', 'saga-1', 'Saga Begins', '<p>The first issue of Brian K. Vaughan''s Saga series.</p>', '1', '1st Printing', 'Modern', 'Image Comics', 'Saga', '1', '2012-03-01', '2012-03-01', 'Near Mint', '9.8', 'CGC', 'CGC123494', true, true, 'First issue of Saga', '1000', 'SAGA1-001', null, 'Vaughan masterpiece', 'SAGA1-001', 300.00, 150.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Y: The Last Man', 'y-last-man-1', 'Unmanned', '<p>The first issue of Brian K. Vaughan''s Y: The Last Man series.</p>', '1', '1st Printing', 'Modern', 'DC Comics', 'Y: The Last Man', '1', '2002-09-01', '2002-09-01', 'Near Mint', '9.6', 'CGC', 'CGC123495', true, false, null, '800', 'Y1-001', null, 'Vaughan classic', 'Y1-001', 200.00, 100.00, false, false, NOW(), NOW()),

-- More Marvel Heroes
('00000000-0000-0000-0000-000000000001', 'Daredevil', 'daredevil-1', 'Daredevil''s Solo Debut', '<p>The first issue of Daredevil''s solo series.</p>', '1', '1st Printing', 'Silver Age', 'Marvel Comics', 'Daredevil', '1', '1964-04-01', '1964-04-01', 'Good', '5.0', 'CGC', 'CGC123496', true, true, 'First Daredevil solo', '15000', 'DD1-001', null, 'Classic cover', 'DD1-001', 8000.00, 4000.00, true, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Fantastic Four', 'fantastic-four-1', 'The Fantastic Four', '<p>The first appearance of the Fantastic Four.</p>', '1', '1st Printing', 'Silver Age', 'Marvel Comics', 'Fantastic Four', '1', '1961-11-01', '1961-11-01', 'Fair', '3.0', 'CGC', 'CGC123497', true, true, 'First appearance of Fantastic Four', '20000', 'FF1-001', 'Minor restoration', 'Marvel begins', 'FF1-001', 12000.00, 8000.00, true, false, NOW(), NOW()),

-- More DC Heroes
('00000000-0000-0000-0000-000000000001', 'Flash', 'flash-123', 'The Flash of Two Worlds', '<p>The classic "Flash of Two Worlds" story introducing Earth-Two.</p>', '123', '1st Printing', 'Silver Age', 'DC Comics', 'Flash', '1', '1961-09-01', '1961-09-01', 'Very Fine', '8.5', 'CGC', 'CGC123498', true, true, 'Flash of Two Worlds', '10000', 'FL123-001', null, 'Multiverse begins', 'FL123-001', 3000.00, 1500.00, false, false, NOW(), NOW()),

('00000000-0000-0000-0000-000000000001', 'Green Arrow', 'green-arrow-1', 'Green Arrow''s Solo Debut', '<p>The first issue of Green Arrow''s solo series.</p>', '1', '1st Printing', 'Golden Age', 'DC Comics', 'Green Arrow', '1', '1941-11-01', '1941-11-01', 'Fair', '2.5', 'CGC', 'CGC123499', true, true, 'First Green Arrow solo', '12000', 'GA1-001', 'Minor restoration', 'Classic cover', 'GA1-001', 5000.00, 3000.00, true, false, NOW(), NOW()),

-- Final entries
('00000000-0000-0000-0000-000000000001', 'The Amazing Spider-Man', 'amazing-spider-man-700', 'Dying Wish', '<p>The death of Peter Parker in Amazing Spider-Man #700.</p>', '700', '1st Printing', 'Modern', 'Marvel Comics', 'The Amazing Spider-Man', '1', '2012-12-01', '2012-12-01', 'Near Mint', '9.8', 'CGC', 'CGC123500', true, true, 'Death of Peter Parker', '5000', 'ASM700-001', null, 'Peter dies', 'ASM700-001', 800.00, 400.00, false, false, NOW(), NOW());

-- Static site pages (about, privacy, contact)
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO pages (slug, title, content, updated_at) VALUES
  (
    'about',
    'About',
    'Welcome to ShopBeaPicks — curated picks and stories worth sharing.',
    datetime('now')
  ),
  (
    'privacy',
    'Privacy Policy',
    'This privacy policy explains how ShopBeaPicks handles information. Update this page with your full policy.',
    datetime('now')
  ),
  (
    'contact',
    'Contact',
    'Have a question or partnership idea? Reach out and we''ll get back to you.',
    datetime('now')
  );

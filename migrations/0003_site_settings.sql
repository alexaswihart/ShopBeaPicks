-- Editable site copy (home heading / subtitle, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES
  ('homeTitle', 'Latest posts', datetime('now')),
  (
    'homeSubtitle',
    'Snippets from the ShopBeaPicks feed. Open a post to read the full story.',
    datetime('now')
  );

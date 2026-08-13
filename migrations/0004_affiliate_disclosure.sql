-- Affiliate disclosure copy + visibility toggle
INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES
  ('affiliateDisclosureEnabled', 'true', datetime('now')),
  ('affiliateDisclosureTitle', 'Affiliate disclosure', datetime('now')),
  (
    'affiliateDisclosureDescription',
    'As an Amazon Associate I earn from qualifying purchases.',
    datetime('now')
  );

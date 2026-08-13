import type { H3Event } from 'h3'
import type { SiteSettings, SiteSettingsInput, SiteSettingKey } from '#shared/types/siteSettings'
import { DEFAULT_SITE_SETTINGS, SITE_SETTING_KEYS } from '#shared/types/siteSettings'

type SettingRow = {
  key: string
  value: string
}

function parseEnabled(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === '') return fallback
  return value === 'true' || value === '1'
}

export async function getSiteSettings(event: H3Event): Promise<SiteSettings> {
  const { DB } = useCloudflareEnv(event)
  try {
    const { results } = await DB.prepare(
      `SELECT key, value FROM site_settings WHERE key IN (${SITE_SETTING_KEYS.map(() => '?').join(', ')})`
    )
      .bind(...SITE_SETTING_KEYS)
      .all<SettingRow>()

    const map = new Map((results || []).map(row => [row.key, row.value]))
    return {
      homeTitle: map.get('homeTitle')?.trim() || DEFAULT_SITE_SETTINGS.homeTitle,
      homeSubtitle: map.get('homeSubtitle')?.trim() || DEFAULT_SITE_SETTINGS.homeSubtitle,
      affiliateDisclosureEnabled: parseEnabled(
        map.get('affiliateDisclosureEnabled'),
        DEFAULT_SITE_SETTINGS.affiliateDisclosureEnabled
      ),
      affiliateDisclosureTitle:
        map.get('affiliateDisclosureTitle')?.trim() || DEFAULT_SITE_SETTINGS.affiliateDisclosureTitle,
      affiliateDisclosureDescription:
        map.get('affiliateDisclosureDescription')?.trim()
        || DEFAULT_SITE_SETTINGS.affiliateDisclosureDescription
    }
  } catch {
    // Table may not exist yet before migration is applied
    return { ...DEFAULT_SITE_SETTINGS }
  }
}

/** @deprecated Use getSiteSettings */
export const getHomeSettings = getSiteSettings

export async function updateSiteSettings(
  event: H3Event,
  input: SiteSettingsInput
): Promise<SiteSettings> {
  const current = await getSiteSettings(event)
  const next: SiteSettings = {
    homeTitle: input.homeTitle !== undefined
      ? (input.homeTitle.trim() || current.homeTitle)
      : current.homeTitle,
    homeSubtitle: input.homeSubtitle !== undefined
      ? input.homeSubtitle.trim()
      : current.homeSubtitle,
    affiliateDisclosureEnabled: input.affiliateDisclosureEnabled !== undefined
      ? Boolean(input.affiliateDisclosureEnabled)
      : current.affiliateDisclosureEnabled,
    affiliateDisclosureTitle: input.affiliateDisclosureTitle !== undefined
      ? (input.affiliateDisclosureTitle.trim() || current.affiliateDisclosureTitle)
      : current.affiliateDisclosureTitle,
    affiliateDisclosureDescription: input.affiliateDisclosureDescription !== undefined
      ? (input.affiliateDisclosureDescription.trim() || current.affiliateDisclosureDescription)
      : current.affiliateDisclosureDescription
  }

  if (!next.homeTitle) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }

  const { DB } = useCloudflareEnv(event)
  const now = new Date().toISOString()

  const upsert = async (key: SiteSettingKey, value: string) => {
    await DB.prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).bind(key, value, now).run()
  }

  // Only write fields present in the request so partial updates (home vs affiliate) stay safe
  if (input.homeTitle !== undefined) await upsert('homeTitle', next.homeTitle)
  if (input.homeSubtitle !== undefined) await upsert('homeSubtitle', next.homeSubtitle)
  if (input.affiliateDisclosureEnabled !== undefined) {
    await upsert('affiliateDisclosureEnabled', next.affiliateDisclosureEnabled ? 'true' : 'false')
  }
  if (input.affiliateDisclosureTitle !== undefined) {
    await upsert('affiliateDisclosureTitle', next.affiliateDisclosureTitle)
  }
  if (input.affiliateDisclosureDescription !== undefined) {
    await upsert('affiliateDisclosureDescription', next.affiliateDisclosureDescription)
  }

  return getSiteSettings(event)
}

/** @deprecated Use updateSiteSettings */
export const updateHomeSettings = updateSiteSettings

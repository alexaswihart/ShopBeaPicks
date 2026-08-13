export interface SiteSettings {
  homeTitle: string
  homeSubtitle: string
  affiliateDisclosureEnabled: boolean
  affiliateDisclosureTitle: string
  affiliateDisclosureDescription: string
}

export interface SiteSettingsInput {
  homeTitle?: string
  homeSubtitle?: string
  affiliateDisclosureEnabled?: boolean
  affiliateDisclosureTitle?: string
  affiliateDisclosureDescription?: string
}

/** @deprecated Use SiteSettings */
export type HomeSettings = SiteSettings
/** @deprecated Use SiteSettingsInput */
export type HomeSettingsInput = SiteSettingsInput

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  homeTitle: 'Latest posts',
  homeSubtitle: 'Snippets from the ShopBeaPicks feed. Open a post to read the full story.',
  affiliateDisclosureEnabled: true,
  affiliateDisclosureTitle: 'Affiliate disclosure',
  affiliateDisclosureDescription: 'As an Amazon Associate I earn from qualifying purchases.'
}

export const DEFAULT_HOME_SETTINGS = DEFAULT_SITE_SETTINGS

export const SITE_SETTING_KEYS = [
  'homeTitle',
  'homeSubtitle',
  'affiliateDisclosureEnabled',
  'affiliateDisclosureTitle',
  'affiliateDisclosureDescription'
] as const

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number]

/** @deprecated Use SITE_SETTING_KEYS */
export const HOME_SETTING_KEYS = SITE_SETTING_KEYS
export type HomeSettingKey = SiteSettingKey

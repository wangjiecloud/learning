import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import zh from './zh';
import en from './en';

const i18n = new I18n({ zh, en });

// 根据系统语言自动选择，默认中文
const systemLocale = getLocales()?.[0]?.languageCode ?? 'zh';
i18n.locale = systemLocale.startsWith('zh') ? 'zh' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'zh';

export default i18n;

export type Locale = 'zh' | 'en';

export function setLocale(locale: Locale) {
  i18n.locale = locale;
}

export function getLocale(): Locale {
  return (i18n.locale as Locale) || 'zh';
}

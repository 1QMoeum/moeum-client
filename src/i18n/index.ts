import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import ja from '@/locales/ja.json'
import ko from '@/locales/ko.json'
import vi from '@/locales/vi.json'
import zh from '@/locales/zh.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

/**
 * i18next 초기화. 우선순위:
 *   1. localStorage 'moeum-language' (사용자가 선택해 저장한 언어)
 *   2. navigator.language (브라우저 기본)
 *   3. fallback 'ko'
 *
 * SPA(Vite) 환경이라 next-i18next 가 아닌 react-i18next 를 사용한다.
 * 번역 키는 src/locales/{lang}.json — 모든 언어가 같은 구조(같은 키 셋)를 유지한다.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
      vi: { translation: vi },
    },
    fallbackLng: 'ko',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'moeum-language',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false }, // React 가 이미 escape 함
    react: {
      useSuspense: false, // resources 가 동기 import 라 Suspense 불필요 — fallback 없는 흰 화면 회피
    },
  })

export default i18n
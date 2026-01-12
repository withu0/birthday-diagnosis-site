import { useLanguage } from "./context"

/**
 * Hook to access translations
 * @returns Translation function and current language
 */
export function useTranslation() {
  const { t, language, setLanguage } = useLanguage()
  return { t, language, setLanguage }
}


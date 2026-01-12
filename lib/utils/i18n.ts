export type Language = "en" | "jp"

const LANGUAGE_COOKIE_NAME = "language"
const LANGUAGE_STORAGE_KEY = "language"

/**
 * Get language from cookie (server-side)
 */
export function getLanguageFromCookie(): Language | null {
  if (typeof document === "undefined") return null
  
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === LANGUAGE_COOKIE_NAME) {
      if (value === "en" || value === "jp") {
        return value
      }
    }
  }
  return null
}

/**
 * Get language from localStorage (client-side)
 */
export function getLanguageFromStorage(): Language | null {
  if (typeof window === "undefined") return null
  
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === "en" || stored === "jp") {
      return stored
    }
  } catch (e) {
    console.error("Error reading language from localStorage:", e)
  }
  return null
}

/**
 * Detect browser language
 */
export function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return "jp"
  
  const browserLang = navigator.language || (navigator as any).userLanguage
  if (browserLang.startsWith("en")) {
    return "en"
  }
  return "jp"
}

/**
 * Get initial language preference
 */
export function getInitialLanguage(): Language {
  // 1. Check localStorage
  const stored = getLanguageFromStorage()
  if (stored) return stored
  
  // 2. Check cookie
  const cookie = getLanguageFromCookie()
  if (cookie) return cookie
  
  // 3. Detect from browser
  return detectBrowserLanguage()
}

/**
 * Set language preference
 */
export function setLanguagePreference(language: Language): void {
  if (typeof window === "undefined") return
  
  try {
    // Save to localStorage
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    
    // Save to cookie (expires in 1 year)
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; expires=${expires.toUTCString()}; path=/`
  } catch (e) {
    console.error("Error saving language preference:", e)
  }
}


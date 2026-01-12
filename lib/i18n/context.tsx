"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Language } from "@/lib/utils/i18n"
import { getInitialLanguage, setLanguagePreference } from "@/lib/utils/i18n"
import enTranslations from "./translations/en.json"
import jpTranslations from "./translations/jp.json"

type Translations = typeof enTranslations

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Translations> = {
  en: enTranslations,
  jp: jpTranslations,
}

/**
 * Get nested translation value by dot notation key
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return getInitialLanguage()
    }
    return "jp" // Default for SSR
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    setLanguagePreference(lang)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translation = getNestedValue(translations[language], key) || key
      
      // Replace parameters if provided
      if (params) {
        return Object.entries(params).reduce(
          (text, [paramKey, paramValue]) =>
            text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue)),
          translation
        )
      }
      
      return translation
    },
    [language]
  )

  // Update html lang attribute when language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language === "en" ? "en" : "ja"
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}


"use client";

import { useState, useEffect, useCallback } from "react";
import { Language, translations } from "@/lib/i18n";

const STORAGE_KEY = "break-reminder-lang";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("en");
  // Track if we've hydrated from localStorage yet
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === "en" || saved === "ru") {
      setLanguage(saved);
    } else {
      const browserLang = navigator.language.toLowerCase();
      setLanguage(browserLang.startsWith("ru") ? "ru" : "en");
    }
    setHydrated(true);
  }, []);

  // FIX: never reload the page — just update state + localStorage
  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = translations[language];

  return { language, changeLanguage, t, hydrated };
}

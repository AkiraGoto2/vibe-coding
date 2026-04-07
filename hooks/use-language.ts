"use client";

import { useState, useEffect } from "react";
import { Language, translations } from "@/lib/i18n";

const STORAGE_KEY = "break-reminder-lang";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === "en" || saved === "ru") {
      setLanguage(saved);
    } else {
      // Auto-detect from browser
      const browserLang = navigator.language.toLowerCase();
      setLanguage(browserLang.startsWith("ru") ? "ru" : "en");
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = translations[language];

  return { language, changeLanguage, t };
}

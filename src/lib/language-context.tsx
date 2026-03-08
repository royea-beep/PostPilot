"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Language = "he" | "en";

interface LanguageContextValue {
  lang: Language;
  dir: "rtl" | "ltr";
  isHe: boolean;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("he");

  useEffect(() => {
    const saved = localStorage.getItem("postpilot-lang");
    if (saved === "en" || saved === "he") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    localStorage.setItem("postpilot-lang", lang);
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === "he" ? "en" : "he")), []);
  const dir = lang === "he" ? "rtl" : "ltr";
  const isHe = lang === "he";

  return (
    <LanguageContext.Provider value={{ lang, dir, isHe, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

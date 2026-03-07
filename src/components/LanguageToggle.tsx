"use client";

import { useLanguage } from "@/lib/language-context";

export function LanguageToggle() {
  const { isHe, toggle } = useLanguage();

  return (
    <button
      onClick={toggle}
      aria-label={isHe ? "Switch to English" : "Switch to Hebrew"}
      title={isHe ? "Switch to English" : "Switch to Hebrew"}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-lg hover:bg-gray-50 transition-colors cursor-pointer"
    >
      {isHe ? "\u{1F1EC}\u{1F1E7}" : "\u{1F1EE}\u{1F1F1}"}
    </button>
  );
}

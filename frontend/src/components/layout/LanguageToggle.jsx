'use client';

import { useLocale } from "next-intl";
import React, { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { Languages, ChevronDown } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "my", label: "မြန်မာ" },
];

const LanguageToggle = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale) => {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    const query = searchParams.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(target, { locale: nextLocale });
    });
  };

  // Find the label of the current locale for the button text
  const currentLanguage = languages.find(lang => lang.code === locale)?.label || "English";

  return (
    <div className="dropdown dropdown-end">
      {/* The Button - Shows the current language */}
      <div 
        tabIndex={0} 
        role="button" 
        className={`btn btn-sm md:btn-md btn-ghost flex items-center gap-2 px-2 md:px-4 ${isPending ? 'opacity-50' : ''}`}
      >
        <Languages size={18} className="text-primary" />
        <span className="hidden sm:inline font-medium">{currentLanguage}</span>
        <span className="sm:hidden uppercase font-bold">{locale}</span>
        <ChevronDown size={14} className="opacity-60" />
      </div>

      {/* The Menu */}
      <ul 
        tabIndex={0} 
        className="dropdown-content z-[100] menu p-2 shadow-lg bg-base-100 rounded-box w-40 mt-2 border border-base-200"
      >
        {languages.map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex justify-between items-center ${
                locale === lang.code ? "bg-info text-info-content font-bold" : ""
              }`}
            >
              {lang.label}
              {locale === lang.code && (
                <span className="text-[10px] uppercase opacity-70">Active</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageToggle;
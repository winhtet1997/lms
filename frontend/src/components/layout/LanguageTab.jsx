"use client";

import { useLocale } from "next-intl";
import React, { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";

const languages = [
  { code: "en", label: "English" },
  { code: "my", label: "မြန်မာ" },
 
];

const LanguageTab = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale) => {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    const qs = searchParams.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.replace(target, { locale: nextLocale });
    });
  };

  return (
    <div className="flex gap-1 bg-base-200 p-1 border border-gray-200 rounded-lg w-fit">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          disabled={isPending}
          className={`px-3 py-1 rounded-md text-sm transition
            ${
              locale === lang.code
                ? "bg-info text-white"
                : "bg-transparent hover:bg-base-300"
            }
          `}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageTab;

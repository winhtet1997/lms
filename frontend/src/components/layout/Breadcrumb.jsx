"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const Breadcrumb = ({ items = [], className = "my-6" }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="breadcrumb" className={`flex items-center gap-1.5 text-sm flex-wrap ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5 min-w-0">
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-slate-400 hover:text-blue-600 transition-colors truncate max-w-50"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-700 font-semibold truncate max-w-50">
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;

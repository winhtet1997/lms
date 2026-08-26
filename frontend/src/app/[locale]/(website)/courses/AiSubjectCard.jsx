import Link from "next/link";
import { ChevronRight, Bot } from "lucide-react";

export default function AiSubjectCard({ subject, idx, t }) {
  const AI_CARD_COLORS = [
    { border: "border-t-blue-500", text: "text-blue-500" },
    { border: "border-t-purple-500", text: "text-purple-500" },
    { border: "border-t-green-500", text: "text-green-500" },
    { border: "border-t-orange-500", text: "text-orange-500" },
    { border: "border-t-pink-500", text: "text-pink-500" },
  ];

  const cfg = AI_CARD_COLORS[idx % AI_CARD_COLORS.length];

  const aiBase =
    process.env.NEXT_PUBLIC_AI_TUTOR_BASE_URL ?? "https://ai.mathmentor.com.mm";

  return (
    <Link
      href={`${aiBase}/subjects/${subject.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block text-left"
    >
      <div
        className={`rounded-xl bg-white border border-gray-100 border-t-8 ${cfg.border} shadow-sm hover:shadow-md transition-shadow duration-300 p-4 flex flex-col h-full`}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-gray-900 flex-1 min-w-0 pr-2 text-sm">
            {subject.title}
          </h3>
          <ChevronRight
            size={16}
            className="text-gray-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform"
          />
        </div>

        {subject.description && (
          <p className="text-gray-500 text-xs line-clamp-3 flex-1 mb-3">
            {subject.description}
          </p>
        )}

        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-auto ${cfg.text}`}
        >
          <Bot size={13} />
          {t("askAiTutorButton")}
        </span>
      </div>
    </Link>
  );
}

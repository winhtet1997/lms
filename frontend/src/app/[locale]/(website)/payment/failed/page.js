"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { XCircle } from "lucide-react";

const PaymentFailedPage = () => {
  const searchParams = useSearchParams();
  const t = useTranslations("PaymentStatusPage");
  const reason = searchParams.get("reason");
  const courseId = searchParams.get("course_id");
  const isCancelled = reason?.toLowerCase().includes("cancel");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h3>{t("failedTitle")}</h3>
        <p className="text-gray-500 mt-2">
          {isCancelled ? t("cancelledMessage") : reason || t("failedMessage")}
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Link
            href={courseId ? `/courses/${courseId}/subscribe` : "/"}
            className="btn btn-info btn-sm shadow-none border-none text-white"
          >
            {t("tryAgainButton")}
          </Link>
          <Link
            href={courseId ? `/courses/${courseId}` : "/"}
            className="btn btn-outline btn-sm border-gray-300"
          >
            {t("backToCourseButton")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;

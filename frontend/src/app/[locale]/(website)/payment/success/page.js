"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";
import { paymentService } from "@/service/paymentService";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("PaymentStatusPage");
  const orderNumber = searchParams.get("merchantOrderId");
  const [status, setStatus] = useState("pending");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!orderNumber) {
      router.replace("/payment/failed");
      return;
    }

    let cancelled = false;
    let timer;

    const goToFailed = (data) => {
      const params = new URLSearchParams();
      if (data?.failure_reason) params.set("reason", data.failure_reason);
      if (data?.course_id) params.set("course_id", data.course_id);
      router.replace(`/payment/failed?${params.toString()}`);
    };

    const poll = async () => {
      attemptsRef.current += 1;
      try {
        const data = await paymentService.getPaymentStatus(orderNumber);
        if (cancelled) return;

        if (data.status === "success") {
          setStatus("success");
          timer = setTimeout(() => {
            router.push(data.course_id ? `/courses/${data.course_id}` : "/");
          }, 1500);
          return;
        }

        if (data.status === "failed" || data.status === "cancelled") {
          goToFailed(data);
          return;
        }

        if (attemptsRef.current < MAX_ATTEMPTS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          goToFailed();
        }
      } catch {
        if (cancelled) return;
        if (attemptsRef.current < MAX_ATTEMPTS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          goToFailed();
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderNumber, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        {status === "success" ? (
          <>
            <CircleCheck className="mx-auto text-emerald-500 mb-4" size={48} />
            <h3>{t("successTitle")}</h3>
            <p className="text-gray-500 mt-2">{t("successMessage")}</p>
          </>
        ) : (
          <>
            <span className="loading loading-spinner loading-lg text-blue-600 mb-4"></span>
            <h3>{t("verifyingTitle")}</h3>
            <p className="text-gray-500 mt-2">{t("verifyingMessage")}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

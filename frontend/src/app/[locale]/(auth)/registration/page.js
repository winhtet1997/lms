"use client";
import { useTranslations } from "next-intl";
import { GraduationCap, Users } from "lucide-react";
import Link from "next/link";

const Registration = () => {
  const t = useTranslations("Registration");
  return (
    <div>
      <div className="min-h-screen to-blue-50 flex place-items-center-safe justify-center p-4">
        <div className="card w-full max-w-2xl bg-white shadow-xl rounded-2xl border-[1px] border-gray-200 ">
          <div className="card-body gap-4 p-5">
            <h1 className="text-3xl font-semibold text-center text-black mt-5">
              {t("title")}
            </h1>
            <p className="text-center text-sm text-gray-500">{t("subtitle")}</p>
            <p>
              <b>{t("iAmA")}</b>
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/registration/student"
                className="border-2 border-gray-200 shadow rounded-xl text-center p-5 hover:border-blue-500 hover:shadow-md transition"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center my-2">
                    <GraduationCap color="#fff" size={24} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h6 className="font-medium text-center text-black">
                    {t("studentAccountTitle")}
                  </h6>
                  <p className="text-center text-sm text-gray-500">
                    {t("studentAccountSubtitle")}
                  </p>
                  <p>{t("studentAccountCta")}</p>
                </div>
              </Link>
              <Link
                href="/registration/parents"
                className="border-2 border-gray-200 shadow rounded-xl text-center p-5 hover:border-primary hover:shadow-md transition"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center my-2">
                    <Users color="#fff" size={24} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h6 className="font-medium text-center text-black">
                    {t("parentAccountTitle")}
                  </h6>
                  <p className="text-center text-sm text-gray-500">
                    {t("parentAccountSubtitle")}
                  </p>
                  <p>{t("parentAccountCta")}</p>
                </div>
              </Link>
            </div>
            <p className="text-center text-sm text-gray-500 my-5">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/login/student"
                className=" text-[#3771ce] font-semibold hover:underline"
              >
                {t("studentLoginLink")}
              </Link>{" "}
              or{" "}
              <Link
                href="/login/parents"
                className=" text-[#3771ce] font-semibold hover:underline"
              >
                {t("parentLoginLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;

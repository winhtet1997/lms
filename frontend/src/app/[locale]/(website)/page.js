import { getTranslations } from "next-intl/server";
import { Bot, Brain, CircleCheck, Users, Video } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const t = await getTranslations("HomePage");
  return (
    <div className="mt-16 bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto  py-5">
        <div className="mx-auto grid lg:grid-cols-3 items-center">
          <div className="hidden lg:block shrink-0 relative">
            <img
              src="/landingPageImages/Boy with Phone.png"
              alt="Boy with Phone"
              className="mx-auto md:max-w-lg md:max-h-115 h-auto object-contain translate-y-20 translate-x-8"
            />
          </div>
          {/* Left Side: Illustration a bit lower (overlapping downward) */}
          <div className="flex flex-row items-start gap-6 relative z-10">
            {/* Left Graphic Wrapper: Aligning to the bottom container line */}

            {/* Right Text Content: Boxed layout aligned to the bottom baseline */}
            <div className="w-full space-y-4 bg-linear-to-b from-blue-50 via-white to-blue-50/20 rounded-2xl p-4 sm:p-6 flex flex-col justify-end md:mt-10">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {t("heroTitle")}
              </h1>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t("heroSubtitle")}
              </p>

              {/* Checkbox Items */}
              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <CircleCheck color="#38a169" size={16} strokeWidth={2} />
                  <span>{t("checkItem1")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CircleCheck color="#38a169" size={16} strokeWidth={2} />
                  <span>{t("checkItem2")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CircleCheck color="#38a169" size={16} strokeWidth={2} />
                  <span>{t("checkItem3")}</span>
                </div>
              </div>

              {/* Action Button CTA */}
              <div className="pt-2">
                <Link href="/registration">
                  <button className="w-full sm:w-auto px-6 py-3 text-xs cursor-pointer font-semibold rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all">
                    {t("ctaButton")}
                  </button>
                </Link>
                <p className="text-[10px] text-gray-500 mt-2">
                  {t("ctaHelper")}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Showcase Image shifted upwards & sized down */}
          <div className="hidden lg:flex items-center justify-center relative z-10">
            <div className="text-center w-full flex justify-center">
              <img
                src="/landingPageImages/Girl on Seat.png"
                alt="Preview"
                className="mx-auto md:max-w-lg md:max-h-165 h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Features Section */}
      <div className="bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-4 ">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 mb-3">
              {t("featuresSectionTitle")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              {t("featuresSectionSubtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Card 1: Expert Video Lessons */}
            <div className="bg-white flex flex-col justify-between p-6 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div>
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Video color="#ffffff" size={20} />
                </div>
                <div className="font-bold text-gray-900 text-lg mb-2">
                  {t("feature1Title")}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {t("feature1Description")}
                </p>
              </div>
              <Link
                href="/learn-video-lessons-details"
                className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-auto"
              >
                {t("Learn More")} <span className="text-xs">→</span>
              </Link>
            </div>

            {/* Card 2: Interactive Learning */}
            <div className="bg-white flex flex-col justify-between p-6 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div>
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Brain color="#ffffff" size={20} />
                </div>
                <div className="font-bold text-gray-900 text-lg mb-2">
                  {t("feature2Title")}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {t("feature2Description")}
                </p>
              </div>
              <Link
                href="/interactive-learning"
                className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-auto"
              >
                {t("Learn More")} <span className="text-xs">→</span>
              </Link>
            </div>

            {/* Card 3: Live Sessions & Tutoring */}
            <div className="bg-white flex flex-col justify-between p-6 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div>
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Users color="#ffffff" size={20} />
                </div>
                <div className="font-bold text-gray-900 text-lg mb-2">
                  {t("feature3Title")}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {t("feature3Description")}
                </p>
              </div>
              <Link
                href="/live-sessions-details"
                className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-auto"
              >
                {t("Learn More")} <span className="text-xs">→</span>
              </Link>
            </div>

            {/* Card 4: AI Tutor Support */}
            <div className="bg-white flex flex-col justify-between p-6 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div>
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4">
                  <Bot color="#ffffff" size={20} />
                </div>
                <div className="font-bold text-gray-900 text-lg mb-2">
                  {t("feature4Title")}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {t("feature4Description")}
                </p>
              </div>
              <Link
                href="/ai-tutor-support-details"
                className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-auto"
              >
                {t("Learn More")} <span className="text-xs">→</span>
              </Link>
            </div>
          </div>
        </div>

        <section className="pt-5 pb-16 relative overflow-hidden bg-pink-200/10">
          <div className="container mx-auto px-4">
            {/* items-end aligns all transparent illustrations along the same bottom baseline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto items-end justify-items-center">
              <div className="w-full max-w-[320px]">
                <img
                  src="/landingPageImages/Boy with HeadSet.png"
                  alt="Student 1"
                  className="w-full h-auto max-h-35 md:max-h-70 object-contain"
                />
              </div>

              <div className="w-full max-w-60">
                <img
                  src="/landingPageImages/Cheer Girl.png"
                  alt="Student 2"
                  className="w-full h-auto max-h-32.5 md:max-h-80 object-contain"
                />
              </div>

              <div className="w-full max-w-55">
                <img
                  src="/landingPageImages/Boy with Hat.png"
                  alt="Student 3"
                  className="w-full h-auto max-h-30 md:max-h-75 object-contain"
                />
              </div>

              <div className="w-full max-w-60">
                <img
                  src="/landingPageImages/Girl with Pen.png"
                  alt="Student 4"
                  className="w-full h-auto max-h-30 md:max-h-75 object-contain"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {t("pricingTitle")}
              </h2>
              <p className="text-gray-500 text-sm">{t("pricingSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Monthly */}
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col">
                <div className="mb-5">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {t("silverName")}
                  </h3>
                  <p className="text-sm text-gray-400">{t("tagline")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-600">
                    {t("silverPrice")}
                  </span>
                  <div className="text-sm text-gray-400 mt-1">
                    {t("pricingPeriod")}
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600 mb-8 flex-1">
                  {[
                    { key: "feature1"},
                    { key: "feature2"},
                    { key: "feature3"},
                    { key: "feature4"},
                    { key: "feature5"},
                  ].map(({ key, bold }) => (
                    <li key={key} className="flex items-start gap-2">
                      <CircleCheck
                        className="text-green-500 shrink-0 mt-0.5"
                        size={16}
                      />
                      <span className={bold ? "font-semibold" : ""}>
                        {t(key)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/login/student?pricing=true">
                  <button className="btn btn-ghost w-full cursor-pointer border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    {t("getStarted")}
                  </button>
                </Link>
              </div>

              {/* Yearly — Recommended */}
              <div className="border-2 border-orange-400 rounded-2xl p-6 flex flex-col relative shadow-xl">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-orange-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {t("recommendedBadge")}
                  </span>
                </div>
                <div className="mb-5">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {t("goldName")}
                  </h3>
                  <p className="text-sm text-gray-400">{t("tagline")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-orange-500">
                    {t("goldPrice")}
                  </span>
                  <div className="text-sm text-gray-400 mt-1">
                    {t("pricingPeriod")}
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600 mb-8 flex-1">
                  {[
                    { key: "feature1"},
                    { key: "feature2"},
                    { key: "feature3"},
                    { key: "feature4"},
                    { key: "feature5"},
                  ].map(({ key, bold }) => (
                    <li key={key} className="flex items-start gap-2">
                      <CircleCheck
                        className="text-green-500 shrink-0 mt-0.5"
                        size={16}
                      />
                      <span className={bold ? "font-semibold" : ""}>
                        {t(key)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/login/student?pricing=true">
                  <button className="btn w-full bg-orange-400 hover:bg-orange-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
                    {t("getStarted")}
                  </button>
                </Link>
              </div>

              {/* Free */}
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col">
                <div className="mb-5">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {t("freeName")}
                  </h3>
                  <p className="text-sm text-gray-400">{t("freeTagline")}</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-purple-600">
                    {t("freePrice")}
                  </span>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600 mb-8 flex-1">
                  {[{ key: "freeFeature"}].map(
                    ({ key, bold }) => (
                      <li key={key} className="flex items-start gap-2">
                        <CircleCheck
                          className="text-green-500 shrink-0 mt-0.5"
                          size={16}
                        />
                        <span className={bold ? "font-semibold" : ""}>
                          {t(key)}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
                <Link href="/login/student?pricing=true">
                  <button className="btn w-full border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    {t("getStarted")}
                  </button>
                </Link>
              </div>
            </div>

            <div className="text-center mt-8 space-y-1.5">
              {/* <p className="text-xs text-gray-400">{t("pricingFooterNote")}</p> */}
              <p className="text-sm text-gray-700 font-medium">
                {t("pricingFooterCta")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

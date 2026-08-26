import { getTranslations } from "next-intl/server";
import { Video, CircleCheck, BookOpen, Target, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function ExpertLessonsPage() {
    const t = await getTranslations("VideoLessonsPage");

    return (
        <div className="bg-[#f8faff] min-h-screen font-sans antialiased text-gray-900 py-12 md:py-24 overflow-x-hidden">
            {/* Main Framework Wrapper */}
            <div className="max-w-6xl mx-auto px-4 pt-10">

                {/* Breadcrumb Back Arrow Link */}
                <Link href="/" className="inline-flex items-start gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 md:mb-12 transition">
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    {t("backToHome")}
                </Link>

                {/* Section 1: Split Header Hero */}
                <section className="grid md:grid-cols-2 gap-6 md:gap-12 items-center mb-10 md:mb-20 relative">

                    {/* Left Block: Complex Overlapping Floating Composition */}
                    <div className="relative flex items-center justify-center">
                        {/* Base Shape Mask Containing Main Teacher Graphic */}
                        <div className="">
                            <Image
                                src="/learnWithTeacher/TopGrilsGroup.png"
                                alt="Teacher with Math Icons"
                                width={600}
                                height={400}
                                className="w-full h-auto max-h-50 md:max-h-75 lg:max-h-none object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Right Block: Hero Content & Partners */}
                    <div className="space-y-4 md:space-y-6">
                        <div className="h-12 w-12 rounded-xl bg-1 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Video color="#ffffff" size={24} strokeWidth={2.5} />
                        </div>

                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
                            {t("heroTitle")}
                        </h1>
                        <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-xl">
                            {t("heroSubtitle")}
                        </p>
                    </div>
                </section>

                {/* Section 2: Large Banner Video Showcase */}
                <section className="mb-5">
                    <div className="bg-linear-to-br from-blue-100 to-cyan-100 rounded-3xl p-4 md:p-6 shadow-sm border border-blue-200 max-w-4xl mx-auto relative overflow-hidden group">
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center">
                            <Image
                                src="/learnWithTeacher/Teacher.png"
                                alt="Teacher explaining to group of students"
                                width={800}
                                height={450}
                                className="w-full h-full object-cover opacity-90"
                                loading="lazy"
                            />
                            {/* Play Button Interface Trigger */}
                           
                        </div>
                    </div>
                </section>

                {/* Section 3: Mid-way Card Quote Callout */}
                <section className="max-w-4xl mx-auto text-center bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm mb-10 md:mb-24">
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                        {t("sectionDividerText")}
                    </p>
                </section>

                {/* Section 4: Features Grid (Matrix + Surrounding Elements) */}
                <section className="mb-5 relative max-w-5xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-6 md:mb-12">
                        {t("whatYouGetTitle")}
                    </h2>

                    <div className="relative w-full">

                        {/* Left Decoration - Positioned absolutely outside the grid box */}
                        <div className="hidden md:block absolute left-0 bottom-0 transform -translate-x-[70%] z-0 pointer-events-none select-none">
                            <Image
                                src="/learnWithTeacher/Number Cubes.png"
                                alt="Math blocks decoration"
                                width={180}
                                height={180}
                                className="w-auto  h-auto object-contain"
                                loading="lazy"
                            />
                        </div>

                        {/* Core Features: 2x3 Matrix Blocks Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 max-w-4xl mx-auto">
                            {["feature1", "feature2", "feature3", "feature4", "feature5", "feature6"].map((key) => (
                                <div key={key} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1.5 flex flex-col justify-start">
                                    <div className="flex items-center gap-2 text-[#38a169]">
                                        <CircleCheck size={15} color="#38a169" className="text-white shrink-0" strokeWidth={3} />
                                        <h4 className=" text-slate-900 tracking-tight">{t(`${key}Title`)}</h4>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-normal">{t(`${key}Desc`)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Right Decoration - Positioned absolutely outside the grid box */}
                        <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-[70%] -translate-y-1/2 z-0 pointer-events-none select-none">
                            <Image
                                src="/learnWithTeacher/Surprise Girl.png"
                                alt="Excited student girl illustration"
                                width={220}
                                height={220}
                                className="w-auto h-auto object-contain"
                                loading="lazy"
                            />
                        </div>

                    </div>
                </section>

                {/* Section 5: Tracking & History Navigation Tabs */}
                <section className="bg-linear-to-r from-blue-50 to-purple-50/30 border border-gray-100/80 rounded-2xl p-3 md:p-6 shadow-sm max-w-4xl mx-auto mb-10 md:mb-24">
                    <div className="grid grid-cols-3 gap-4 text-center ">

                        <div className="flex flex-col items-center justify-center p-3 space-y-2 cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 transition ">
                                <BookOpen size={32} />
                            </div>
                            <span className="font-bold text-xs text-slate-900 tracking-tight block">{t("tab1")}</span>
                            <span className="text-[10px] text-gray-400 block">{t("tab1Sub")}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 space-y-2 cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg  flex items-center justify-center text-purple-600 transition g">
                                <Target size={32} />
                            </div>
                            <span className="font-bold text-xs text-slate-900 tracking-tight block">{t("tab2")}</span>
                            <span className="text-[10px] text-gray-400 block">{t("tab2Sub")}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 space-y-2 cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-green-600 transition ">
                                <Clock size={32} />
                            </div>
                            <span className="font-bold text-xs text-slate-900 tracking-tight block">{t("tab3")}</span>
                            <span className="text-[10px] text-gray-400 block">{t("tab3Sub")}</span>
                        </div>

                    </div>
                </section>

                {/* Section 6: Footer Action CTA Callout Frame Banner */}
                <section className="max-w-4xl mx-auto relative ">

                    {/* Shape sits behind the card — sibling, not child, so it escapes the card's stacking context */}
                    <div className="hidden md:block absolute md:-right-50 bottom-10 z-0 pointer-events-none">
                        <Image
                            src="/learnWithTeacher/Bottom Shape i.png"
                            alt=""
                            width={250}
                            height={250}
                            className="h-full w-auto object-contain"
                            loading="lazy"
                        />
                    </div>

                    <div className="w-full bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl p-5 md:p-11 text-center text-white relative shadow-xl overflow-visible flex flex-col items-center justify-center min-h-55 z-10">

                        {/* Absolute Bottom-Left Asymmetric Overflowing Student */}
                        <div className="absolute -left-2.5 md:-left-15 bottom-0 h-25 md:h-62.5 z-20">
                            <Image
                                src="/learnWithTeacher/Hi Teacher Man.png"
                                alt="Waving friendly boy"
                                width={250}
                                height={250}
                                className="h-full w-auto object-contain"
                                loading="lazy"
                            />
                        </div>

                        {/* Center Typography Content */}
                        <div className="space-y-3 max-w-md mx-auto relative z-10 pl-10 md:pl-0">
                            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight">
                                {t("ctaTitle")}
                            </h2>
                            <p className="text-xs md:text-sm text-blue-100 font-medium max-w-xs mx-auto leading-relaxed">
                                {t("ctaSubtitle")}
                            </p>

                            <div className="pt-3">
                                <Link href="login/student">
                                    <button className="bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs px-7 py-3.5 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.03] active:scale-[0.98]">
                                        {t("ctaBtn")}
                                    </button>
                                </Link>
                                <p className="text-[10px] text-purple-200/90 mt-2.5">
                                    {t("ctaHelper")}
                                </p>
                            </div>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
}
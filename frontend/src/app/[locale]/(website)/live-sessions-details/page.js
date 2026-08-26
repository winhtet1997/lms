import { getTranslations } from "next-intl/server";
import {
    CircleCheck,
    ArrowLeft,
    Users,
    Calendar,
    File,
    UserCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function MathMentorLandingPage() {
    const t = await getTranslations("LiveSessionsDetailsPage");

    return (
        <div className="bg-green-50/35 min-h-screen font-sans antialiased text-[#1e293b] pb-32 overflow-x-hidden">

            <div className="max-w-6xl mx-auto px-6 pt-20">

                {/* Breadcrumb Back Navigation */}
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 mb-10 transition group">
                    <ArrowLeft size={14} strokeWidth={3} className="transform group-hover:-translate-x-0.5 transition" />
                    {t("backToHome")}
                </Link>

                {/* SECTION 1: HERO DISPLAY */}
                <section className="grid md:grid-cols-2  items-start mb-20 relative">

                    <div className="relative flex items-center justify-center min-h-85">
                        <div className="absolute top-4 left-6 w-64 h-64 bg-yellow-100/70 rounded-full filter blur-3xl -z-10 animate-pulse" />
                        <div className="absolute bottom-2 right-6 w-60 h-60 bg-blue-100/60 rounded-full filter blur-2xl -z-10" />

                        <div className="relative w-72 h-72 md:w-125 md:h-125 z-10 transition duration-300 hover:scale-[1.02]">
                            <Image
                                src="/livesessionImages/TeacherAndStudents.png"
                                alt="Primary Math Teacher Concept"
                                width={500}
                                height={500}
                                className="w-full h-full object-contain filter drop-shadow-xl"
                                priority
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="h-11 w-11 rounded-xl bg-3 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white transform mx-auto">
                            <Users size={22} />
                        </div>
                        <h1 className="text-3xl md:text-3xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
                            {t("heroTitle")}
                        </h1>
                        <p className="text-sm md:text-[15px] text-slate-500 leading-relaxed max-w-xl font-medium">
                            {t("heroSubtitle")}
                        </p>

                    </div>
                </section>

                {/* SECTION 2: VIDEO BANNER */}
                <section className="mb-5 max-w-4xl mx-auto">
                    <div className="bg-linear-to-r from-green-100 to-green-200 rounded-4xl p-4 md:p-5.5 shadow-sm border border-cyan-100/60 relative overflow-hidden group">
                        <div className="relative aspect-video w-full rounded-[20px] overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
                            <Image
                                src="/livesessionImages/Teacher&Student2.png"
                                alt="Teacher explaining class concept"
                                width={800}
                                height={450}
                                className="w-full h-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.01]"
                                loading="lazy"
                            />
                            
                        </div>
                    </div>
                </section>

                {/* SECTION 3: QUOTE CALLOUT */}
                <section className="max-w-4xl mx-auto text-center bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm mb-24 transition hover:shadow-md">
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold max-w-2xl mx-auto">
                        {t("sectionDividerText")}
                    </p>
                </section>

                {/* SECTION 4: WHAT YOU GET GRID */}
                <section className="mb-4 relative max-w-5xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-center text-slate-900 mb-14 tracking-tight">
                        {t("whatYouGetTitle")}
                    </h2>

                    <div className="relative w-full">

                        {/* Left Decoration - Positioned absolutely outside the grid box */}
                        <div className="hidden md:block absolute left-0 bottom-0 transform -translate-x-[60%] translate-y-[-70%] z-0 pointer-events-none select-none">
                            <Image
                                src="/livesessionImages/support shape iii.png"
                                alt="Math blocks decoration"
                                width={250}
                                height={220}
                                className="w-auto h-auto object-contain"
                                loading="lazy"
                            />
                        </div>

                        {/* Center Grid Core Block */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 max-w-4xl mx-auto">
                            {["feature1", "feature2", "feature3", "feature4", "feature5", "feature6"].map((key) => (
                                <div key={key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 flex flex-col justify-start transition duration-200 hover:shadow-md hover:border-slate-200/60">
                                    <div className="flex items-center gap-2.5 text-[#38a169]">
                                        <CircleCheck size={16} fill="#38a169" className="text-white shrink-0" strokeWidth={3} />
                                        <h4 className=" text-slate-900 tracking-tight leading-none">{t(`${key}Title`)}</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium leading-normal">{t(`${key}Desc`)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Right Decoration - Positioned absolutely outside the grid box */}
                        <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-[50%] -translate-y-1/2 z-0 pointer-events-none select-none">
                            <Image
                                src="/livesessionImages/support shape ii.png"
                                alt="Excited student girl illustration"
                                width={220}
                                height={200}
                                className="w-auto h-auto object-contain"
                                loading="lazy"
                            />
                        </div>

                    </div>
                </section>

                {/* SECTION 5: TABS */}
                <section className="bg-linear-to-r from-blue-50 to-green-50/30 border border-slate-100 rounded-2xl p-4 shadow-sm max-w-4xl mx-auto mb-28">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                            { id: "overview", Icon: Calendar, tabKey: "tab1", iconClass: " text-green-600" },
                            { id: "tracking", Icon: File,   tabKey: "tab2", iconClass: "text-blue-600" },
                            { id: "history",  Icon: UserCheck,    tabKey: "tab3", iconClass: " text-purple-600" },
                        ].map(({ id, Icon, tabKey, iconClass }) => (
                            <div key={id} className="flex flex-col items-center justify-center rounded-xl">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${iconClass}`}>
                                    <Icon size={40} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <span className="font-extrabold text-xs md:text-[13px] text-slate-900 tracking-tight block">{t(tabKey)}</span>
                                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{t(`${tabKey}Sub`)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 6: CTA PANEL */}
                <section className="max-w-4xl mx-auto relative ">

                    {/* Shape behind the card — RIGHT SIDE SHAPE */}
                    <div className="absolute -right-7.5 md:-right-50.5 bottom-0 z-0 pointer-events-none select-none opacity-90">
                        <Image
                            src="/livesessionImages/bottom left shape.png"
                            alt=""
                            width={200}
                            height={200}
                            className="h-full w-auto object-contain"
                            loading="lazy"
                        />
                    </div>

                    {/* NEW ADDITION: Shape behind the card — LEFT SIDE SHAPE */}
                    <div className="absolute -left-7.5 md:-left-50.5 bottom-0 z-0 pointer-events-none select-none opacity-90">
                        <Image
                            src="/livesessionImages/bottom right shape.png"
                            alt=""
                            width={200}
                            height={200}
                            className="h-full w-auto object-contain"
                            loading="lazy"
                        />
                    </div>

                    <div className="w-full bg-linear-to-r from-green-500 to-green-700 rounded-4xl p-5 md:p-11 text-center text-white relative shadow-xl shadow-purple-950/10 overflow-visible flex flex-col items-center justify-center min-h-57.5 z-10">

                        <div className="absolute -left-3.75 md:-left-12.5 bottom-0 h-30 md:h-66.25 z-20 pointer-events-none select-none">
                            <Image
                                src="/livesessionImages/Teacher Writing.png"
                                alt="Waving character"
                                width={265}
                                height={265}
                                className="h-full w-auto object-contain filter drop-shadow-md"
                                loading="lazy"
                            />
                        </div>

                        <div className="space-y-4 max-w-md mx-auto relative z-10 pl-10 md:pl-0">
                            <h2 className="text-2xl md:text-2xl font-black tracking-tight leading-tight">
                                {t("ctaTitle")}
                            </h2>
                            <p className="text-xs md:text-[13px] text-blue-100 font-semibold max-w-xs mx-auto leading-relaxed opacity-95">
                                {t("ctaSubtitle")}
                            </p>
                            <div className="pt-2">
                                <Link href="login/student">
                                    <button className="bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs px-7 py-3.5 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.03] active:scale-[0.98]">
                                        {t("ctaBtn")}
                                    </button>
                                </Link>
                                <p className="text-xs text-purple-200/90 font-semibold mt-3 tracking-wide">
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

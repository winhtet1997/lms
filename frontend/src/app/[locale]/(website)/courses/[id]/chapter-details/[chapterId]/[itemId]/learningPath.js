"use client";
import React, { useRef, Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CheckCircle2, Lock } from "lucide-react";
import { getContentTypeInfo } from "../../../../../../../../../data/contentData";
import { useParams } from "next/navigation";
import { useCourseStore } from "@/store/useCourseStore";
import Link from "next/link";

function VideoThumbnail({ src, className }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMetadata = () => { video.currentTime = 0.1; };
    video.addEventListener("loadedmetadata", onMetadata);
    return () => video.removeEventListener("loadedmetadata", onMetadata);
  }, [isVisible]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible && (
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

const LearningPathCarousel = () => {
  const scrollRef = useRef(null);
  const params = useParams();
  const t = useTranslations("LearningPath");
  const activeRef= useRef(null);

  const currentUrlId = Number(params.itemId);

  const { item } = useCourseStore();
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const activeEl = activeRef.current;
      const container = scrollRef.current;
      const left =
        container.scrollLeft +
        activeEl.getBoundingClientRect().left -
        container.getBoundingClientRect().left -
        60;
      container.scrollTo({ left, behavior: "instant" });
    }
  }, [currentUrlId]);

  const allItems =
    item?.learning_path?.chapters?.flatMap((chapter, chapterIdx) =>
      chapter.lessons?.flatMap((lesson, lessonIdx) =>
        lesson.items.map((item) => ({
          ...item,
          chapterTitle: lesson.title,
          chapterIndex: lessonIdx + 1,
          chapterNo: chapterIdx + 1,
        })),
      ) ?? [],
    ) ?? [];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm w-full max-w-6xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{t("sectionTitle")}</h2>
        </div>
      </div>

      <div className="relative flex items-center group">
        <button
          onClick={() => scroll("left")}
          className="btn btn-circle btn-sm absolute -left-4 z-20 bg-white border-slate-200 shadow-md hover:bg-slate-50 opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="carousel carousel-center w-full gap-0 overflow-x-auto p-4"
        >
          {allItems.map((step, idx) => {
            const isActive = step.id === currentUrlId;
            const isCompleted = step.completion_status === 'completed';
            const newChapter =
              idx === 0 ||
              allItems[idx].chapterNo !== allItems[idx - 1].chapterNo;

            return (
              <Fragment key={idx}>
                {newChapter && idx !== 0 && (
                  <div className="flex flex-col items-center justify-center mx-6">
                    <div className="badge badge-ghost badge-sm border-slate-200 mb-1 font-bold whitespace-nowrap   py-3 bg-info text-white uppercase tracking-tighter">
                      CH-{step.chapterNo}
                    </div>
                  </div>
                )}
                <div ref={isActive ? activeRef : null} className="carousel-item relative flex items-center">
                  <Link href={`./${step.id}`}>
                    <div
                      className={`relative shrink-0 w-32 h-28 rounded-xl p-2 flex flex-col justify-between transition-all border-2 cursor-pointer
                      ${
                        isActive
                          ? "border-blue-400 bg-indigo-50 shadow-md scale-105 z-10"
                          : isCompleted
                          ? "border-green-300 bg-green-50/50"
                          : step.locked
                          ? "border-slate-100 bg-white opacity-85"
                          : "border-slate-100 bg-white hover:border-slate-300"
                      }
                    `}
                    >
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <CheckCircle2 className="w-6 h-6 text-green-500 fill-white" />
                        </div>
                      )}

                      {step.locked && (
                        <div className="absolute -top-2 -right-2 z-10 bg-slate-500 rounded-full p-1">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {(() => {
                        const config = getContentTypeInfo(step.type);
                        const isVideo = step.type?.toLowerCase() === "video";
                        return (
                          <div className={`w-full h-14 rounded-lg flex items-center justify-center relative overflow-hidden ${config.badgebg2} ${config.badgeText}`}>
                            <span className={`absolute top-1 right-1 z-10 text-[8px] font-bold ${config.badgebg} px-1 rounded text-white`}>
                              {config.badgeLabel ?? step.duration}
                            </span>
                            {isVideo && step.file ? (
                              <VideoThumbnail
                                src={step.file}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              config.badgeicon
                            )}
                          </div>
                        );
                      })()}

                      <div>
                        {/* <p className="text-[9px] text-indigo-400 font-semibold uppercase truncate">
                          {step.chapterTitle}
                        </p> */}
                        <p
                          className={`text-[11px] font-bold leading-tight line-clamp-2 ${isActive ? "text-indigo-900" : "text-slate-700"}`}
                        >
                          {step.title}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Line between steps */}
                  {idx !== allItems.length - 1 && (
                    <div className="w-8 h-0.5 bg-slate-200 mx-1" />
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="btn btn-circle btn-sm absolute -right-4 z-20 bg-white border-slate-200 shadow-md hover:bg-slate-50 opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default LearningPathCarousel;

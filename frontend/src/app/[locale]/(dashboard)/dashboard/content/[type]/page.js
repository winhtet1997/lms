"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCourseStore } from "@/store/useCourseStore";
import dynamic from "next/dynamic";
import VideoViewer from "./viewers/VideoViewer";
import ActivityViewer from "../../../../../../components/layout/ActivityViewer";
import QuizPreviewViewer from "./viewers/QuizPreviewViewer";

const PDFViewer = dynamic(() => import("./viewers/PDFViewer"), { ssr: false });


export default function ContentPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { item, fetchItem, loading } = useCourseStore();

  useEffect(() => {
    if (id) fetchItem(Number(id));
  }, [id, fetchItem]);

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  switch (item.type) {
    case "video":
      return <VideoViewer item={item} />;
    case "document":
      return <PDFViewer item={item} />;
    case "activity":
      return <ActivityViewer item={item} />;
    case "quiz":
      return <QuizPreviewViewer item={item} />;
    default:
      return <div>Unknown type</div>;
  }
}
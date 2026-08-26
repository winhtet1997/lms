// app/[locale]/dashboard/content/[type]/edit/page.js
"use client";
import { useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useCourseStore } from "@/store/useCourseStore";
import UploadDashboard from "../../../upload-content/page";

const EditPageSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="mb-8">
      <div className="h-9 w-40 bg-gray-100 rounded-lg" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-80 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
    <div className="mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
      <div className="space-y-8 border border-gray-200 bg-base-200 rounded-2xl p-5">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-gray-300 rounded-full" />
          <div className="h-3 w-48 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>

      <div className="space-y-6 border border-gray-200 rounded-2xl p-6">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-24 w-full bg-gray-100 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded-lg" />
        </div>
        <div className="h-40 w-full bg-gray-100 rounded-lg" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function EditPage() {
  const { type } = useParams();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id"));

  const fetchItem = useCourseStore((state) => state.fetchItem);
  const item = useCourseStore((state) => state.item);
  const loading = useCourseStore((state) => state.loading);

  useEffect(() => {
    if (id) fetchItem(id);
  }, [id, fetchItem]);

  if (loading) return <EditPageSkeleton />;
  if (!item) return <div className="p-10 text-center">Item not found.</div>;

  return (
    <UploadDashboard
      initialData={item}
      forcedType={type}
    />
  );
}

import { courseService } from "@/service/courseService";
import toast from "react-hot-toast";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB — S3 minimum part size

export async function runMultipartUpload(file, item) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const { uploadId, key, presignedUrls } = await courseService.initiateUpload({
    filename: `${item.id}/${file.name}`,
    itemType: item.type,
    itemId: item.id,
    totalChunks,
    contentType: file.type || "application/octet-stream",
  });
  const toastId = toast.loading(`Uploading ${file.name}… 0%`, { position: "bottom-right" });
  const parts = [];
  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const res = await fetch(presignedUrls[i], { method: "PUT", body: chunk });
      parts.push({ PartNumber: i + 1, ETag: res.headers.get("ETag") });
      toast.loading(`Uploading ${file.name}… ${Math.round(((i + 1) / totalChunks) * 100)}%`, { id: toastId });
    }
    await courseService.completeUpload({ uploadId, key, parts, itemId: item.id });
    toast.success(`${file.name} uploaded successfully`, { id: toastId });
  } catch {
    courseService.abortUpload({ uploadId, key }).catch(() => {});
    toast.error(`Failed to upload ${file.name}`, { id: toastId });
  }
}


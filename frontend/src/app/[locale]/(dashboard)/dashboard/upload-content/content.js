import TagInput from "@/components/ui/TagInput";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

const GRADE_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];

const parseFileLimitBytes = (limit) => {
  const num = parseFloat(limit);
  if (limit.toUpperCase().includes("GB")) return num * 1024 * 1024 * 1024;
  if (limit.toUpperCase().includes("MB")) return num * 1024 * 1024;
  return num;
};

const Content = ({ activeItem, createItem, updateItem, loading, initialData }) => {
  const router = useRouter();
  const isEditMode = Boolean(initialData);
  const t = useTranslations("UploadContentForm");

  const [formData, setFormData] = useState(() =>
    initialData
      ? {
        title: initialData.title || "",
        description: initialData.description || "",
        type: initialData.type || "",
        file: null,
        fileName: initialData.filename || (initialData.file_url ? `Uploaded ${initialData.type || "file"}` : ""),
        duration: initialData.duration || 0,
        grade_level: String(initialData.grade_level ?? ""),
        tags: initialData.tags || [],
      }
      : {
        title: "",
        description: "",
        type: activeItem?.id?.toLowerCase() || "video",
        file: null,
        fileName: "",
        duration: 0,
        grade_level: "",
        tags: [],
      }
  );

  const tagsRef = useRef(formData.tags);

  if (!activeItem)
    return <div className="p-10 text-center">Select a content type...</div>;

  const show = (fieldName) => activeItem.fields?.includes(fieldName);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedExtensions = activeItem.allowedExtensions ?? [];
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      toast.error(`${t("toastInvalidFileType")} ${activeItem.subtitle}`);
      e.target.value = "";
      setFormData((prev) => ({ ...prev, file: null, fileName: "" }));
      return;
    }

    if (activeItem.fileLimit && selectedFile.size > parseFileLimitBytes(activeItem.fileLimit)) {
      toast.error(`${t("toastFileTooLarge")} ${activeItem.fileLimit}`);
      e.target.value = "";
      setFormData((prev) => ({ ...prev, file: null, fileName: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      file: selectedFile,
      fileName: selectedFile.name,
    }));

    if (selectedFile.type.startsWith("video/")) {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(videoEl.src);
        setFormData((prev) => ({ ...prev, duration: Math.round(videoEl.duration / 60) }));
      };
      videoEl.src = URL.createObjectURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentTags = tagsRef.current;

    if (show("title") && !formData.title.trim()) { toast.error(t("validationTitleRequired")); return; }
    if (show("grade") && !formData.grade_level) { toast.error(t("validationGradeLevelRequired")); return; }
    if (show("tags") && currentTags.length === 0) { toast.error(t("validationTagsRequired")); return; }

    const metaData = new FormData();
    metaData.append("title", formData.title);
    metaData.append("description", formData.description);
    metaData.append("grade_level", formData.grade_level);
    metaData.append("duration", Number(formData.duration));
    metaData.append("type", formData.type);
    currentTags.forEach((tag) => metaData.append("tags", tag));

    if (isEditMode) {
      try {
        await updateItem(initialData.id, metaData, formData.file || null);
        toast.success(t("toastUpdateSuccess"));
        router.push("/dashboard/content");
      } catch (err) {
        console.error("Submit failed", err);
        toast.error(t("toastUpdateError"));
      }
    } else {
      createItem(metaData, formData.file)
        .then(() => toast.success(t("toastCreateSuccess")))
        .catch((err) => {
          console.error("Upload failed", err);
          toast.error(t("toastCreateError"));
        });
      router.push("/dashboard/content");
    }
  };

  return (
    <main className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
      <header className="mb-10">
        <h2 className="text-2xl font-black text-gray-900">
          {isEditMode
            ? t("headingEdit", { title: activeItem.title })
            : t("headingCreate", { title: activeItem.title })}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {isEditMode
            ? t("subheadingEdit", { title: activeItem.title.toLowerCase() })
            : t("subheadingCreate", { title: activeItem.title.toLowerCase() })}
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TITLE */}
            {show("title") && (
              <div className="form-control w-full">
                <label className="label py-2">
                  <span className="label-text font-bold text-gray-700">
                    {t("labelTitle")} <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  type="text"
                  placeholder={t("titlePlaceholder")}
                  className="input input-bordered w-full bg-gray-50 border-gray-200"
                />
              </div>
            )}

            {/* GRADE LEVEL */}
            {show("grade") && (
              <div className="form-control w-full">
                <label className="label py-2">
                  <span className="label-text font-bold text-gray-700">
                    {t("labelGradeLevel")} <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <select
                    name="grade_level"
                    value={formData.grade_level}
                    onChange={handleChange}
                    required
                    className="select select-bordered font-normal bg-white text-sm w-full">
                    <option value="" disabled>{t("gradeSelectDefault")}</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{t(`grade${g}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* TAGS */}
            {show("tags") && (
              <div className="form-control w-full">
                <label className="label py-2">
                  <span className="label-text font-bold text-gray-700">{t("labelTags")} <span className="text-red-500">*</span></span>
                </label>
                <TagInput
                  initialTags={formData.tags}
                  onChange={(newTags) => {
                    tagsRef.current = newTags;
                    setFormData((prev) => ({ ...prev, tags: newTags }));
                  }}
                />
              </div>
            )}

            {/* DURATION */}
            {show("duration") && (
              <div className="form-control w-full">
                <label className="label py-2">
                  <span className="label-text font-bold text-gray-700">
                    {t("labelDuration")}
                  </span>
                </label>
                <input
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  type="number"
                  className="input input-bordered w-full bg-gray-50 border-gray-200"
                />
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          {show("description") && (
            <div className="form-control w-full">
              <label className="label py-2">
                <span className="label-text font-bold text-gray-700">
                  {t("labelDescription")}
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("descriptionPlaceholder")}
                className="textarea textarea-bordered h-32 bg-gray-50 border-gray-200 w-full"
              ></textarea>
            </div>
          )}

          {/* FILE UPLOAD */}
          {show("file") && (
            <div className="form-control w-full">
              <label className="label py-2">
                <span className="label-text font-bold text-gray-700">
                  {isEditMode ? t("labelReplaceFile") : t("labelUploadFile")}{" "}
                  {isEditMode && (
                    <span className="text-gray-400 font-normal ml-1">({t("fileOptionalHint")})</span>
                  )}
                </span>
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-primary/5 hover:border-info transition-colors cursor-pointer relative">
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept={activeItem.allowedExtensions?.map((ext) => `.${ext}`).join(",") ?? ""}
                />
                <Upload
                  size={48}
                  className={formData.fileName ? "text-info mb-4" : "text-gray-300 mb-4"}
                />
                <p className="text-gray-600 font-semibold text-center">
                  {formData.fileName ? formData.fileName : t("clickToUpload")}
                </p>
                <p className="text-gray-500 text-sm">
                  {activeItem.subtitle}
                </p>
                {activeItem.fileLimit && (
                  <p className="text-gray-400 text-xs mt-1">
                    {t("fileSizeLimitLabel")} {activeItem.fileLimit}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push("/dashboard/content")}
            disabled={loading}
            className="btn btn-ghost px-8 normal-case text-gray-500 border border-gray-200"
          >
            {t("cancelButton")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn md:px-10 normal-case border-none text-white bg-info disabled:opacity-60"
          >
            {loading
              ? isEditMode ? t("savingButton") : t("uploadingButton")
              : isEditMode ? t("saveChangesButton") : t("uploadButton")}
          </button>
        </div>
      </form>
    </main>
  );
};

export default Content;

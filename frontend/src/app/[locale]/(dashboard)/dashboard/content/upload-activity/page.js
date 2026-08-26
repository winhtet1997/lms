'use client'
import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Eye,
    Save,
    Code2,
    Info,
    CheckCircle2,
    FileCode,
    Copy,
} from 'lucide-react';
import CodeSnipet from './CodeSnipet';
import TagInput from '@/components/ui/TagInput';
import { useCourseStore } from '@/store/useCourseStore';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const CreateActivityPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const isEditMode = Boolean(editId);
    const t = useTranslations("UploadActivityPage");

    const createItem = useCourseStore((state) => state.createItem);
    const updateItem = useCourseStore((state) => state.updateItem);
    const fetchItem = useCourseStore((state) => state.fetchItem);
    const setPreviewItem = useCourseStore((state) => state.setPreviewItem);
    const clearPreviewItem = useCourseStore((state) => state.clearPreviewItem);
    const previewItem = useCourseStore((state) => state.previewItem);
    const loading = useCourseStore((state) => state.loading);

    const [form, setForm] = useState({
        title: '',
        description: '',
        grade_level: '',
        tags: [],
        activity_code: '',
    });
    const [tagError, setTagError] = useState('');

    const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

    useEffect(() => {
        // If returning from preview, restore the previewed state (takes priority over API fetch)
        if (previewItem) {
            setForm({
                title: previewItem.title || '',
                description: previewItem.description || '',
                grade_level: previewItem.grade_level || '',
                tags: previewItem.tags || [],
                activity_code: previewItem.activity_code || '',
            });
            return;
        }
        // First load in edit mode: fetch from API
        if (!editId) return;
        fetchItem(Number(editId)).then((item) => {
            if (!item) return;
            setForm({
                title: item.title || '',
                description: item.description || '',
                grade_level: item.grade_level || '',
                tags: item.tags || [],
                activity_code: item.activity_code || '',
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount only — previewItem check must not re-run on store changes

    const handleSave = async () => {
        if (!form.title) return toast.error(t("toastErrorNoTitle"));
        if (!form.activity_code) return toast.error(t("toastErrorNoCode"));
        if (form.tags.length === 0) {
            setTagError(t("toastErrorNoTags"));
            return toast.error(t("toastErrorNoTags"));
        }
        setTagError('');

        const payload = {
            title: form.title,
            description: form.description,
            type: 'activity',
            grade_level: form.grade_level,
            tags: form.tags,
            activity_code: form.activity_code,
        };

        try {
            if (isEditMode) {
                await updateItem(Number(editId), payload, null);
                toast.success(t("toastUpdateSuccess"));
            } else {
                await createItem(payload, null);
                toast.success(t("toastSaveSuccess"));
            }
            clearPreviewItem();
            router.push('/dashboard/content');
        } catch {
            toast.error(isEditMode ? t("toastUpdateError") : t("toastSaveError"));
        }
    };

    const handlePreview = () => {
        setPreviewItem({ ...form, type: 'activity' });
        router.push('/dashboard/content/upload-activity/preview');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-700">
            {/* Header */}
            <header className="md:flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button className="btn btn-ghost btn-sm btn-square border border-gray-200" onClick={() => router.push('/dashboard/content')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{isEditMode ? t("headingEdit") : t("headingCreate")}</h1>
                        <p className="text-sm text-gray-500">{isEditMode ? t("subtitleEdit") : t("subtitleCreate")}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-ghost btn-sm normal-case border border-gray-200 bg-white" onClick={handlePreview}>
                        <Eye size={16} className="mr-2" /> {t("previewButton")}
                    </button>
                    <button
                        className="btn btn-info btn-sm normal-case bg-info shadow-none hover:bg-blue-800 border-none"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading
                            ? <span className="loading loading-spinner loading-xs" />
                            : <Save size={16} className="mr-2" />
                        }
                        {isEditMode ? t("updateButton") : t("saveButton")}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Activity Information */}
                    <div className="card bg-white border border-gray-200 shadow-sm">
                        <div className="card-body p-6">
                            <h5 className="text-md font-bold mb-1">{t("sectionActivityInfoTitle")}</h5>
                            <p className="text-xs text-gray-400 mb-4">{t("sectionActivityInfoSubtitle")}</p>

                            <div className="form-control w-full mb-4">
                                <label className="label py-1">
                                    <span className="label-text font-semibold text-xs text-slate-600">{t("labelActivityName")}</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={t("placeholderActivityName")}
                                    className="input input-bordered w-full bg-white text-sm"
                                    value={form.title}
                                    onChange={(e) => set('title')(e.target.value)}
                                />
                            </div>

                            <div className="form-control w-full mb-4 text-sm">
                                <label className="label py-1 label-text font-semibold text-xs text-slate-600">
                                    {t("labelDescription")}
                                </label>
                                <textarea
                                    className="textarea textarea-bordered h-24 bg-white w-full"
                                    placeholder={t("placeholderDescription")}
                                    value={form.description}
                                    onChange={(e) => set('description')(e.target.value)}
                                />
                            </div>

                            <div className="form-control w-full mb-4">
                                <label className="label py-1">
                                    <span className="label-text font-semibold text-xs text-slate-600">{t("labelGrade")}</span>
                                </label>
                                <select
                                    className="select select-bordered font-normal bg-white text-sm w-full"
                                    value={form.grade_level}
                                    onChange={(e) => set('grade_level')(e.target.value)}
                                >
                                    <option value="" disabled>{t("gradeSelectDefault")}</option>
                                    <option value="6">{t("grade6")}</option>
                                    <option value="7">{t("grade7")}</option>
                                    <option value="8">{t("grade8")}</option>
                                    <option value="9">{t("grade9")}</option>
                                    <option value="10">{t("grade10")}</option>
                                    <option value="11">{t("grade11")}</option>
                                    <option value="12">{t("grade12")}</option>
                                </select>
                            </div>

                            <div className="form-control w-full">
                                <label className="label py-1">
                                    <span className="label-text font-semibold text-xs text-slate-600">{t("labelTags")}</span>
                                </label>
                                <TagInput
                                    onChange={(tags) => { set('tags')(tags); if (tags.length > 0) setTagError(''); }}
                                    error={tagError}
                                    initialTags={form.tags}
                                />
                               
                            </div>
                        </div>
                    </div>

                    
                </div>

                {/* Right Column - Activity Code */}
                <div className="lg:col-span-8">
                    <CodeSnipet value={form.activity_code} onChange={set('activity_code')} />
                </div>
            </div>
        </div>
    );
};

export default CreateActivityPage;

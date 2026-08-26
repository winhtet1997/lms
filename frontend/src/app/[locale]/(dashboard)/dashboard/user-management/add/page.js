'use client';

import React, { useState } from 'react';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const ROLES = [
    { value: 1, labelKey: 'roleStudent', descKey: 'roleStudentDesc' },
    { value: 2, labelKey: 'roleParent', descKey: 'roleParentDesc' },
    { value: 3, labelKey: 'roleTutor', descKey: 'roleTutorDesc' },
    { value: 4, labelKey: 'roleAdmin', descKey: 'roleAdminDesc' },
    { value: 999, labelKey: 'roleSuperadmin', descKey: 'roleSuperadminDesc' },
];

const GRADE_KEYS = ['grade6', 'grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12'];

const PLANS = ['planNone', 'planGold', 'planSilver'];

export default function AddUserPage() {
    const t = useTranslations('AddUser');
    const router = useRouter();
    const { adminCreateUser } = useAuthStore();

    const [form, setForm] = useState({
        full_name: '',
        username: '',
        email: '',
        password: '',
        role: 1,
        is_active: true,
        grade_level: '',
        plan: 'planNone',
        free_test_access: false,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await adminCreateUser({
                full_name: form.full_name,
                username: form.username,
                email: form.email,
                password: form.password,
                role: form.role,
                grade_level: form.grade_level || null,
                is_active: form.is_active,
            });
            toast.success(t('createSuccess'));
            router.push('/dashboard/user-management');
        } catch (err) {
            const msg = err?.message || err?.fieldErrors
                ? Object.values(err.fieldErrors || {}).flat().join(' ')
                : t('createError');
            toast.error(msg || t('createError'));
        } finally {
            setSubmitting(false);
        }
    };

    const selectedRole = ROLES.find((r) => r.value === form.role);

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <button
                className="btn btn-ghost btn-sm flex items-center gap-2 text-sm font-medium text-slate-500 mb-6 w-fit"
                onClick={() => router.push('/dashboard/user-management')}
            >
                <ChevronLeft size={16} /> {t('backToUsers')}
            </button>

            <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <UserPlus size={22} className="text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-gray-500 text-sm">{t('subtitle')}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h2 className="font-semibold text-base">{t('basicInfoTitle')}</h2>

                    <div className="form-control">
                        <label className="label pb-1">
                            <span className="label-text font-medium">
                                {t('fullName')} <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder={t('fullNamePlaceholder')}
                            value={form.full_name}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label pb-1">
                            <span className="label-text font-medium">
                                {t('username')} <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder={t('usernamePlaceholder')}
                            value={form.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label pb-1">
                            <span className="label-text font-medium">
                                {t('emailAddress')} <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            type="email"
                            className="input input-bordered w-full"
                            placeholder={t('emailPlaceholder')}
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label pb-1">
                            <span className="label-text font-medium">
                                {t('password')} <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            placeholder={t('passwordPlaceholder')}
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            minLength={8}
                            required
                        />
                        <label className="label pt-1">
                            <span className="label-text-alt text-gray-400">{t('passwordHint')}</span>
                        </label>
                    </div>
                </div>

                {/* Role & Permissions */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h2 className="font-semibold text-base">{t('rolePermissionsTitle')}</h2>

                    <div className="form-control">
                        <label className="label pb-1">
                            <span className="label-text font-medium">
                                {t('userRole')} <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={form.role}
                            onChange={(e) => {
                                const role = Number(e.target.value);
                                setForm((prev) => ({
                                    ...prev,
                                    role,
                                    grade_level: role === 1 ? prev.grade_level : '',
                                }));
                            }}
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {t(r.labelKey)}
                                </option>
                            ))}
                        </select>
                        {selectedRole && (
                            <label className="label pt-1">
                                <span className="label-text-alt text-gray-400">{t(selectedRole.descKey)}</span>
                            </label>
                        )}
                    </div>

                    {form.role === 1 && (
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">
                                    {t('gradeLevel')} <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={form.grade_level}
                                onChange={(e) => handleChange('grade_level', e.target.value)}
                            >
                                <option value="">{t('gradePlaceholder')}</option>
                                {GRADE_KEYS.map((key) => (
                                    <option key={key} value={key.replace('grade', '')}>{t(key)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-control">
                        <label className="label pb-1">
                            <span className="label-text font-medium">
                                {t('accountStatus')} <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={form.is_active ? 'active' : 'suspended'}
                            onChange={(e) => handleChange('is_active', e.target.value === 'active')}
                        >
                            <option value="active">{t('statusActive')}</option>
                            <option value="suspended">{t('statusSuspended')}</option>
                        </select>
                    </div>
                </div>

                {/* Subscription Level */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h2 className="font-semibold text-base">{t('subscriptionTitle')}</h2>

                    <div className="form-control">
                        <label className="label pb-1">
                            <span className="label-text font-medium">
                                {t('plan')} <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={form.plan}
                            onChange={(e) => handleChange('plan', e.target.value)}
                        >
                            {PLANS.map((key) => (
                                <option key={key} value={key}>{t(key)}</option>
                            ))}
                        </select>
                        {form.plan === 'planNone' && (
                            <label className="label pt-1">
                                <span className="label-text-alt text-gray-400">{t('planNoneDesc')}</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Free Test Access */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">{t('freeTestTitle')}</p>
                            <p className="text-sm text-gray-400 mt-0.5">{t('freeTestDesc')}</p>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-info"
                            checked={form.free_test_access}
                            onChange={(e) => handleChange('free_test_access', e.target.checked)}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 pb-6">
                    <button
                        type="button"
                        className="btn btn-ghost border border-gray-200"
                        onClick={() => router.push('/dashboard/user-management')}
                        disabled={submitting}
                    >
                        {t('cancelButton')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-info text-white gap-2"
                        disabled={submitting}
                    >
                        {submitting
                            ? <span className="loading loading-spinner loading-sm" />
                            : <><UserPlus size={16} /> {t('createButton')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

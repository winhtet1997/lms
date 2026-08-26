"use client";
import {useAuthStore} from "@/store/useAuthStore";
import {Eye, EyeOff, GraduationCap, Lock, Mail, Phone, User} from "lucide-react";
import {useTranslations} from "next-intl";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import {ROLE_REDIRECTS} from "@/constants/auth";

const StudentRegistration = () => {
    const t = useTranslations("RegistrationStudent");
    const register = useAuthStore((state) => state.registerStudent);
    const googleCompleteSetup = useAuthStore((state) => state.googleCompleteSetup);
    const error = useAuthStore((state) => state.error);
    const fieldErrors = useAuthStore((state) => state.fieldErrors);

    const router = useRouter();

    const [googleSetupData, setGoogleSetupData] = useState(() => {
        if (typeof window === "undefined") return null;
        const raw = localStorage.getItem("google-setup-data");
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data.role === 1 ? data : null;
    });
    const [username, setUsername] = useState("");
    const [fullName, setFullname] = useState(googleSetupData?.full_name || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState(googleSetupData?.email || "");
    const [phone, setPhone] = useState("");
    const [grade, setGrade] = useState("");
    const [contactMethod, setContactMethod] = useState("email");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [googleAccountExists, setGoogleAccountExists] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const reset = useAuthStore((state) => state.resetErrors);
    useEffect(() => {
        reset();
    }, [reset]);
    useEffect(() => {
        const raw = localStorage.getItem("google-setup-data");
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data.role === 1) localStorage.removeItem("google-setup-data");
            } catch {}
        }
    }, []);

    const handleGoogleSetup = (setupData) => {
        setGoogleSetupData(setupData);
        setFullname(setupData.full_name || "");
        setEmail(setupData.email || "");
        reset();
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (googleSetupData) {
                const result = await googleCompleteSetup({
                    temp_token: googleSetupData.temp_token,
                    username,
                    password,
                    confirm_password: confirmPassword,
                    full_name: fullName,
                    grade_level: grade,
                });
                if (result.success) {
                    router.push(ROLE_REDIRECTS[1]);
                }
                return;
            }

            const payload = {
                full_name: fullName,
                username,
                email: contactMethod === "email" ? email : null,
                phone: contactMethod === "phone" ? phone : null,
                password,
                grade_level: grade,
                confirm_password: confirmPassword,
            };

            try {
                await register(payload);
                if (payload.email) {
                    localStorage.setItem("pendingEmail", payload.email);
                    localStorage.removeItem("pendingPhone");
                } else {
                    localStorage.setItem("pendingPhone", payload.phone);
                    localStorage.removeItem("pendingEmail");
                }
                router.push("/registration/verify-otp?type=verify&userType=student");
            } catch (error) {
                console.error("registration failed", error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card w-full max-w-2xl bg-white shadow-xl rounded-2xl border border-gray-200 md:my-20">
                <div className="card-body gap-4">
                    <form onSubmit={handleRegisterSubmit}>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <GraduationCap size={20} color="#0052b4"/>
                            <p className="text-lg font-medium text-black">
                                {t("header")}
                            </p>
                        </div>
                        <p className="text-sm text-gray-600 my-2">
                            {t("subtitle")}
                        </p>

                        {/* Google setup banner */}
                        {googleSetupData && (
                            <div
                                className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 my-2">
                                {googleSetupData.avatar_url && (
                                    <img src={googleSetupData.avatar_url} alt="Google profile"
                                         className="w-8 h-8 rounded-full"/>
                                )}
                                <p className="text-sm text-blue-900">
                                    Signed in with Google as <span
                                    className="font-medium">{googleSetupData.email}</span>. Choose a username and
                                    password to finish.
                                </p>
                            </div>
                        )}

                        {/* Full Name (Frontend only) */}
                        <div className="form-control my-2">
                            <span className="label-text font-medium text-black">
                                {t("fullNameLabel")}
                            </span>
                            <label className="input w-full">
                                <User size={16} color="#737373"/>
                                <input
                                    type="text"
                                    placeholder={t("fullNamePlaceholder")}
                                    minLength="3"
                                    required
                                    maxLength="30"
                                    value={fullName}
                                    onChange={(e) => setFullname(e.target.value)}
                                />
                            </label>
                        </div>
                        {/* Username */}
                        <div className="form-control my-2">
                            <span className="label-text font-medium text-black">
                            {t("usernameLabel")}
                            </span>
                            <label className="input w-full">
                                <User size={16} color="#737373"/>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("usernamePlaceholder")}
                                    minLength="3"
                                    maxLength="30"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </label>
                        </div>

                        {/* Contact — locked email when Google mode, tabs otherwise */}
                        {googleSetupData ? (
                            <div className="form-control my-2">
                                <span className="label-text font-medium text-black">{t("emailTab")}</span>
                                <label className="input w-full bg-gray-50">
                                    <Mail size={16} color="#737373"/>
                                    <input type="email" value={googleSetupData.email} readOnly
                                           className="w-full text-gray-500"/>
                                </label>
                            </div>
                        ) : (
                            <div className="w-full mx-auto my-2">
                                <span className="label-text font-medium text-black">
                                  {t("registerWithLabel")}
                                </span>
                                <div className="tabs tabs-lifted rounded-lg">
                                    {/* Email Tab */}
                                    <input
                                        type="radio"
                                        name="contact_tabs"
                                        id="tab-email"
                                        defaultChecked
                                        className="tab peer/email hidden"
                                        onChange={() => {
                                            setContactMethod("email");
                                            setPhone("");
                                        }}
                                    />
                                    <label
                                        htmlFor="tab-email"
                                        className="tab flex items-center gap-2 w-1/2 bg-gray-100 text-black peer-checked/email:bg-[#0052b4] peer-checked/email:text-white rounded-md transition"
                                    >
                                        <Mail size={16}/>
                                        {t("emailTab")}
                                    </label>
                                    <div
                                        className="tab-content bg-white rounded-md mt-2 hidden peer-checked/email:block">
                                        <div className="form-control gap-1">
                                            <label className="input input-bordered flex items-center gap-2 w-full">
                                                <Mail size={16} className="text-gray-500"/>
                                                <input
                                                    type="email"
                                                    placeholder={t("emailPlaceholder")}
                                                    className="w-full"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required={contactMethod === "email"}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Phone Tab */}
                                    <input
                                        type="radio"
                                        name="contact_tabs"
                                        id="tab-phone"
                                        className="tab peer/phone hidden"
                                        onChange={() => {
                                            setContactMethod("phone");
                                            setEmail("");
                                        }}
                                    />
                                    <label
                                        htmlFor="tab-phone"
                                        className="tab flex items-center gap-2 w-1/2 bg-gray-100 text-black peer-checked/phone:bg-[#0052b4] peer-checked/phone:text-white rounded-md transition"
                                    >
                                        <Phone size={16}/>
                                        {t("phoneTab")}
                                    </label>
                                    <div
                                        className="tab-content bg-white rounded-md mt-2 hidden peer-checked/phone:block">
                                        <div className="form-control gap-1">
                                            <label className="input input-bordered flex items-center gap-2 w-full">
                                                <Phone size={16} className="text-gray-500"/>
                                                <input
                                                    type="tel"
                                                    placeholder={t("phonePlaceholder")}
                                                    className="w-full tabular-nums"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    required={contactMethod === "phone"}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Passwords */}
                        <div className="grid md:grid-cols-2 gap-4 my-2">
                            <div className="form-control">
                                <span className="label-text font-medium text-black">
                                  {t("passwordLabel")}
                                </span>
                                <label className="input w-full">
                                    <Lock size={16} color="#737373"/>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder={t("passwordPlaceholder")}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}

                                        aria-label={
                                            showPassword ? "Hide password" : "Show password"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5"/>
                                        ) : (
                                            <Eye className="w-5 h-5"/>
                                        )}
                                    </button>
                                </label>
                            </div>

                            <div className="form-control">
                                <span className="label-text font-medium text-black">
                                  {t("confirmPasswordLabel")}
                                </span>
                                <label className="input w-full">
                                    <Lock size={16} color="#737373"/>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        placeholder={t("confirmPasswordPlaceholder")}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}

                                        aria-label={
                                            showConfirmPassword ? "Hide password" : "Show password"
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5"/>
                                        ) : (
                                            <Eye className="w-5 h-5"/>
                                        )}
                                    </button>
                                </label>
                            </div>
                        </div>

                        <fieldset className="fieldset my-2">
                            <legend className="fieldset-legend">{t("gradesLegend")}</legend>
                            <select defaultValue="" className="select w-full" required
                                    onChange={(e) => setGrade(e.target.value)}>
                                <option disabled value="">
                                    {t("gradesSelectDefault")}
                                </option>
                                <option value="6">{t("grade6")}</option>
                                <option value="7">{t("grade7")}</option>
                                <option value="8">{t("grade8")}</option>
                                <option value="9">{t("grade9")}</option>
                                <option value="10">{t("grade10")}</option>
                                <option value="11">{t("grade11")}</option>
                                <option value="12">{t("grade12")}</option>
                            </select>
                        </fieldset>

                        {/* Parent Contact (Frontend only) */}
                        <div className="divider p-0 m-0"></div>
                        <p className="text-lg font-medium text-black">
                            {t("parentContactTitle")}
                        </p>
                        <p>{t("parentContactHint")}</p>

                        <div className="form-control my-2">
                            <span className="label-text font-medium text-black">
                            {t("parentEmailLabel")}
                            </span>
                            <label className="input w-full">
                                <User size={16} color="#737373"/>
                                <input
                                    type="email"
                                    placeholder={t("parentEmailPlaceholder")}
                                    className="w-full"
                                />
                            </label>
                        </div>

                        <p className="text-center">{t("or")}</p>

                        <div className="form-control my-2">
                            <span className="label-text font-medium text-black">
                            {t("parentPhoneLabel")}
                            </span>
                            <label className="input w-full">
                                <User size={16} color="#737373"/>
                                <input type="tel" placeholder={t("parentPhonePlaceholder")} className="w-full"/>
                            </label>
                        </div>

                        {/* Terms */}
                        <div className="flex gap-2 my-2">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="checkbox checkbox-xs rounded-sm"
                            />
                            {t("termsCheckbox")}
                        </div>

                        {fieldErrors && Object.keys(fieldErrors).length > 0 ? (
                            <div className="text-red-500 text-sm text-center space-y-1">
                                {Object.values(fieldErrors).map((msg, i) => (
                                    <p key={i}>{msg}</p>
                                ))}
                            </div>
                        ) : (
                            error && (
                                <p className="text-red-500 text-sm text-center font-medium animate-in fade-in duration-300">
                                    {error}
                                </p>
                            )
                        )}

                        {/* Buttons */}
                        <div className="grid grid-cols-4 my-2">
                            <Link href="/registration">
                                <button
                                    className="btn btn-ghost w-32 border border-gray-200 rounded-lg shadow-none">
                                    {t("backButton")}
                                </button>
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-ghost bg-[#0052b4] w-full text-white rounded-lg shadow-none col-span-3 disabled:opacity-70"
                            >
                                {submitting ? t("submittingButton") : t("submitButton")}
                            </button>
                        </div>

                        {!googleSetupData && (
                            <>
                                <div className="divider text-gray-400 text-xs my-1">OR</div>
                                {googleAccountExists && (
                                    <div
                                        className="alert bg-yellow-50 border border-yellow-300 text-yellow-900 text-sm rounded-lg p-3 mb-2">
                                        <p>An account with this Google address already exists.</p>
                                        <Link href="/login/student" className="font-medium underline">
                                            Go to login →
                                        </Link>
                                    </div>
                                )}
                                <GoogleSignInButton
                                    role={1}
                                    onNeedsSetup={handleGoogleSetup}
                                    onAlreadyExists={() => setGoogleAccountExists(true)}
                                />
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentRegistration;

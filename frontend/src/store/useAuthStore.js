import { authService } from "@/service/authService";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import handleError from "@/lib/handleError";

export const useAuthStore = create(
    persist((set, get) => ({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        fieldErrors: {},
        users: [],
        totalUsers: 0,
        totalStudents: 0,
        totalTutors: 0,
        totalParents: 0,
        totalInactiveUsers: 0,
        resetErrors: () => set({ error: null, fieldErrors: {} }),

        loginParents: async (username, password) => {
            // console.log("[AuthStore] login started", { username });
            set({ loading: true, error: null });
            try {
                const data = await authService.loginParents(username, password);
                const user = await authService.GetCurrentUser();
                // console.log(user);
                set({ user: user ?? null, isAuthenticated: true, loading: false, isVerified: true });
                return { ...data.user, success: true };
            } catch (error) {
                const errMsg = handleError(error);

                const apiResponse = error.response?.data;
                const isUnverified =
                    apiResponse?.is_verified === false ||
                    apiResponse?.is_verified === "False" ||
                    apiResponse?.detail?.includes("not verified");

                if (isUnverified && typeof window !== "undefined") {
                    if (apiResponse?.email) {
                        localStorage.setItem("pendingEmail", apiResponse.email);
                        localStorage.removeItem("pendingPhone");
                    } else if (apiResponse?.phone) {
                        localStorage.setItem("pendingPhone", apiResponse.phone);
                        localStorage.removeItem("pendingEmail");
                    }
                }

                set({
                    user: null,
                    loading: false,
                    isAuthenticated: false,
                    error: errMsg.message || error.response?.data?.detail || "Login failed!!",
                    isVerified: isUnverified ? false : null,
                });
                return {
                    success: false,
                    isUnverified: isUnverified,
                    message: errMsg.message,
                };
            }
        },
        loginStudent: async (username, password) => {
            set({ loading: true, error: null });
            try {
                const data = await authService.loginStudent(username, password);
                // console.log("[AuthStore] login successful", data);

                const user = await authService.GetCurrentUser();
                set({ user: user, loading: false, isAuthenticated: true, isVerified: true });
                return { ...data, success: true };
            } catch (error) {
                const errMsg = handleError(error);

                // Check if the API specifically sent "is_verified": false in the error body
                const apiResponse = error.response?.data;
                const isUnverified =
                    apiResponse?.is_verified === false ||
                    apiResponse?.is_verified === "False" ||
                    apiResponse?.detail?.includes("not verified");

                if (isUnverified && typeof window !== "undefined") {
                    if (apiResponse?.email) {
                        localStorage.setItem("pendingEmail", apiResponse.email);
                        localStorage.removeItem("pendingPhone");
                    } else if (apiResponse?.phone) {
                        localStorage.setItem("pendingPhone", apiResponse.phone);
                        localStorage.removeItem("pendingEmail");
                    }
                }

                set({
                    user: null,
                    loading: false,
                    isAuthenticated: false,
                    error:
                        errMsg.message || error.response?.data?.detail || "Login failed!!",
                    isVerified: isUnverified ? false : null, // Explicitly set false ONLY if unverified
                });

                // We return a custom object so the component knows WHY it failed
                return {
                    success: false,
                    isUnverified: isUnverified,
                    message: errMsg.message,
                };
            }
        },
        loginTutor: async (username, password) => {
            // console.log("[AuthStore] login started", { username });
            set({ loading: true, error: null });
            try {
                const data = await authService.loginTutor(username, password);
                // console.log("[AuthStore] login successful", data);
                const user = await authService.GetCurrentUser();
                set({ user: user ?? null, isAuthenticated: true, loading: false });
                return data;
            } catch (error) {
                const errMsg = error.response?.data?.detail || "Login failed!!";
                set({
                    user: null,
                    loading: false,
                    isAuthenticated: false,
                    error: errMsg,
                });
                throw new Error(errMsg);
            }
        },
        loginSuperAdmin: async (username, password) => {
            // console.log("[AuthStore] login started", { username });
            set({ loading: true, error: null });
            try {
                const data = await authService.loginSuperAdmin(username, password);
                // console.log("[AuthStore] login successful", data);
                const user = await authService.GetCurrentUser();
                set({ user: user ?? null, isAuthenticated: true, loading: false });
                return data;
            } catch (error) {
                const errMsg = error.response?.data?.detail || "Login failed!!";
                set({
                    user: null,
                    loading: false,
                    isAuthenticated: false,
                    error: errMsg,
                });
                throw new Error(errMsg);
            }
        },

        registerParents: async (formData) => {
            // console.log("[AuthStore] registration started", { formData });
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.registerParents(formData);
                // console.log("[AuthStore] registration successful", data);
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },
        registerStudent: async (formData) => {
            // console.log("[AuthStore] registration started", { formData });
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.registerStudent(formData);
                // console.log("[AuthStore] registration successful", data);
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                console.log(errMsg);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },

        verifyUser: async (otp) => {
            // console.log("[AuthStore] user verification started", { otp });
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.verifyUser(otp);
                // console.log("[AuthStore] user verification successful", data);
                set({ loading: false });
                localStorage.removeItem("pendingEmail");
                localStorage.removeItem("pendingPhone");
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                console.log(errMsg);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },

        getForgotPasswordChannels: async (username) => {
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.ForgotPasswordGetChannels(username);
                set({ loading: false });
                return data; // { channels: [...] }
            } catch (error) {
                const errMsg = handleError(error);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },
        ForgotPassword: async ({ username, channel } = {}) => {
            // console.log("[AuthStore] forgot password started", { username, channel });
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.ForgotPassword({ username, channel });
                // console.log("[AuthStore] forgot password successful", data);
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                // console.log(errMsg);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },
        resetPassword: async (password, confirm_password, otp, identifier, identifierType = "auto") => {
            // console.log("[AuthStore] reset started", { otp });
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.ResetPassword(
                    password,
                    confirm_password,
                    otp,
                    identifier,
                    identifierType,
                );
                // console.log("success", data);
                localStorage.removeItem("otp");
                localStorage.removeItem("pendingEmail");
                localStorage.removeItem("pendingPhone");
                localStorage.removeItem("pendingUsername");
                localStorage.removeItem("pendingMaskedContact");
                localStorage.removeItem("pendingChannel");
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },
        resendOtp: async (identifier, otp_type, identifierType = "auto", channel) => {
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.ResendOtp(identifier, otp_type, identifierType, channel);
                // console.log("success", data);
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                set({
                    loading: false,
                    error: errMsg.message || "Failed to resend OTP",
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },
        verifyOtp: async (otp, identifier, identifierType = "auto") => {
            // console.log("[AuthStore] user verification started", { otp });
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.VerifyOtp(otp, identifier, identifierType);
                // console.log("[AuthStore] user verification successful", data);
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                // console.log(errMsg);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                throw errMsg;
            }
        },
        getCurrentUser: async () => {
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const user = await authService.GetCurrentUser();
                // console.log("details", user);
                set({ user: user, loading: false }); // directly assign
                return user;
            } catch (error) {
                set({ user: null, loading: false, error: "Failed to fetch user" });
                return null;
            }
        },
        fetchUsers: async (params = {}) => {
            set({ loading: true, error: null });
            try {
                const data = await authService.getUsers(params);

                set({
                    users: data.users,
                    totalUsers: data.total_users,
                    totalStudents: data.total_students,
                    totalParents: data.total_parents,
                    totalTutors: data.total_tutors,
                    totalInactiveUsers: data.inactive_users,
                    loading: false,
                });
                return data;
            } catch (error) {
                const errMsg = handleError(error);

                const apiResponse = error.response?.data;
                set({
                    users: [],
                    loading: false,
                    error: errMsg || apiResponse?.detail || "Failed to get users",
                });
            }
        },
        fetchUserById: async (id) => {
            set({ loading: true, error: null });
            try {
                const data = await authService.getUserById(id);
                set({ loading: false });
                return data;
            }
            catch (error) {
                const errMsg = handleError(error);
                const apiResponse = error.response?.data;
                set({ loading: false, error: errMsg || apiResponse?.detail || "Failed to get user details" });
                throw errMsg;
            }
        },
        updateUserById: async (id, formData) => {
            set({ loading: true, error: null });
            try {
                const data = await authService.editUserbyId(id, formData);
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                const apiResponse = error.response?.data;
                set({ loading: false, error: errMsg || apiResponse?.detail || "Failed to update user" });
                throw errMsg;
            }
        },

        deleteUser: async (id) => {
            set({ loading: true, error: null });
            try {
                await authService.deleteUser(id);
                set((state) => ({
                    users: state.users.filter((u) => u.id !== id),
                    totalUsers: state.totalUsers - 1,
                    loading: false,
                }));
            } catch (error) {
                const errMsg = handleError(error);
                set({ loading: false, error: errMsg.message || "Failed to delete user" });
                throw errMsg;
            }
        },
        adminCreateUser: async (formData) => {
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.adminCreateUser(formData);
                set({ loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                set({ loading: false, error: errMsg.message, fieldErrors: errMsg.fieldErrors });
                throw errMsg;
            }
        },
        updateMe: async (formData) => {
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.updateMe(formData);
                set({ user: data, loading: false });
                return data;
            } catch (error) {
                const errMsg = handleError(error);
                set({ loading: false, error: errMsg.message, fieldErrors: errMsg.fieldErrors });
                throw errMsg;
            }
        },
        googleLogin: async (idToken, role, { registrationMode = false } = {}) => {
            set({ loading: true, error: null });
            try {
                const data = await authService.googleAuth(idToken, role, { preventSave: registrationMode });
                if (data.needs_setup) {
                    if (typeof window !== "undefined") {
                        localStorage.setItem("google-setup-data", JSON.stringify({
                            temp_token: data.temp_token,
                            email: data.email,
                            full_name: data.full_name,
                            avatar_url: data.avatar_url,
                            role,
                        }));
                    }
                    set({ loading: false });
                    return {
                        needs_setup: true,
                        setupData: {
                            temp_token: data.temp_token,
                            email: data.email,
                            full_name: data.full_name,
                            avatar_url: data.avatar_url,
                            role,
                        },
                    };
                }
                if (registrationMode) {
                    set({ loading: false });
                    return { alreadyExists: true };
                }
                const user = await authService.GetCurrentUser();
                set({ user, isAuthenticated: true, loading: false });
                return { success: true };
            } catch (error) {
                const errMsg = handleError(error);
                set({ loading: false, error: errMsg.message });
                return { success: false, message: errMsg.message };
            }
        },
        googleCompleteSetup: async (formData) => {
            set({ loading: true, error: null, fieldErrors: {} });
            try {
                const data = await authService.googleCompleteSetup(formData);
                const user = await authService.GetCurrentUser();
                set({ user, isAuthenticated: true, loading: false });
                if (typeof window !== "undefined") {
                    localStorage.removeItem("google-setup-data");
                }
                return { success: true, role: data.user.role };
            } catch (error) {
                const errMsg = handleError(error);
                set({
                    loading: false,
                    error: errMsg.message,
                    fieldErrors: errMsg.fieldErrors,
                });
                return { success: false, message: errMsg.message };
            }
        },
        logout: () => {
            set({
                isAuthenticated: false,
                user: null,
                accessToken: null,
                refreshToken: null,
            });

            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("pendingEmail");
            localStorage.removeItem("pendingPhone");
            localStorage.removeItem("auth-storage");
            localStorage.removeItem("course-store");

            if (typeof document !== "undefined") {
                document.cookie = "auth_role=; path=/; max-age=0";
            }

            if (typeof window !== "undefined") {
                window.location.href = "/";
            }
        },

    }), {
        name: "auth-storage",
        partialize: (state) => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
        }),
    }),
);

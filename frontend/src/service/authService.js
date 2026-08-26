import apiClient from "@/lib/api";

const isEmailAddress = (value) => /\S+@\S+\.\S+/.test(value || "");

const buildIdentifierPayload = (identifier, identifierType) => {
    if (identifierType === "username") return {username: identifier};
    if (identifierType === "email") return {email: identifier};
    if (identifierType === "phone") return {phone: identifier};
    return isEmailAddress(identifier) ? {email: identifier} : {phone: identifier};
};

const saveToken = (token) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("access", token);
    }
};
const saveRefreshToken = (refreshToken) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("refresh", refreshToken);
    }
};

const saveRoleCookie = (role) => {
    if (typeof document !== "undefined") {
        const maxAge = 7 * 24 * 60 * 60;
        document.cookie = `auth_role=${role}; path=/; SameSite=Lax; max-age=${maxAge}`;
    }
};

const removeToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh")
    }
};
export const authService = {
    loginParents: async (username, password) => {
        const {data} = await apiClient.post("/auth/parent-login/", {
            username,
            password,
        });
        saveToken(data.access);
        saveRefreshToken(data.refresh);
        saveRoleCookie("parent");
        return data;
    },
    loginStudent: async (username, password) => {
        const {data} = await apiClient.post("/auth/student-login/", {
            username,
            password,
        });
        saveToken(data.access);
        saveRefreshToken(data.refresh);
        saveRoleCookie("student");
        return data;
    },
    loginTutor: async (username, password) => {
        const {data} = await apiClient.post("/auth/tutor-login/", {
            username,
            password,
        });
        saveToken(data.access);
        saveRefreshToken(data.refresh);
        saveRoleCookie("tutor");
        return data;
    },
    loginSuperAdmin: async (username, password) => {
        const {data} = await apiClient.post("/auth/superadmin-login/", {
            username,
            password,
        });
        saveToken(data.access);
        saveRefreshToken(data.refresh);
        saveRoleCookie("super_admin");
        return data;
    },

    registerParents: async (formData) => {
        const {data} = await apiClient.post(
            "/auth/parent-register/",
            formData,
        );
        return data;
    },
    registerStudent: async (formData) => {
        const {data} = await apiClient.post(
            "/auth/student-register/",
            formData,
        );
        return data;
    },
    verifyUser: async (otp) => {
        const {data} = await apiClient.post("/auth/verify-user/", {otp});
        return data;
    },
    ForgotPasswordGetChannels: async (username) => {
        const {data} = await apiClient.post("/auth/forgot-password/channels/", {
            username,
        });
        return data;
    },
    ForgotPassword: async ({username, channel}) => {
        const {data} = await apiClient.post("/auth/forgot-password/", {
            username,
            channel,
        });
        return data;
    },
    ResetPassword: async (password, confirm_password, otp, identifier, identifierType = "auto") => {
        const payload = buildIdentifierPayload(identifier, identifierType);
        const {data} = await apiClient.post("/auth/reset-password/", {
            password,
            confirm_password,
            otp,
            ...payload,
        });
        return data;
    },
    VerifyOtp: async (otp, identifier, identifierType = "auto") => {
        const payload = buildIdentifierPayload(identifier, identifierType);
        const {data} = await apiClient.post("/auth/verify-otp/", {otp, ...payload});
        return data;
    },
    ResendOtp: async (identifier, otp_type, identifierType = "auto", channel) => {
        const payload = buildIdentifierPayload(identifier, identifierType);
        const {data} = await apiClient.post(
            "/auth/resend-verification-otp/",
            {...payload, otp_type, ...(channel ? {channel} : {})},
        );
        return data;
    },
    GetCurrentUser: async () => {
        const {data} = await apiClient.get("/auth/me/")
        return data;
    },
    Logout: async () => {
        removeToken();
    },
    getUsers: async (params = {}) => {
        const {data} = await apiClient.get("/auth/users/", { params })
        return data;
    },
    getUserById: async(id)=> {
        const {data} = await apiClient.get(`/auth/users/${id}/`)
        return data;
    },
    editUserbyId: async(id, formData) => {
        const {data} = await apiClient.patch(`/auth/users/${id}/`, formData)
        return data;
    },
    deleteUser: async (id) => {
        const {data} = await apiClient.delete(`/auth/users/${id}/`)
        return data;
    },
    adminCreateUser: async (formData) => {
        const {data} = await apiClient.post("/auth/users/", formData);
        return data;
    },
    updateMe: async (formData) => {
        const {data} = await apiClient.patch("/auth/me/", formData);
        return data;
    },
    googleAuth: async (idToken, role, { preventSave = false } = {}) => {
        const {data} = await apiClient.post("/auth/google-auth/", {
            id_token: idToken,
            role,
        });
        if (!data.needs_setup && !preventSave) {
            const roleNames = { 1: "student", 2: "parent", 3: "tutor" };
            saveToken(data.access);
            saveRefreshToken(data.refresh);
            saveRoleCookie(roleNames[data.user?.role] || "student");
        }
        return data;
    },
    googleCompleteSetup: async (payload) => {
        const {data} = await apiClient.post("/auth/google-complete-setup/", payload);
        saveToken(data.access);
        saveRefreshToken(data.refresh);
        const roleNames = { 1: "student", 2: "parent", 3: "tutor" };
        saveRoleCookie(roleNames[data.user?.role] || "student");
        return data;
    },
};

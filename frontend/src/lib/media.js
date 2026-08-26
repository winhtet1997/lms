// Backend API base URL includes a trailing "/api" path, but media files are
// served from the server root, so that suffix needs to be stripped off.
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

export function resolveMediaUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_ORIGIN}/${path.replace(/^\//, "")}`;
}

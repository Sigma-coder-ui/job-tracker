const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function api(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isJson = options.body && typeof options.body === "string";
  const res = await fetch(API + path, {
    ...options,
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 && token) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    throw new Error(typeof err.detail === "string" ? err.detail : "Please check your input and try again.");
  }
  return res.status === 204 ? null : res.json();
}

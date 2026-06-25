const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (path: string) => fetchWithAuth(path),
  post: (path: string, body: unknown) =>
    fetchWithAuth(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) =>
    fetchWithAuth(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => fetchWithAuth(path, { method: "DELETE" }),
};

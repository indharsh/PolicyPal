const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// FastAPI sends errors as {detail: "text"} or, for validation, {detail: [{loc, msg}, ...]}
function extractMessage(data) {
  if (!data || !data.detail) return null;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`)
      .join("; ");
  }
  return null;
}

async function request(path, options = {}, token) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    // network failure: API down, wrong URL, or blocked by CORS
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(data) ?? "Something went wrong", res.status);
  }
  return data;
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function loginUser(username, password) {
  // The login endpoint expects a form, not JSON (that's what OAuth2PasswordRequestForm reads)
  const body = new URLSearchParams({ username, password });
  return request("/auth/login", { method: "POST", body });
}

export function getMe(token) {
  return request("/auth/me", {}, token);
}
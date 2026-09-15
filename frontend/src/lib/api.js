const API_BASE_URL = "/api";

export const ADMIN_SESSION_STORAGE_KEY = "cic-admin-session-v2";

export function readStoredAdminSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    console.error("Unable to read stored admin session.", error);
    return null;
  }
}

export function writeStoredAdminSession(session) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      ADMIN_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
    return true;
  } catch (error) {
    console.error("Unable to persist the admin session.", error);
    return false;
  }
}

export function clearStoredAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, token, headers = {} } = options;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const requestHeaders = {
    ...headers,
  };

  if (body !== undefined && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  let responseData = null;

  try {
    responseData = await response.json();
  } catch (error) {
    responseData = null;
  }

  if (!response.ok) {
    throw new Error(responseData?.detail ?? "API request failed.");
  }

  return responseData;
}

export async function uploadFile(path, file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  let responseData = null;

  try {
    responseData = await response.json();
  } catch (error) {
    responseData = null;
  }

  if (!response.ok) {
    throw new Error(responseData?.detail ?? "File upload failed.");
  }

  return responseData;
}

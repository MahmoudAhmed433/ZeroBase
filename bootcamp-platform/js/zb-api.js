(function () {
  const API_BASE = "http://127.0.0.1:8000/api";
  let csrfToken = null;

  function getAccessToken() {
    try {
      return JSON.parse(localStorage.getItem("accessToken") || "null");
    } catch {
      return null;
    }
  }

  function getAuthUser() {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "null");
    } catch {
      return null;
    }
  }

  function parseCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  }

  async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const method = (options.method || "GET").toUpperCase();
    if (csrfToken && ["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
      headers["X-CSRFToken"] = csrfToken;
    }
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include"
    });
    const json = await response.json().catch(() => ({ ok: false, error: "Invalid server response" }));
    if (!response.ok || !json.ok) {
      throw new Error(json.error || `HTTP ${response.status}`);
    }
    return json.data;
  }

  async function ensureCsrf() {
    const data = await apiRequest("/auth/csrf/");
    csrfToken = data.csrf_token || parseCookie("csrftoken");
    return csrfToken;
  }

  function requireAuthRedirect() {
    if (!getAccessToken()) {
      location.href = "auth.html";
      return false;
    }
    return true;
  }

  window.ZB = {
    API_BASE,
    apiRequest,
    ensureCsrf,
    getAccessToken,
    getAuthUser,
    requireAuthRedirect
  };
})();

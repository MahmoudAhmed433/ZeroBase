const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

function formatApiError(error, fallbackMessage) {
  if (error?.name === 'TypeError') {
    return 'Cannot connect to backend server. Start Django on port 8000.';
  }
  return error?.message || fallbackMessage;
}

function parseApiValidationError(data, fallbackMessage) {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.username?.[0]) return `Username: ${data.username[0]}`;
  if (data.email?.[0]) return `Email: ${data.email[0]}`;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
    return `${firstKey}: ${value}`;
  }
  return fallbackMessage;
}

function toQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  return searchParams.toString() ? `?${searchParams}` : '';
}

export async function fetchPosts(params = {}) {
  try {
    const res = await fetch(`${API_BASE}/posts/${toQuery(params)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  } catch (error) {
    throw new Error(formatApiError(error, 'Failed to fetch posts'));
  }
}

export async function fetchPostById(id, token = '') {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/posts/${id}/`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch post details');
  return res.json();
}

export async function fetchCompanyById(id) {
  const res = await fetch(`${API_BASE}/companies/${id}/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Company not found');
  return res.json();
}

export async function fetchMyCourses(token) {
  const res = await fetch(`${API_BASE}/applications/my-courses/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function fetchCompanyDashboard(token) {
  const res = await fetch(`${API_BASE}/posts/company-dashboard/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function fetchCandidates(token) {
  const res = await fetch(`${API_BASE}/applications/company-candidates/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch candidates');
  return res.json();
}

export async function authSignup(payload) {
  try {
    const res = await fetch(`${API_BASE}/auth/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseApiValidationError(data, 'Sign up failed'));
    return data;
  } catch (error) {
    throw new Error(formatApiError(error, 'Sign up failed'));
  }
}

export async function authLogin(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || 'Login failed');
    return data;
  } catch (error) {
    throw new Error(formatApiError(error, 'Login failed'));
  }
}

export async function fetchMe(token) {
  const res = await fetch(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || 'Unable to fetch profile');
  return data;
}

export async function applyToPost(postId, token) {
  const res = await fetch(`${API_BASE}/applications/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ post: postId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data));
  return data;
}

export async function createPost(payload, token) {
  const res = await fetch(`${API_BASE}/posts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data));
  return data;
}

export async function updateApplicationStatus(id, status, token) {
  const res = await fetch(`${API_BASE}/applications/${id}/update-status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data));
  return data;
}

export async function createBookmark(postId, token) {
  const res = await fetch(`${API_BASE}/bookmarks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ post: postId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data));
  return data;
}

export async function removeBookmark(bookmarkId, token) {
  const res = await fetch(`${API_BASE}/bookmarks/${bookmarkId}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to remove bookmark');
}

export async function fetchBookmarks(token) {
  const res = await fetch(`${API_BASE}/bookmarks/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to load bookmarks');
  return res.json();
}

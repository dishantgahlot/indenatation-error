// Central API client connecting React frontend with Node.js Express backend
const BASE_URL = '/api';
const TOKEN_KEY = 'future_you_jwt_token';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Fetch wrapper that automatically injects JWT Bearer token if present
 */
async function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // If token expired, clear it
    clearAuthToken();
  }

  return res;
}

// ==========================================
// AUTHENTICATION & AVATAR ENDPOINTS
// ==========================================

export async function registerUser({ name, email, password, character_id = 'explorer' }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, character_id })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function fetchMe() {
  try {
    const res = await authFetch(`${BASE_URL}/auth/me`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.warn('[API] Could not verify session with backend:', err);
    return null;
  }
}

export async function updateAvatar({ character_id, name, custom_avatar_url, title }) {
  try {
    const res = await authFetch(`${BASE_URL}/auth/avatar`, {
      method: 'PUT',
      body: JSON.stringify({ character_id, name, custom_avatar_url, title })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to update avatar');
    }
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.warn('[API] Error updating avatar:', err);
    return null;
  }
}

// ==========================================
// HABITS & SIMULATION ENDPOINTS
// ==========================================

export async function fetchCurrentHabits() {
  try {
    const res = await authFetch(`${BASE_URL}/habits/current`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch current habits from backend:', err);
    return null;
  }
}

export async function saveDailyHabits(data) {
  try {
    const res = await authFetch(`${BASE_URL}/habits/log`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not save daily habits to backend:', err);
    return null;
  }
}

export async function fetchWeeklyCycle() {
  try {
    const res = await authFetch(`${BASE_URL}/habits/weekly-cycle`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch weekly cycle from backend:', err);
    return null;
  }
}

export async function fetchStreakData() {
  try {
    const res = await authFetch(`${BASE_URL}/habits/streak`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch streak data from backend:', err);
    return null;
  }
}

export async function clearHabitData(all = false) {
  try {
    const res = await authFetch(`${BASE_URL}/habits/clear`, {
      method: 'POST',
      body: JSON.stringify({ all })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not clear habits:', err);
    return null;
  }
}

export async function fetchSimulationScenarios() {
  try {
    const res = await authFetch(`${BASE_URL}/simulation/scenarios`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch simulation scenarios from backend:', err);
    return null;
  }
}

export async function fetchFutureLetter(scenarioType = 'improved', forceRefresh = false, metrics = null) {
  try {
    let res;
    if (metrics) {
      res = await authFetch(`${BASE_URL}/simulation/letter`, {
        method: 'POST',
        body: JSON.stringify({
          scenario_type: scenarioType,
          force_refresh: forceRefresh,
          metrics
        })
      });
    } else {
      res = await authFetch(`${BASE_URL}/simulation/letter?scenario_type=${scenarioType}&force_refresh=${forceRefresh}`);
    }

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch future letter from backend:', err);
    return null;
  }
}

export async function batchUploadDataset(dataset = []) {
  try {
    const res = await authFetch(`${BASE_URL}/habits/batch`, {
      method: 'POST',
      body: JSON.stringify({ dataset })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not batch upload dataset:', err);
    return null;
  }
}

export async function fetchUserProfile() {
  try {
    const res = await authFetch(`${BASE_URL}/profile`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch profile from backend:', err);
    return null;
  }
}

export async function updateUserProfile(profile) {
  try {
    const res = await authFetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not update profile to backend:', err);
    return null;
  }
}

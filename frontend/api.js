/**
 * ============================================================================
 * EcoSphere API Client
 * ============================================================================
 * A thin fetch wrapper for the EcoSphere backend - handles the base URL,
 * Bearer token, JSON/FormData bodies, and error parsing in one place, so your
 * components never touch `fetch` directly.
 *
 * SETUP
 * -----
 * 1. Drop this file in your React project, e.g. src/api.js
 * 2. Adjust API_BASE_URL below if your backend isn't on localhost:5000
 * 3. Make sure CLIENT_URL in the backend's .env matches your frontend's dev
 *    server URL (Vite default: http://localhost:5173, CRA default: :3000)
 *
 * USAGE
 * -----
 *   import api from './api';
 *
 *   // Login (stores the token automatically)
 *   const { user } = await api.auth.login('admin@ecosphere.com', 'Admin@123');
 *
 *   // Everything else just works - token is attached automatically
 *   const { data } = await api.departments.list();
 *   const goal = await api.environmentalGoals.create({ title: '...', ... });
 *   await api.csr.joinActivity(activityId);
 *
 *   // Log out
 *   api.auth.logout();
 * ============================================================================
 */

export const API_BASE_URL = 'http://localhost:5000';

const TOKEN_KEY = 'ecosphere_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Core request function. Every helper below is a thin wrapper around this.
 *
 * @param {string} path - e.g. '/api/departments' (leading slash required)
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {object} [options.body] - plain object, auto-JSON-encoded (unless isFormData)
 * @param {object} [options.params] - query string params, e.g. { page: 1, department: id }
 * @param {FormData} [options.formData] - pass instead of `body` for file uploads
 */
async function request(path, { method = 'GET', body, params, formData } = {}) {
  const url = new URL(API_BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let requestBody;
  if (formData) {
    requestBody = formData; // browser sets multipart/form-data + boundary automatically
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), { method, headers, body: requestBody });

  // File exports (CSV/Excel/PDF) return raw binary, not JSON - see downloadFile() below.
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message = (isJson && data && data.message) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * For endpoints that return a downloadable file (CSV/Excel/PDF exports).
 * Triggers a normal browser download using the same auth header.
 */
async function downloadFile(path, params, fallbackFilename) {
  const url = new URL(API_BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const token = getToken();
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data && data.message) || `Download failed (${res.status})`);
  }

  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/** Builds { file } as multipart FormData for the proof-upload endpoints. */
function fileFormData(file) {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

/**
 * Generic CRUD helper matching routes/masterData.routes.ts's factory - one
 * function covers all 8 master-data entities that share the same shape.
 */
function makeCrud(resourcePath) {
  return {
    list: (params) => request(`/api/${resourcePath}`, { params }),
    get: (id) => request(`/api/${resourcePath}/${id}`),
    create: (body) => request(`/api/${resourcePath}`, { method: 'POST', body }),
    update: (id, body) => request(`/api/${resourcePath}/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/api/${resourcePath}/${id}`, { method: 'DELETE' }), // soft-delete
  };
}

const api = {
  // ---------------------------------------------------------------- Auth --
  auth: {
    async login(email, password) {
      const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
      setToken(result.token);
      return result;
    },
    me: () => request('/api/auth/me'),
    logout: () => clearToken(),
    isLoggedIn: () => Boolean(getToken()),
  },

  // ----------------------------------------------------------- Employees --
  employees: {
    list: (params) => request('/api/employees', { params }), // admin only
    create: (body) => request('/api/employees', { method: 'POST', body }), // admin only
    me: () => request('/api/employees/me'),
    get: (id) => request(`/api/employees/${id}`),
  },

  // ------------------------------------------------------- Master Data --
  // Reads open to any logged-in user; create/update/remove are Admin-only.
  departments: makeCrud('departments'),
  categories: makeCrud('categories'),
  emissionFactors: makeCrud('emission-factors'),
  environmentalGoals: makeCrud('environmental-goals'),
  policies: makeCrud('policies'),
  badges: makeCrud('badges'),
  rewardsCatalog: makeCrud('rewards'), // catalog CRUD; see `rewards.redeem` below for redemption
  productEsgProfiles: makeCrud('product-esg-profiles'),

  // ------------------------------------------------------ Carbon Transactions --
  carbonTransactions: {
    list: (params) => request('/api/carbon-transactions', { params }), // { department, status, dateFrom, dateTo, page, limit, includeChain }
    get: (id) => request(`/api/carbon-transactions/${id}`),
    create: (body) => request('/api/carbon-transactions', { method: 'POST', body }), // { department, emissionFactor, source, quantity }
    review: (id, decision) => request(`/api/carbon-transactions/${id}/review`, { method: 'PUT', body: { decision } }), // 'Confirmed' | 'Rejected'
    erpWebhook: (body) => request('/api/carbon-transactions/erp-webhook', { method: 'POST', body }), // admin only, needs Settings toggle enabled
  },

  // -------------------------------------------------------------- CSR --
  csr: {
    listActivities: (params) => request('/api/csr/activities', { params }),
    createActivity: (body) => request('/api/csr/activities', { method: 'POST', body }), // admin only
    updateActivity: (id, body) => request(`/api/csr/activities/${id}`, { method: 'PUT', body }), // admin only
    deleteActivity: (id) => request(`/api/csr/activities/${id}`, { method: 'DELETE' }), // admin only

    joinActivity: (activityId) => request(`/api/csr/activities/${activityId}/join`, { method: 'POST' }),
    uploadProof: (participationId, file) =>
      request(`/api/csr/participations/${participationId}/proof`, { method: 'POST', formData: fileFormData(file) }),

    listParticipations: (params) => request('/api/csr/participations', { params }), // admin: all (+ filters); user: own only
    reviewParticipation: (participationId, decision, pointsEarned) =>
      request(`/api/csr/participations/${participationId}/review`, {
        method: 'PUT',
        body: { decision, pointsEarned }, // decision: 'Approved' | 'Rejected'
      }), // admin only
  },

  // --------------------------------------------------------- Challenges --
  challenges: {
    list: (params) => request('/api/challenges', { params }), // { status, page, limit }
    create: (body) => request('/api/challenges', { method: 'POST', body }), // admin only
    update: (id, body) => request(`/api/challenges/${id}`, { method: 'PUT', body }), // admin only
    updateStatus: (id, status) => request(`/api/challenges/${id}/status`, { method: 'PUT', body: { status } }), // admin only, lifecycle-enforced
    remove: (id) => request(`/api/challenges/${id}`, { method: 'DELETE' }), // admin only

    join: (challengeId) => request(`/api/challenges/${challengeId}/join`, { method: 'POST' }),
    updateProgress: (participationId, progress) =>
      request(`/api/challenges/participations/${participationId}/progress`, { method: 'PUT', body: { progress } }),
    uploadProof: (participationId, file) =>
      request(`/api/challenges/participations/${participationId}/proof`, { method: 'POST', formData: fileFormData(file) }),

    listParticipations: (params) => request('/api/challenges/participations', { params }), // { employee, challenge, page, limit }
    reviewParticipation: (participationId, decision) =>
      request(`/api/challenges/participations/${participationId}/review`, { method: 'PUT', body: { decision } }), // admin only
  },

  // --------------------------------------------------------- Governance --
  governance: {
    listAudits: (params) => request('/api/governance/audits', { params }), // admin only
    createAudit: (body) => request('/api/governance/audits', { method: 'POST', body }), // admin only
    updateAudit: (id, body) => request(`/api/governance/audits/${id}`, { method: 'PUT', body }), // admin only

    listComplianceIssues: (params) => request('/api/governance/compliance-issues', { params }), // admin: all; user: owned only
    createComplianceIssue: (body) => request('/api/governance/compliance-issues', { method: 'POST', body }), // admin only, { department, severity, description, owner, dueDate }
    updateComplianceIssue: (id, body) => request(`/api/governance/compliance-issues/${id}`, { method: 'PUT', body }), // admin only

    acknowledgePolicy: (policyId) => request(`/api/governance/policies/${policyId}/acknowledge`, { method: 'POST' }),
    listAcknowledgements: (policyId) => request(`/api/governance/policies/${policyId}/acknowledgements`), // admin only
  },

  // ------------------------------------------------------------ Rewards --
  rewards: {
    redeem: (rewardId) => request(`/api/rewards/${rewardId}/redeem`, { method: 'POST' }),
  },

  // --------------------------------------------------------- Leaderboard --
  leaderboard: {
    get: () => request('/api/leaderboard'),
  },

  // ------------------------------------------------------------ Reports --
  reports: {
    esgScore: () => request('/api/reports/esg-score'), // admin only
    scoreHistory: (params) => request('/api/reports/score-history', { params }), // { department }, admin only
    custom: (params) => request('/api/reports/custom', { params }), // { department, module, dateFrom, dateTo, employee, challenge, esgCategory }
    goalTrajectory: (goalId) => request(`/api/reports/goals/${goalId}/trajectory`),

    // These trigger a real file download in the browser rather than returning JSON
    exportCsv: (params) => downloadFile('/api/reports/export/csv', params, 'ecosphere-report.csv'),
    exportExcel: (params) => downloadFile('/api/reports/export/excel', params, 'ecosphere-report.xlsx'),
    exportPdf: (params) => downloadFile('/api/reports/export/pdf', params, 'ecosphere-report.pdf'),
  },

  // ------------------------------------------------------- Notifications --
  notifications: {
    /**
     * Opens a live SSE connection. Returns the EventSource so you can close
     * it (e.g. in a useEffect cleanup function).
     *
     *   useEffect(() => {
     *     const es = api.notifications.connect((event) => console.log(event));
     *     return () => es.close();
     *   }, []);
     */
    connect(onMessage, onError) {
      const token = getToken();
      const es = new EventSource(`${API_BASE_URL}/api/notifications/stream?token=${token}`);
      es.onmessage = (e) => onMessage(JSON.parse(e.data));
      if (onError) es.onerror = onError;
      return es;
    },
  },

  // ----------------------------------------------------------- Settings --
  settings: {
    get: () => request('/api/settings'), // any logged-in user can read
    update: (body) => request('/api/settings', { method: 'PUT', body }), // admin only
  },

  // ---------------------------------------------------------- Diversity --
  diversity: {
    list: (params) => request('/api/diversity', { params }), // { department, period }
    upsert: (body) => request('/api/diversity', { method: 'POST', body }), // admin only
    remove: (id) => request(`/api/diversity/${id}`, { method: 'DELETE' }), // admin only
  },

  // ----------------------------------------------------------- Training --
  training: {
    listPrograms: (params) => request('/api/training/programs', { params }),
    createProgram: (body) => request('/api/training/programs', { method: 'POST', body }), // admin only, auto-assigns to matching employees
    updateProgram: (id, body) => request(`/api/training/programs/${id}`, { method: 'PUT', body }), // admin only

    listCompletions: (params) => request('/api/training/completions', { params }), // admin: all (+ filters); user: own only
    complete: (completionId) => request(`/api/training/completions/${completionId}/complete`, { method: 'PUT' }),
  },
};

export default api;
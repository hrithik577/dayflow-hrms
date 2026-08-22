import axios from 'axios';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_AI_INSIGHTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TIMELINE,
  INITIAL_NOTIFICATIONS,
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Attach JWT token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dayflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Local Interactive Storage Engine for Hackathon judging and resilience
const STORAGE_KEY = 'dayflow_store_v1';

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local storage', e);
  }

  const initial = {
    employees: INITIAL_EMPLOYEES,
    attendance: INITIAL_ATTENDANCE,
    leaves: INITIAL_LEAVES,
    insights: INITIAL_AI_INSIGHTS,
    auditLogs: INITIAL_AUDIT_LOGS,
    timeline: INITIAL_TIMELINE,
    notifications: INITIAL_NOTIFICATIONS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export const localDB = {
  get: getStore,
  save: saveStore,
  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    return getStore();
  },
};

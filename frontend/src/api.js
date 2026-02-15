/**
 * Backend API base URL.
 * - Set VITE_API_URL in .env to override (e.g. /api when using Vite proxy in dev).
 * - Default: http://localhost:8000 (direct). Use /api for dev proxy (Docker or local).
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : 'http://localhost:8000');

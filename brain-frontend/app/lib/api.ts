// Empty by default: the frontend is served by the Express backend,
// so API calls go to the same origin (/api/...).
// For `next dev` against a separately running backend, set
// NEXT_PUBLIC_API_URL=http://localhost:3000 in brain-frontend/.env.local
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

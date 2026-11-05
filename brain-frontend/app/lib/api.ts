// Empty by default: the frontend is served by the Express backend,
// so API calls go to the same origin (/api/...).
// For `next dev` against a separately running backend, set
// NEXT_PUBLIC_API_URL=http://localhost:3000 in brain-frontend/.env.local
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/** Thrown by authFetch when there is no token or the server rejects it (401). */
export class UnauthorizedError extends Error {
  constructor() {
    super("Not logged in");
    this.name = "UnauthorizedError";
  }
}

/** Forget the logged-in user (logout, or the token expired). */
export function clearSession() {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("user");
}

/**
 * fetch() for authenticated API calls: adds the Bearer token, and on a missing
 * token or a 401 clears the session and throws UnauthorizedError so callers can
 * send the user to the login page. Other error statuses are returned as-is.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("jwtToken");
  if (!token) throw new UnauthorizedError();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearSession();
    throw new UnauthorizedError();
  }
  return res;
}

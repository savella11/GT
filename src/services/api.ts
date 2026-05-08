export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const projectService = {
  getAll: () => apiFetch<any[]>("/api/projects"),
  getById: (id: string) => apiFetch<any>(`/api/projects/${id}`),
  create: (data: any) => apiFetch("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiFetch(`/api/projects/${id}`, {
    method: "DELETE",
  }),
  
  // Rutas de Comentarios actualizadas
  getComments: (projectId: string) => apiFetch<any[]>(`/api/comments/project/${projectId}`),
  adminGetComments: () => apiFetch<any[]>("/api/comments/all"),
  deleteComment: (id: number) => apiFetch(`/api/comments/${id}`, {
    method: "DELETE",
  }),
  addComment: (projectId: string, data: any) => apiFetch(`/api/comments/project/${projectId}`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export const authService = {
  login: (credentials: any) => apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  register: (userData: any) => apiFetch("/api/register", {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  logout: () => apiFetch("/api/logout", { method: "POST" }),
  getMe: () => apiFetch<any>("/api/me"),
  getUsers: () => apiFetch<any[]>("/api/users"),
  forgotPassword: (email: string) => apiFetch("/api/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),
  resetPassword: (data: any) => apiFetch("/api/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};
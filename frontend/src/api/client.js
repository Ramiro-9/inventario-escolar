const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

function getToken() { return localStorage.getItem("token") }

async function fetchConErrorDeRed(url, options) {
  try { return await fetch(url, options) }
  catch { throw new Error("No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.") }
}

function mensajeError(detail, fallback) {
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail.map(item => `${(item.loc || []).filter(x => x !== "body").join(".")}: ${item.msg}`).join("; ")
  }
  return fallback
}

async function request(method, path, body, auth = true) {
  const headers = { "Content-Type": "application/json" }
  if (auth) {
    const token = getToken()
    if (token) headers["Authorization"] = `Bearer ${token}`
  }
  const res = await fetchConErrorDeRed(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    window.location.href = "/login"
    throw new Error("La sesión venció o no es válida. Iniciá sesión nuevamente.")
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(mensajeError(err.detail, `Error ${res.status}`))
  }
  if (res.status === 204) return null
  return res.json()
}

// Auth
export async function login(username, password) {
  const body = new URLSearchParams({ username, password })
  const res  = await fetchConErrorDeRed(`${BASE}/auth/login`, { method: "POST", body })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(mensajeError(err.detail, "Credenciales incorrectas"))
  }
  const data = await res.json()
  localStorage.setItem("token",   data.access_token)
  localStorage.setItem("usuario", JSON.stringify({ username: data.username, rol: data.rol }))
  return data
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("usuario")
  window.location.href = "/login"
}

export function getUsuario() {
  const u = localStorage.getItem("usuario")
  return u ? JSON.parse(u) : null
}

export function isAdmin() {
  return getUsuario()?.rol === "admin"
}

// Ubicaciones
export const getUbicaciones  = ()         => request("GET",    "/ubicaciones/")
export const getUbicacion    = (id)       => request("GET",    `/ubicaciones/${id}`)
export const createUbicacion = (data)     => request("POST",   "/ubicaciones/", data)
export const updateUbicacion = (id, data) => request("PATCH",  `/ubicaciones/${id}`, data)
export const deleteUbicacion = (id)       => request("DELETE", `/ubicaciones/${id}`)

// Stock
export const getStock    = ()     => request("GET",   "/stock/")
export const updateStock = (data) => request("PATCH", "/stock/", data)

// Cursos: todas las modificaciones envían el token del administrador.
export const getCursos    = ()         => request("GET", "/cursos/")
export const createCurso  = (data)     => request("POST", "/cursos/", data)
export const updateCurso  = (id, data) => request("PATCH", `/cursos/${id}`, data)
export const deleteCurso  = (id)       => request("DELETE", `/cursos/${id}`)

// Resumen
export const getResumen  = () => request("GET", "/resumen")

// Exportar
export const exportarExcel = () => window.open(`${BASE}/exportar/excel?token=${getToken()}`, "_blank")
export const exportarPDF   = () => window.open(`${BASE}/exportar/pdf?token=${getToken()}`,   "_blank")

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

function getToken() { return localStorage.getItem("token") }

async function request(method, path, body, auth = true) {
  const headers = { "Content-Type": "application/json" }
  if (auth) {
    const token = getToken()
    if (token) headers["Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    window.location.href = "/login"
    return
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// Auth
export async function login(username, password) {
  const body = new URLSearchParams({ username, password })
  const res  = await fetch(`${BASE}/auth/login`, { method: "POST", body })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Credenciales incorrectas")
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

// Resumen
export const getResumen  = () => request("GET", "/resumen")

// Exportar
export const exportarExcel = () => window.open(`${BASE}/exportar/excel?token=${getToken()}`, "_blank")
export const exportarPDF   = () => window.open(`${BASE}/exportar/pdf?token=${getToken()}`,   "_blank")
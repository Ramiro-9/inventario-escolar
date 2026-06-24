import { Navigate } from "react-router-dom"

export default function RutaProtegida({ children, soloAdmin = false, usuario }) {
  if (!usuario) return <Navigate to="/login" replace />
  if (soloAdmin && usuario.rol !== "admin") return <Navigate to="/" replace />
  return children
}
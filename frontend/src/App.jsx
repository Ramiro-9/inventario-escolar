import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { getUsuario, isAdmin, logout } from "./api/client"
import RutaProtegida from "./components/RutaProtegida"
import Login       from "./pages/Login"
import Ubicaciones from "./pages/Ubicaciones"
import Cursos      from "./pages/Cursos"
import Stock       from "./pages/Stock"
import Resumen     from "./pages/Resumen"
import Docs        from "./pages/Docs"
import "./App.css"

export default function App() {
  const [dark,    setDark]    = useState(() => localStorage.getItem("theme") === "dark")
  const [usuario, setUsuario] = useState(getUsuario())

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [dark])

  function handleLogin()  { setUsuario(getUsuario()) }
  function handleLogout() { logout(); setUsuario(null) }

  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="nav-brand">
          <span>📦</span> Inventario Escolar
        </div>
        <div className="nav-links">
          <NavLink to="/" end>Resumen</NavLink>
          {usuario?.rol === "admin" && <NavLink to="/ubicaciones">Ubicaciones</NavLink>}
          {usuario?.rol === "admin" && <NavLink to="/cursos">Cursos</NavLink>}
          {usuario?.rol === "admin" && <NavLink to="/stock">Stock</NavLink>}
          {usuario?.rol === "admin" && <NavLink to="/docs">📖 Docs</NavLink>}

          {usuario ? (
            <>
              <span style={{
                fontSize:"0.78rem", color:"var(--text2)",
                padding:"0 0.5rem", borderLeft:"1px solid var(--border)", marginLeft:"0.5rem"
              }}>
                {usuario.username}
                <span className={`badge ${usuario.rol === "admin" ? "badge-blue" : "badge-gray"}`}
                  style={{marginLeft:6}}>
                  {usuario.rol}
                </span>
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Salir</button>
            </>
          ) : (
            <NavLink to="/login">Iniciar sesión</NavLink>
          )}

          <button className="theme-btn" onClick={() => setDark(d => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/login"       element={<Login onLogin={handleLogin} />} />
          <Route path="/"            element={<Resumen />} />
          <Route path="/ubicaciones" element={<RutaProtegida soloAdmin usuario={usuario}><Ubicaciones /></RutaProtegida>} />
          <Route path="/cursos"      element={<RutaProtegida soloAdmin usuario={usuario}><Cursos /></RutaProtegida>} />
          <Route path="/stock"       element={<RutaProtegida soloAdmin usuario={usuario}><Stock /></RutaProtegida>} />
          <Route path="/docs"        element={<RutaProtegida soloAdmin usuario={usuario}><Docs /></RutaProtegida>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
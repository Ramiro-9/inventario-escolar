import { useState } from "react"
import { login } from "../api/client"
import { useNavigate } from "react-router-dom"

export default function Login({ onLogin }) {
  const [form,    setForm]    = useState({ username: "", password: "" })
  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    setError("")
    if (!form.username || !form.password) return setError("Completá usuario y contraseña")
    setLoading(true)
    try {
      await login(form.username, form.password)
      onLogin()
      navigate("/")
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function onKey(e) { if (e.key === "Enter") handleLogin() }

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"var(--bg)"
    }}>
      <div style={{width:"100%", maxWidth:380, padding:"0 1rem"}}>

        {/* Logo / título */}
        <div style={{textAlign:"center", marginBottom:"2rem"}}>
          <div style={{fontSize:"2.5rem", marginBottom:"0.5rem"}}>📦</div>
          <h1 style={{fontSize:"1.4rem", fontWeight:700, color:"var(--accent)"}}>
            Inventario Escolar
          </h1>
          <p style={{color:"var(--text2)", fontSize:"0.85rem", marginTop:"0.25rem"}}>
            EPET N°1 — Caucete
          </p>
        </div>

        <div className="card">
          <div className="card-header">Iniciar sesión</div>
          <div className="card-body">
            {error && <div className="alert alert-error" style={{marginBottom:"1rem"}}>⚠️ {error}</div>}

            <div className="form-group" style={{marginBottom:"1rem"}}>
              <label>Usuario</label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({...f, username: e.target.value}))}
                onKeyDown={onKey}
                placeholder="usuario"
                autoFocus
              />
            </div>

            <div className="form-group" style={{marginBottom:"1.5rem"}}>
              <label>Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                onKeyDown={onKey}
                placeholder="••••••••"
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleLogin}
              disabled={loading}
              style={{width:"100%", justifyContent:"center", padding:"0.65rem"}}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
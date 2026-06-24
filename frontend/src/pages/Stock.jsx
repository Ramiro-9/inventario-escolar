import { useEffect, useState } from "react"
import { getStock, updateStock } from "../api/client"

export default function Stock() {
  const [form,    setForm]    = useState({ bancos_total: 0, sillas_total: 0 })
  const [error,   setError]   = useState("")
  const [ok,      setOk]      = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getStock()
      .then(s => setForm({ bancos_total: s.bancos_total, sillas_total: s.sillas_total }))
      .catch(e => setError(e.message))
  }, [])

  async function guardar() {
    setError(""); setOk(false); setLoading(true)
    try { await updateStock(form); setOk(true) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <div className="page-header">
        <h1>📦 <span>Stock Global</span></h1>
      </div>

      <p style={{marginBottom:"1.5rem",color:"var(--text2)",fontSize:"0.9rem"}}>
        Registrá el total de muebles disponibles en toda la escuela.
      </p>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {ok    && <div className="alert alert-success">✓ Stock actualizado correctamente</div>}

      <div className="card" style={{maxWidth:480}}>
        <div className="card-header">🪑 Cantidad total de muebles</div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Total de bancos</label>
              <input type="number" min="0" value={form.bancos_total}
                onChange={e => set("bancos_total", +e.target.value)} />
            </div>
            <div className="form-group">
              <label>Total de sillas</label>
              <input type="number" min="0" value={form.sillas_total}
                onChange={e => set("sillas_total", +e.target.value)} />
            </div>
          </div>
          <div className="divider"/>
          <button className="btn btn-primary" onClick={guardar} disabled={loading}>
            {loading ? "Guardando…" : "💾 Guardar"}
          </button>
        </div>
      </div>
    </>
  )
}
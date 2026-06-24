import { useEffect, useState } from "react"
import { getUbicaciones } from "../api/client"
import ModalConfirm from "../components/ModalConfirm"

const BASE = "http://localhost:8000"
const empty = { nombre: "", turno: "", ubicacion_id: "", bancos_requeridos: 0, sillas_requeridas: 0 }

const TURNO_BADGE = {
  "mañana": { cls: "badge-blue",   label: "Mañana" },
  "tarde":  { cls: "badge-yellow", label: "Tarde"  },
  "noche":  { cls: "badge-gray",   label: "Noche"  },
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`) }
  if (res.status === 204) return null
  return res.json()
}

export default function Cursos() {
  const [cursos,      setCursos]      = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [form,        setForm]        = useState(empty)
  const [editId,      setEditId]      = useState(null)
  const [error,       setError]       = useState("")
  const [ok,          setOk]          = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [busqueda,    setBusqueda]    = useState("")
  const [filtroUbi,   setFiltroUbi]   = useState("")
  const [orden,       setOrden]       = useState({ col: "nombre", asc: true })
  const [confirm,     setConfirm]     = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      const [c, u] = await Promise.all([api("GET", "/cursos/"), getUbicaciones()])
      setCursos(c); setUbicaciones(u)
    } catch (e) { setError(e.message) }
  }

  function editar(c) {
    setEditId(c.id)
    setForm({ nombre: c.nombre, turno: c.turno ?? "", ubicacion_id: c.ubicacion_id,
              bancos_requeridos: c.bancos_requeridos, sillas_requeridas: c.sillas_requeridas })
    setError(""); setOk(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelar() { setEditId(null); setForm(empty); setError("") }

  async function guardar() {
    setError(""); setOk(false)
    if (!form.nombre.trim()) return setError("El nombre es obligatorio")
    if (!form.ubicacion_id)  return setError("Seleccioná una ubicación")
    setLoading(true)
    try {
      const body = { ...form, turno: form.turno || null,
        ubicacion_id: Number(form.ubicacion_id),
        bancos_requeridos: Number(form.bancos_requeridos),
        sillas_requeridas: Number(form.sillas_requeridas) }
      editId ? await api("PATCH", `/cursos/${editId}`, body) : await api("POST", "/cursos/", body)
      setOk(true); cancelar(); cargar()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function eliminar() {
    try { await api("DELETE", `/cursos/${confirm.id}`); cargar() }
    catch (e) { setError(e.message) }
    finally { setConfirm(null) }
  }

  function toggleOrden(col) {
    setOrden(o => ({ col, asc: o.col === col ? !o.asc : true }))
  }

  const porUbi = {}
  cursos.forEach(c => {
    if (!porUbi[c.ubicacion_id]) porUbi[c.ubicacion_id] = []
    porUbi[c.ubicacion_id].push(c)
  })

  const filtrados = cursos
    .filter(c =>
      (!filtroUbi || String(c.ubicacion_id) === filtroUbi) &&
      (c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
       c.ubicacion?.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    )
    .sort((a, b) => {
      const va = orden.col === "ubicacion"
        ? (a.ubicacion?.nombre ?? "").toLowerCase()
        : (a[orden.col] ?? "").toString().toLowerCase()
      const vb = orden.col === "ubicacion"
        ? (b.ubicacion?.nombre ?? "").toLowerCase()
        : (b[orden.col] ?? "").toString().toLowerCase()
      return orden.asc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const arrow = col => orden.col === col ? (orden.asc ? " ↑" : " ↓") : ""

  return (
    <>
      {confirm && (
        <ModalConfirm
          mensaje={`¿Eliminar el curso "${confirm.nombre}"?`}
          onConfirm={eliminar}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="page-header">
        <h1>🎓 <span>Cursos</span></h1>
        <span style={{fontSize:"0.82rem",color:"var(--text2)"}}>
          {cursos.length} curso{cursos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {ok    && <div className="alert alert-success">✓ Guardado correctamente</div>}
      {ubicaciones.length === 0 && (
        <div className="alert alert-error">⚠️ Primero cargá ubicaciones.</div>
      )}

      <div className="card" style={{marginBottom:"1.5rem"}}>
        <div className="card-header">{editId ? "✏️ Editar curso" : "➕ Nuevo curso"}</div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="ej: 1°4°" />
            </div>
            <div className="form-group">
              <label>Turno</label>
              <select value={form.turno} onChange={e => set("turno", e.target.value)}>
                <option value="">— Sin turno —</option>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ubicación *</label>
              <select value={form.ubicacion_id} onChange={e => set("ubicacion_id", e.target.value)}>
                <option value="">— Seleccioná —</option>
                {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Bancos requeridos</label>
              <input type="number" min="0" value={form.bancos_requeridos} onChange={e => set("bancos_requeridos", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Sillas requeridas</label>
              <input type="number" min="0" value={form.sillas_requeridas} onChange={e => set("sillas_requeridas", e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={guardar} disabled={loading || !ubicaciones.length}>
              {loading ? "Guardando…" : editId ? "✓ Actualizar" : "➕ Agregar"}
            </button>
            {editId && <button className="btn btn-secondary" onClick={cancelar}>Cancelar</button>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
          <span>🎓 Listado</span>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar…"
              style={{fontSize:"0.82rem",padding:"0.3rem 0.6rem",borderRadius:6,
                border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",width:160}}
            />
            <select
              value={filtroUbi}
              onChange={e => setFiltroUbi(e.target.value)}
              style={{fontSize:"0.8rem",padding:"0.3rem 0.5rem",borderRadius:6,
                border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)"}}
            >
              <option value="">Todas las aulas</option>
              {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{cursor:"pointer"}} onClick={() => toggleOrden("nombre")}>Curso{arrow("nombre")}</th>
                <th>Turno</th>
                <th style={{cursor:"pointer"}} onClick={() => toggleOrden("ubicacion")}>Ubicación{arrow("ubicacion")}</th>
                <th style={{cursor:"pointer"}} onClick={() => toggleOrden("bancos_requeridos")}>Bancos{arrow("bancos_requeridos")}</th>
                <th style={{cursor:"pointer"}} onClick={() => toggleOrden("sillas_requeridas")}>Sillas{arrow("sillas_requeridas")}</th>
                <th>MAX aula</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0
                ? <tr className="empty-row"><td colSpan={7}>{busqueda || filtroUbi ? "Sin resultados" : "Sin cursos."}</td></tr>
                : filtrados.map(c => {
                    const comp = porUbi[c.ubicacion_id] || []
                    const maxB = Math.max(...comp.map(x => x.bancos_requeridos))
                    const maxS = Math.max(...comp.map(x => x.sillas_requeridas))
                    const esMax = c.bancos_requeridos === maxB || c.sillas_requeridas === maxS
                    const t = TURNO_BADGE[c.turno]
                    return (
                      <tr key={c.id}>
                        <td><strong>{c.nombre}</strong></td>
                        <td>{t ? <span className={`badge ${t.cls}`}>{t.label}</span> : <span style={{color:"var(--text2)"}}>—</span>}</td>
                        <td>{c.ubicacion?.nombre}</td>
                        <td>{c.bancos_requeridos}</td>
                        <td>{c.sillas_requeridas}</td>
                        <td style={{fontSize:"0.8rem",color: esMax ? "var(--accent)" : "var(--text2)"}}>
                          {esMax ? `🏆 ${maxB}b / ${maxS}s` : `${maxB}b / ${maxS}s`}
                        </td>
                        <td style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end"}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => editar(c)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirm({id:c.id, nombre:c.nombre})}>🗑️</button>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
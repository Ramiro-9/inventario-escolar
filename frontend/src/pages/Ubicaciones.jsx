import { useEffect, useState } from "react"
import { getUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion } from "../api/client"
import ModalConfirm from "../components/ModalConfirm"

const empty = { nombre: "", descripcion: "" }

export default function Ubicaciones() {
  const [lista,    setLista]    = useState([])
  const [form,     setForm]     = useState(empty)
  const [editId,   setEditId]   = useState(null)
  const [error,    setError]    = useState("")
  const [ok,       setOk]       = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [orden,    setOrden]    = useState({ col: "nombre", asc: true })
  const [confirm,  setConfirm]  = useState(null) // { id, nombre }

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try { setLista(await getUbicaciones()) }
    catch (e) { setError(e.message) }
  }

  function editar(u) {
    setEditId(u.id)
    setForm({ nombre: u.nombre, descripcion: u.descripcion ?? "" })
    setError(""); setOk(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelar() { setEditId(null); setForm(empty); setError("") }

  async function guardar() {
    setError(""); setOk(false)
    if (!form.nombre.trim()) return setError("El nombre es obligatorio")
    setLoading(true)
    try {
      editId ? await updateUbicacion(editId, form) : await createUbicacion(form)
      setOk(true); cancelar(); cargar()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function eliminar() {
    try { await deleteUbicacion(confirm.id); cargar() }
    catch (e) { setError(e.message) }
    finally { setConfirm(null) }
  }

  function toggleOrden(col) {
    setOrden(o => ({ col, asc: o.col === col ? !o.asc : true }))
  }

  const filtrada = lista
    .filter(u => u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                 (u.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      const va = (a[orden.col] ?? "").toString().toLowerCase()
      const vb = (b[orden.col] ?? "").toString().toLowerCase()
      return orden.asc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const arrow = col => orden.col === col ? (orden.asc ? " ↑" : " ↓") : ""

  return (
    <>
      {confirm && (
        <ModalConfirm
          mensaje={`¿Eliminar "${confirm.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={eliminar}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="page-header">
        <h1>📍 <span>Ubicaciones</span></h1>
        <span style={{fontSize:"0.82rem",color:"var(--text2)"}}>
          {lista.length} registrada{lista.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {ok    && <div className="alert alert-success">✓ Guardado correctamente</div>}

      <div className="card" style={{marginBottom:"1.5rem"}}>
        <div className="card-header">{editId ? "✏️ Editar ubicación" : "➕ Nueva ubicación"}</div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group" style={{gridColumn:"span 2"}}>
              <label>Nombre *</label>
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="ej: Aula 1, Biblioteca…" />
            </div>
            <div className="form-group" style={{gridColumn:"span 2"}}>
              <label>Descripción</label>
              <input value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="opcional" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={guardar} disabled={loading}>
              {loading ? "Guardando…" : editId ? "✓ Actualizar" : "➕ Agregar"}
            </button>
            {editId && <button className="btn btn-secondary" onClick={cancelar}>Cancelar</button>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{justifyContent:"space-between"}}>
          <span>🏫 Listado</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar…"
            style={{fontSize:"0.82rem",padding:"0.3rem 0.6rem",borderRadius:6,
              border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",width:180}}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{width:40}}>#</th>
                <th style={{cursor:"pointer"}} onClick={() => toggleOrden("nombre")}>Nombre{arrow("nombre")}</th>
                <th style={{cursor:"pointer"}} onClick={() => toggleOrden("descripcion")}>Descripción{arrow("descripcion")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrada.length === 0
                ? <tr className="empty-row"><td colSpan={4}>{busqueda ? "Sin resultados" : "Sin ubicaciones. Agregá la primera arriba."}</td></tr>
                : filtrada.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{color:"var(--text2)"}}>{i + 1}</td>
                    <td><strong>{u.nombre}</strong></td>
                    <td style={{color:"var(--text2)"}}>{u.descripcion || "—"}</td>
                    <td style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end"}}>
                      <button className="btn btn-secondary btn-sm" onClick={() => editar(u)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm({id:u.id, nombre:u.nombre})}>🗑️</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
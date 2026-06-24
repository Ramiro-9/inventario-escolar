import { useEffect, useState } from "react"
import { getResumen, exportarExcel, exportarPDF } from "../api/client"

const BASE = "http://localhost:8000"

async function api(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

function StatCard({ label, value, color, sub }) {
  return (
    <div className="stat-card" style={{"--accent": color}}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{color}}>{value}</div>
      {sub && <div style={{fontSize:"0.72rem",color:"var(--text2)",marginTop:"0.3rem"}}>{sub}</div>}
    </div>
  )
}

function BarChart({ data }) {
  if (!data.length) return null
  const maxVal = Math.max(...data.map(d => Math.max(d.bancos_requeridos, d.sillas_requeridas, 1)))

  return (
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth: data.length * 80, padding:"1rem 0.5rem 0"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height:160}}>
          {data.map(d => {
            const hB = Math.max((d.bancos_requeridos / maxVal) * 140, 2)
            const hS = Math.max((d.sillas_requeridas / maxVal) * 140, 2)
            return (
              <div key={d.ubicacion_id} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,minWidth:60}}>
                <div style={{display:"flex",alignItems:"flex-end",gap:3,height:140}}>
                  <div title={`Bancos: ${d.bancos_requeridos}`} style={{
                    width:18, height:hB, background:"var(--accent)", borderRadius:"3px 3px 0 0",
                    transition:"height 0.4s", cursor:"default"
                  }}/>
                  <div title={`Sillas: ${d.sillas_requeridas}`} style={{
                    width:18, height:hS, background:"#f59e0b", borderRadius:"3px 3px 0 0",
                    transition:"height 0.4s", cursor:"default"
                  }}/>
                </div>
                <div style={{
                  fontSize:"0.65rem", color:"var(--text2)", marginTop:4,
                  textAlign:"center", maxWidth:60, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap"
                }} title={d.ubicacion}>
                  {d.ubicacion}
                </div>
              </div>
            )
          })}
        </div>
        {/* Leyenda */}
        <div style={{display:"flex",gap:"1rem",marginTop:"0.75rem",fontSize:"0.75rem",color:"var(--text2)"}}>
          <span><span style={{display:"inline-block",width:10,height:10,background:"var(--accent)",borderRadius:2,marginRight:4}}/>Bancos</span>
          <span><span style={{display:"inline-block",width:10,height:10,background:"#f59e0b",borderRadius:2,marginRight:4}}/>Sillas</span>
        </div>
      </div>
    </div>
  )
}

export default function Resumen() {
  const [resumen,    setResumen]    = useState(null)
  const [porUbi,     setPorUbi]     = useState([])
  const [cursosDet,  setCursosDet]  = useState([])
  const [selected,   setSelected]   = useState(null)
  const [error,      setError]      = useState("")

  useEffect(() => {
    Promise.all([
      getResumen(),
      api("/requerimientos_por_ubicacion"),
      api("/cursos/"),
    ])
    .then(([r, u, c]) => { setResumen(r); setPorUbi(u); setCursosDet(c) })
    .catch(e => setError(e.message))
  }, [])

  if (error)    return <div className="alert alert-error">⚠️ {error}</div>
  if (!resumen) return <p style={{color:"var(--text2)"}}>Cargando…</p>

  const bSob = resumen.bancos_sobrantes
  const sSob = resumen.sillas_sobrantes
  const selUbi    = porUbi.find(u => u.ubicacion_id === selected)
  const selCursos = cursosDet.filter(c => c.ubicacion_id === selected)

  // Solo aulas con cursos para el gráfico
  const conCursos = porUbi.filter(u => u.cantidad_cursos > 0)

  return (
    <>
      <div className="page-header">
        <h1>📊 <span>Resumen</span></h1>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <button className="btn btn-secondary btn-sm" onClick={exportarExcel}>📥 Excel</button>
          <button className="btn btn-secondary btn-sm" onClick={exportarPDF}>📄 PDF</button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="stats-grid">
        <StatCard label="Bancos disponibles" value={resumen.bancos_total}      color="var(--accent)" />
        <StatCard label="Bancos requeridos"  value={resumen.bancos_requeridos} color="var(--text2)"  />
        <StatCard
          label="Balance bancos"
          value={bSob >= 0 ? `+${bSob}` : bSob}
          color={bSob >= 0 ? "#22c55e" : "#ef4444"}
          sub={bSob >= 0 ? "sobrante" : "faltante"}
        />
        <StatCard label="Sillas disponibles" value={resumen.sillas_total}      color="var(--accent)" />
        <StatCard label="Sillas requeridas"  value={resumen.sillas_requeridas} color="var(--text2)"  />
        <StatCard
          label="Balance sillas"
          value={sSob >= 0 ? `+${sSob}` : sSob}
          color={sSob >= 0 ? "#22c55e" : "#ef4444"}
          sub={sSob >= 0 ? "sobrante" : "faltante"}
        />
      </div>

      {/* Gráfico */}
      {conCursos.length > 0 && (
        <div className="card" style={{marginBottom:"1.5rem"}}>
          <div className="card-header">📈 Requerimientos por aula</div>
          <div className="card-body">
            <BarChart data={conCursos} />
          </div>
        </div>
      )}

      {/* Tabla por ubicación */}
      <div className="card">
        <div className="card-header">🏫 Detalle por aula</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aula</th>
                <th>Cursos</th>
                <th>Bancos req.</th>
                <th>Sillas req.</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {porUbi.length === 0
                ? <tr className="empty-row"><td colSpan={5}>Sin datos. Cargá ubicaciones y cursos primero.</td></tr>
                : porUbi.map(u => {
                    const sinCursos = u.cantidad_cursos === 0
                    return (
                      <>
                        <tr
                          key={u.ubicacion_id}
                          onClick={() => !sinCursos && setSelected(selected === u.ubicacion_id ? null : u.ubicacion_id)}
                          style={{cursor: sinCursos ? "default" : "pointer"}}
                        >
                          <td><strong>{u.ubicacion}</strong></td>
                          <td>
                            <span className={`badge ${u.cantidad_cursos > 0 ? "badge-blue" : "badge-gray"}`}>
                              {u.cantidad_cursos} curso{u.cantidad_cursos !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td>{u.bancos_requeridos}</td>
                          <td>{u.sillas_requeridas}</td>
                          <td>
                            {sinCursos
                              ? <span style={{fontSize:"0.78rem",color:"var(--text2)"}}>Sin asignar</span>
                              : <span style={{fontSize:"0.78rem",color:"var(--accent)"}}>
                                  {selected === u.ubicacion_id ? "▲ ocultar" : "▼ ver cursos"}
                                </span>
                            }
                          </td>
                        </tr>
                        {selected === u.ubicacion_id && selCursos.length > 0 && (
                          <tr key={`det-${u.ubicacion_id}`}>
                            <td colSpan={5} style={{padding:"0.5rem 1rem 1rem 2rem",background:"var(--surface2)"}}>
                              <div style={{fontSize:"0.78rem",color:"var(--text2)",marginBottom:"0.5rem",fontWeight:700}}>
                                Cursos en esta aula:
                              </div>
                              <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                                {selCursos.map(c => (
                                  <div key={c.id} style={{
                                    background:"var(--surface)",border:"1px solid var(--border)",
                                    borderRadius:8,padding:"0.5rem 0.85rem",fontSize:"0.82rem"
                                  }}>
                                    <strong>{c.nombre}</strong>
                                    {c.turno && (
                                      <span className={`badge badge-${c.turno==="mañana"?"blue":c.turno==="tarde"?"yellow":"gray"}`}
                                        style={{marginLeft:6}}>
                                        {c.turno}
                                      </span>
                                    )}
                                    <div style={{color:"var(--text2)",marginTop:3,fontSize:"0.78rem"}}>
                                      {c.bancos_requeridos} bancos · {c.sillas_requeridas} sillas
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
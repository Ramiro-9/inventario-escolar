export default function ModalConfirm({ mensaje, onConfirm, onCancel }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:999
    }}>
      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:12, padding:"1.75rem", maxWidth:380, width:"90%",
        boxShadow:"var(--shadow-lg)"
      }}>
        <div style={{fontSize:"2rem", textAlign:"center", marginBottom:"0.75rem"}}>🗑️</div>
        <p style={{textAlign:"center", marginBottom:"1.5rem", color:"var(--text)", fontSize:"0.95rem"}}>
          {mensaje}
        </p>
        <div style={{display:"flex", gap:"0.75rem", justifyContent:"center"}}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger"    onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  )
}
export default function Docs() {
  const secciones = [
    {
      icono: "📊",
      titulo: "Resumen",
      descripcion: "Página principal del sistema. Muestra el estado global del inventario de la escuela.",
      items: [
        { icono: "📦", texto: "Bancos y sillas disponibles: el total físico que tiene la escuela." },
        { icono: "📋", texto: "Bancos y sillas requeridos: la suma de lo que necesitan todas las aulas (tomando el máximo entre cursos que comparten aula)." },
        { icono: "✅", texto: "Balance: la diferencia entre lo disponible y lo requerido. Verde = sobra, Rojo = falta." },
        { icono: "📈", texto: "Gráfico de barras: muestra visualmente los requerimientos por aula. Azul = bancos, Amarillo = sillas." },
        { icono: "🏫", texto: "Tabla de aulas: hacé click en una fila para ver los cursos que ocupan esa aula y sus requerimientos individuales." },
        { icono: "📥", texto: "Botón Excel: descarga un archivo .xlsx con el resumen completo, requerimientos por aula y listado de cursos." },
        { icono: "📄", texto: "Botón PDF: descarga un archivo PDF con el mismo contenido, listo para imprimir." },
      ]
    },
    {
      icono: "📍",
      titulo: "Ubicaciones",
      descripcion: "Administración de los espacios físicos de la escuela (aulas, talleres, laboratorios, etc.).",
      items: [
        { icono: "➕", texto: "Agregar: completá el nombre (obligatorio) y una descripción opcional, luego hacé click en Agregar." },
        { icono: "✏️", texto: "Editar: hacé click en el botón Editar de la fila correspondiente. El formulario se completa con los datos actuales. Confirmá con Actualizar." },
        { icono: "🗑️", texto: "Eliminar: abre un modal de confirmación. No se puede eliminar una ubicación que tenga cursos asignados." },
        { icono: "🔍", texto: "Buscar: el campo de búsqueda filtra en tiempo real por nombre o descripción." },
        { icono: "↑↓", texto: "Ordenar: hacé click en el encabezado de cualquier columna para ordenar la tabla." },
      ]
    },
    {
      icono: "🎓",
      titulo: "Cursos",
      descripcion: "Administración de los cursos y su asignación a ubicaciones. Cada curso tiene sus propios requerimientos de muebles.",
      items: [
        { icono: "➕", texto: "Agregar: completá el nombre del curso (ej: 1°4°), el turno si comparte aula, la ubicación y la cantidad de bancos y sillas que necesita." },
        { icono: "🔄", texto: "Turno: solo es necesario cuando dos o más cursos comparten una misma aula (mañana, tarde o noche). Si el curso no comparte, dejalo vacío." },
        { icono: "🏆", texto: "MAX aula: muestra el máximo entre todos los cursos que comparten esa aula. El curso que define el máximo aparece marcado con 🏆. Ese valor es el que se usa para calcular el resumen global." },
        { icono: "⚠️", texto: "Duplicado: el sistema no permite cargar dos cursos con el mismo turno en la misma ubicación." },
        { icono: "🔍", texto: "Buscar y filtrar: podés buscar por nombre o filtrar por aula usando el selector." },
        { icono: "↑↓", texto: "Ordenar: hacé click en cualquier encabezado de columna para ordenar." },
      ]
    },
    {
      icono: "📦",
      titulo: "Stock",
      descripcion: "Registro del total de muebles disponibles físicamente en la escuela.",
      items: [
        { icono: "🪑", texto: "Total de bancos: ingresá el número total de bancos que tiene la escuela (sin importar dónde estén)." },
        { icono: "🪑", texto: "Total de sillas: ídem para sillas." },
        { icono: "💾", texto: "Guardar: confirma los cambios. El Resumen se actualiza automáticamente con los nuevos valores." },
        { icono: "💡", texto: "Tip: actualizá el stock cada vez que se compren, pierdan o descarten muebles para mantener el sistema al día." },
      ]
    },
    {
      icono: "👤",
      titulo: "Usuarios y roles",
      descripcion: "El sistema tiene dos tipos de usuario con distintos niveles de acceso.",
      items: [
        { icono: "🔑", texto: "Admin: acceso completo. Puede ver, crear, editar y eliminar ubicaciones, cursos y stock. También puede exportar reportes y ver esta documentación." },
        { icono: "👁️", texto: "Viewer: solo puede ver el Resumen. No tiene acceso a las secciones de administración." },
        { icono: "🔐", texto: "Login: el sistema requiere iniciar sesión para acceder a funciones de administración. El Resumen es visible para todos." },
        { icono: "⏱️", texto: "Sesión: la sesión dura 8 horas. Al expirar, el sistema pedirá iniciar sesión nuevamente." },
        { icono: "⚠️", texto: "Seguridad: cambiá la contraseña del usuario admin después del primer ingreso." },
      ]
    },
    {
      icono: "💡",
      titulo: "Flujo recomendado de uso",
      descripcion: "Para empezar a usar el sistema desde cero, seguí este orden:",
      pasos: [
        "1. Ir a Stock y cargar el total de bancos y sillas disponibles en la escuela.",
        "2. Ir a Ubicaciones y cargar todas las aulas y espacios físicos.",
        "3. Ir a Cursos y cargar cada curso, asignándolo a su aula correspondiente con los muebles que necesita. Si dos cursos comparten aula, asignarles el turno.",
        "4. Ir a Resumen para verificar el balance general y exportar el reporte si es necesario.",
        "5. Actualizar el sistema cada vez que cambien las asignaciones o el inventario físico.",
      ]
    }
  ]

  return (
    <>
      <div className="page-header">
        <h1>📖 <span>Documentación</span></h1>
        <span style={{fontSize:"0.82rem", color:"var(--text2)"}}>Guía de uso del sistema</span>
      </div>

      <div style={{display:"flex", flexDirection:"column", gap:"1.25rem"}}>
        {secciones.map(s => (
          <div className="card" key={s.titulo}>
            <div className="card-header">
              {s.icono} {s.titulo}
            </div>
            <div className="card-body">
              <p style={{color:"var(--text2)", fontSize:"0.88rem", marginBottom:"1rem"}}>
                {s.descripcion}
              </p>

              {s.items && (
                <div style={{display:"flex", flexDirection:"column", gap:"0.6rem"}}>
                  {s.items.map((item, i) => (
                    <div key={i} style={{
                      display:"flex", gap:"0.75rem", alignItems:"flex-start",
                      padding:"0.6rem 0.85rem",
                      background:"var(--surface2)", borderRadius:8,
                      border:"1px solid var(--border)"
                    }}>
                      <span style={{fontSize:"1.1rem", minWidth:24}}>{item.icono}</span>
                      <span style={{fontSize:"0.87rem", color:"var(--text)", lineHeight:1.5}}>{item.texto}</span>
                    </div>
                  ))}
                </div>
              )}

              {s.pasos && (
                <div style={{display:"flex", flexDirection:"column", gap:"0.5rem"}}>
                  {s.pasos.map((paso, i) => (
                    <div key={i} style={{
                      display:"flex", gap:"0.75rem", alignItems:"flex-start",
                      padding:"0.6rem 0.85rem",
                      background:"var(--surface2)", borderRadius:8,
                      border:"1px solid var(--border)"
                    }}>
                      <span style={{
                        minWidth:24, height:24, borderRadius:"50%",
                        background:"var(--accent)", color:"white",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"0.75rem", fontWeight:700, flexShrink:0
                      }}>{i + 1}</span>
                      <span style={{fontSize:"0.87rem", color:"var(--text)", lineHeight:1.5}}>
                        {paso.replace(/^\d+\.\s/, "")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
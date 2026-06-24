from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import Base, engine, SessionLocal, crear_base_si_no_existe
from app.routers import ubicaciones, cursos, stock, resumen, exportar, auth
from app import models
from app.auth import hash_password

app = FastAPI(title="Inventario Escolar", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://inventario-frontend-oh8c.onrender.com",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ubicaciones.router)
app.include_router(cursos.router)
app.include_router(stock.router)
app.include_router(resumen.router)
app.include_router(exportar.router)

@app.on_event("startup")
def startup():
    crear_base_si_no_existe()
    Base.metadata.create_all(bind=engine)
    print("[DB] Tablas verificadas.")

    with engine.connect() as conn:
        conn.execute(text("""
            CREATE OR REPLACE VIEW requerimientos_por_ubicacion AS
            SELECT
                u.id                        AS ubicacion_id,
                u.nombre                    AS ubicacion,
                MAX(c.bancos_requeridos)    AS bancos_requeridos,
                MAX(c.sillas_requeridas)    AS sillas_requeridas,
                COUNT(c.id)                 AS cantidad_cursos
            FROM ubicaciones u
            LEFT JOIN cursos c ON c.ubicacion_id = u.id
            GROUP BY u.id, u.nombre
        """))
        conn.execute(text("""
            CREATE OR REPLACE VIEW resumen_inventario AS
            SELECT
                s.bancos_total,
                s.sillas_total,
                COALESCE(SUM(r.bancos_requeridos), 0)                   AS bancos_requeridos,
                COALESCE(SUM(r.sillas_requeridas), 0)                   AS sillas_requeridas,
                s.bancos_total - COALESCE(SUM(r.bancos_requeridos), 0)  AS bancos_sobrantes,
                s.sillas_total - COALESCE(SUM(r.sillas_requeridas), 0)  AS sillas_sobrantes
            FROM stock s
            LEFT JOIN requerimientos_por_ubicacion r ON true
            GROUP BY s.bancos_total, s.sillas_total
        """))
        conn.commit()
    print("[DB] Vistas verificadas.")

    db = SessionLocal()
    try:
        # Stock inicial
        if not db.get(models.Stock, 1):
            db.add(models.Stock(id=1, bancos_total=0, sillas_total=0))
            db.commit()
            print("[DB] Stock inicializado.")

        # Usuario admin por defecto
        if not db.query(models.Usuario).filter(models.Usuario.username == "admin").first():
            db.add(models.Usuario(
                username = "admin",
                password = hash_password("admin1234"),
                rol      = models.RolUsuario.admin
            ))
            db.commit()
            print("[DB] Usuario admin creado. Contraseña: admin1234")
            print("[!]  Cambiá la contraseña después del primer login.")
    finally:
        db.close()

@app.get("/")
def root():
    return {"mensaje": "API de Inventario Escolar v3.0"}
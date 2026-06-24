from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas

router = APIRouter(tags=["Resumen"])

@router.get("/resumen", response_model=schemas.ResumenOut)
def obtener_resumen(db: Session = Depends(get_db)):
    row = db.execute(text("SELECT * FROM resumen_inventario")).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Sin datos para calcular resumen")
    return dict(row)

@router.get("/requerimientos_por_ubicacion", response_model=list[schemas.ResumenUbicacionOut])
def requerimientos(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM requerimientos_por_ubicacion ORDER BY ubicacion")).mappings().all()
    return [
        {**dict(r),
         "bancos_requeridos": r["bancos_requeridos"] or 0,
         "sillas_requeridas": r["sillas_requeridas"] or 0,
         "cantidad_cursos":   r["cantidad_cursos"]   or 0}
        for r in rows
    ]
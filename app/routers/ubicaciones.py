from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app import models, schemas
from app.auth import solo_admin

router = APIRouter(prefix="/ubicaciones", tags=["Ubicaciones"])

def _guardar(db: Session, ubi: models.Ubicacion):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una ubicación con ese nombre") from None
    db.refresh(ubi)

@router.get("/", response_model=list[schemas.UbicacionOut])
def listar(db: Session = Depends(get_db)):
    return db.query(models.Ubicacion).order_by(models.Ubicacion.nombre).all()

@router.get("/{id}", response_model=schemas.UbicacionOut)
def obtener(id: int, db: Session = Depends(get_db)):
    ubi = db.get(models.Ubicacion, id)
    if not ubi:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    return ubi

@router.post("/", response_model=schemas.UbicacionOut, status_code=201)
def crear(data: schemas.UbicacionCreate, db: Session = Depends(get_db), _=Depends(solo_admin)):
    ubi = models.Ubicacion(**data.model_dump())
    db.add(ubi)
    _guardar(db, ubi)
    return ubi

@router.patch("/{id}", response_model=schemas.UbicacionOut)
def actualizar(id: int, data: schemas.UbicacionUpdate, db: Session = Depends(get_db), _=Depends(solo_admin)):
    ubi = db.get(models.Ubicacion, id)
    if not ubi:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ubi, k, v)
    _guardar(db, ubi)
    return ubi

@router.delete("/{id}", status_code=204)
def eliminar(id: int, db: Session = Depends(get_db), _=Depends(solo_admin)):
    ubi = db.get(models.Ubicacion, id)
    if not ubi:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    if ubi.cursos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene cursos asignados")
    db.delete(ubi); db.commit()

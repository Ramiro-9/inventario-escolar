from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import solo_admin

router = APIRouter(prefix="/cursos", tags=["Cursos"])

def _check_duplicado(db: Session, ubicacion_id: int, turno, excluir_id: int = None):
    """Evita dos cursos con el mismo turno en la misma ubicación."""
    if turno is None:
        return  # sin turno no hay conflicto
    q = db.query(models.Curso).filter(
        models.Curso.ubicacion_id == ubicacion_id,
        models.Curso.turno == turno,
    )
    if excluir_id:
        q = q.filter(models.Curso.id != excluir_id)
    if q.first():
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe un curso en turno '{turno}' para esa ubicación"
        )

@router.get("/", response_model=list[schemas.CursoOut])
def listar(db: Session = Depends(get_db)):
    return db.query(models.Curso).order_by(models.Curso.nombre).all()

@router.get("/{id}", response_model=schemas.CursoOut)
def obtener(id: int, db: Session = Depends(get_db)):
    curso = db.get(models.Curso, id)
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return curso

@router.post("/", response_model=schemas.CursoOut, status_code=201)
def crear(data: schemas.CursoCreate, db: Session = Depends(get_db)):
    if not db.get(models.Ubicacion, data.ubicacion_id):
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    _check_duplicado(db, data.ubicacion_id, data.turno)
    curso = models.Curso(**data.model_dump())
    db.add(curso); db.commit(); db.refresh(curso)
    return curso

@router.patch("/{id}", response_model=schemas.CursoOut)
def actualizar(id: int, data: schemas.CursoUpdate, db: Session = Depends(get_db)):
    curso = db.get(models.Curso, id)
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    cambios = data.model_dump(exclude_none=True)
    ubi_id = cambios.get("ubicacion_id", curso.ubicacion_id)
    turno  = cambios.get("turno", curso.turno)
    if "ubicacion_id" in cambios and not db.get(models.Ubicacion, ubi_id):
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    _check_duplicado(db, ubi_id, turno, excluir_id=id)
    for k, v in cambios.items():
        setattr(curso, k, v)
    db.commit(); db.refresh(curso)
    return curso

@router.delete("/{id}", status_code=204)
def eliminar(id: int, db: Session = Depends(get_db)):
    curso = db.get(models.Curso, id)
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    db.delete(curso); db.commit()
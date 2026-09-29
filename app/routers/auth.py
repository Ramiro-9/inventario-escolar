from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, StringConstraints, field_validator
from typing import Annotated, Literal
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app import models
from app.auth import verify_password, crear_token, hash_password, get_usuario_actual, solo_admin

router = APIRouter(prefix="/auth", tags=["Auth"])

class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    rol:          str
    username:     str

class UsuarioCreate(BaseModel):
    username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
    password: str
    rol: Literal["admin", "viewer"] = "viewer"

    @field_validator("password")
    @classmethod
    def validar_password(cls, value):
        if not value.strip():
            raise ValueError("La contraseña no puede estar vacía")
        if len(value.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar 72 bytes UTF-8")
        return value

class UsuarioOut(BaseModel):
    id:       int
    username: str
    rol:      str
    activo:   bool
    model_config = {"from_attributes": True}

@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.username == form.username,
        models.Usuario.activo   == True
    ).first()
    if not usuario or not verify_password(form.password, usuario.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    token = crear_token({"sub": usuario.username, "rol": usuario.rol.value})
    return TokenOut(access_token=token, rol=usuario.rol.value, username=usuario.username)

@router.get("/me", response_model=UsuarioOut)
def me(usuario = Depends(get_usuario_actual)):
    return usuario

# Solo admin puede gestionar usuarios
@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), _=Depends(solo_admin)):
    return db.query(models.Usuario).all()

@router.post("/usuarios", response_model=UsuarioOut, status_code=201)
def crear_usuario(data: UsuarioCreate, db: Session = Depends(get_db), _=Depends(solo_admin)):
    if db.query(models.Usuario).filter(models.Usuario.username == data.username).first():
        raise HTTPException(status_code=409, detail="El usuario ya existe")
    rol = models.RolUsuario.admin if data.rol == "admin" else models.RolUsuario.viewer
    u = models.Usuario(username=data.username, password=hash_password(data.password), rol=rol)
    db.add(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="El usuario ya existe") from None
    db.refresh(u)
    return u

@router.delete("/usuarios/{id}", status_code=204)
def eliminar_usuario(id: int, db: Session = Depends(get_db), admin=Depends(solo_admin)):
    u = db.get(models.Usuario, id)
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="No podés eliminarte a vos mismo")
    db.delete(u); db.commit()

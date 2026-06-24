from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
import os

SECRET_KEY  = os.getenv("SECRET_KEY", "cambiar_en_produccion_por_algo_seguro")
ALGORITHM   = "HS256"
TOKEN_HOURS = 8

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def crear_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_usuario_actual(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    credenciales_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credenciales_error
    except JWTError:
        raise credenciales_error

    usuario = db.query(models.Usuario).filter(
        models.Usuario.username == username,
        models.Usuario.activo   == True
    ).first()
    if not usuario:
        raise credenciales_error
    return usuario

def solo_admin(usuario: models.Usuario = Depends(get_usuario_actual)):
    if usuario.rol != models.RolUsuario.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol administrador"
        )
    return usuario
import enum
from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class TurnoTipo(enum.Enum):
    manana = "mañana"
    tarde  = "tarde"
    noche  = "noche"

class RolUsuario(enum.Enum):
    admin  = "admin"
    viewer = "viewer"

class Usuario(Base):
    __tablename__ = "usuarios"

    id          = Column(Integer, primary_key=True, index=True)
    username    = Column(String(50), nullable=False, unique=True)
    password    = Column(String(200), nullable=False)
    rol         = Column(Enum(RolUsuario), nullable=False, default=RolUsuario.viewer)
    activo      = Column(Boolean, default=True)

class Ubicacion(Base):
    __tablename__ = "ubicaciones"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(100), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)

    cursos = relationship("Curso", back_populates="ubicacion")

class Curso(Base):
    __tablename__ = "cursos"

    id                  = Column(Integer, primary_key=True, index=True)
    nombre              = Column(String(100), nullable=False)
    turno               = Column(Enum(TurnoTipo), nullable=True)
    ubicacion_id        = Column(Integer, ForeignKey("ubicaciones.id"), nullable=False)
    bancos_requeridos   = Column(Integer, nullable=False, default=0)
    sillas_requeridas   = Column(Integer, nullable=False, default=0)

    ubicacion = relationship("Ubicacion", back_populates="cursos")

class Stock(Base):
    __tablename__ = "stock"

    id           = Column(Integer, primary_key=True, default=1)
    bancos_total = Column(Integer, nullable=False, default=0)
    sillas_total = Column(Integer, nullable=False, default=0)
    updated_at   = Column(DateTime, server_default=func.now(), onupdate=func.now())
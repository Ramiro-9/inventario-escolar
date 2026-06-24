from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class TurnoTipo(str, Enum):
    manana = "mañana"
    tarde  = "tarde"
    noche  = "noche"

# ---------- Ubicacion ----------

class UbicacionBase(BaseModel):
    nombre:      str
    descripcion: Optional[str] = None

class UbicacionCreate(UbicacionBase):
    pass

class UbicacionUpdate(BaseModel):
    nombre:      Optional[str] = None
    descripcion: Optional[str] = None

class UbicacionOut(UbicacionBase):
    id: int
    model_config = {"from_attributes": True}

# ---------- Curso ----------

class CursoBase(BaseModel):
    nombre:             str
    turno:              Optional[TurnoTipo] = None
    ubicacion_id:       int
    bancos_requeridos:  int = Field(default=0, ge=0)
    sillas_requeridas:  int = Field(default=0, ge=0)

class CursoCreate(CursoBase):
    pass

class CursoUpdate(BaseModel):
    nombre:             Optional[str]       = None
    turno:              Optional[TurnoTipo] = None
    ubicacion_id:       Optional[int]       = None
    bancos_requeridos:  Optional[int]       = Field(default=None, ge=0)
    sillas_requeridas:  Optional[int]       = Field(default=None, ge=0)

class CursoOut(CursoBase):
    id:        int
    ubicacion: UbicacionOut
    model_config = {"from_attributes": True}

# ---------- Stock ----------

class StockBase(BaseModel):
    bancos_total: int = Field(ge=0)
    sillas_total: int = Field(ge=0)

class StockUpdate(BaseModel):
    bancos_total: Optional[int] = Field(default=None, ge=0)
    sillas_total: Optional[int] = Field(default=None, ge=0)

class StockOut(StockBase):
    updated_at: datetime
    model_config = {"from_attributes": True}

# ---------- Resumen ----------

class ResumenUbicacionOut(BaseModel):
    ubicacion_id:      int
    ubicacion:         str
    bancos_requeridos: int = 0
    sillas_requeridas: int = 0
    cantidad_cursos:   int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kw):
        if isinstance(obj, dict):
            obj = {**obj,
                   "bancos_requeridos": obj.get("bancos_requeridos") or 0,
                   "sillas_requeridas": obj.get("sillas_requeridas") or 0,
                   "cantidad_cursos":   obj.get("cantidad_cursos")   or 0}
        return super().model_validate(obj, **kw)

class ResumenOut(BaseModel):
    bancos_total:      int
    sillas_total:      int
    bancos_requeridos: int
    sillas_requeridas: int
    bancos_sobrantes:  int
    sillas_sobrantes:  int
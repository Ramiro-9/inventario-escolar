from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/stock", tags=["Stock"])

def _get_stock(db: Session) -> models.Stock:
    stock = db.get(models.Stock, 1)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock no inicializado")
    return stock

@router.get("/", response_model=schemas.StockOut)
def obtener(db: Session = Depends(get_db)):
    return _get_stock(db)

@router.patch("/", response_model=schemas.StockOut)
def actualizar(data: schemas.StockUpdate, db: Session = Depends(get_db)):
    stock = _get_stock(db)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(stock, k, v)
    db.commit()
    db.refresh(stock)
    return stock
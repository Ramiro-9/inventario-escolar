from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")  


def crear_base_si_no_existe():
    
    base_url = DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
    db_name  = DATABASE_URL.rsplit("/", 1)[1]

    engine_base = create_engine(base_url, isolation_level="AUTOCOMMIT")
    with engine_base.connect() as conn:
        existe = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_name}
        ).fetchone()
        if not existe:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            print(f"[DB] Base de datos '{db_name}' creada.")
        else:
            print(f"[DB] Base de datos '{db_name}' ya existe.")
    engine_base.dispose()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
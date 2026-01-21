# services/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./medcase.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite için ZORUNLU
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
    
)
print(">>> SQLITE DB URL:", engine.url)

Base = declarative_base()


# 🔴 EKSİK OLAN FONKSİYON (HATANIN SEBEBİ)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
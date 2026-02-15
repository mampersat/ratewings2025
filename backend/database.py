import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Explicit DB path: set DB_PATH env (e.g. /data/wings.db in containers). Default: ./wings.db
_db_path = os.environ.get("DB_PATH", "wings.db")
SQLALCHEMY_DATABASE_URL = (
    f"sqlite:///{_db_path}" if _db_path.startswith("/") else f"sqlite:///./{_db_path}"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base() 
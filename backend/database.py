import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL format: postgresql+asyncpg://user:password@localhost/dbname
# We will use SQLite for initial rapid setup, then swap to Postgres as needed.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./sutraos.db")

if "sqlite" in DATABASE_URL:
    engine_args = {"connect_args": {"check_same_thread": False}}
else:
    engine_args = {
        "pool_size": 20,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True
    }

engine = create_async_engine(DATABASE_URL, echo=False, **engine_args)

SessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session

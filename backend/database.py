import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL format: postgresql+asyncpg://user:password@localhost/dbname
# We will use SQLite for initial rapid setup, then swap to Postgres as needed.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./sutraos.db")

engine = create_async_engine(
    DATABASE_URL, 
    echo=True, 
    # check_same_thread is needed only for sqlite
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session

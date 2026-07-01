#!/bin/sh
set -e

python - <<'PY'
import asyncio
import time
from sqlalchemy.exc import OperationalError
from database import engine
from db_migrations import ensure_document_lockers_schema

async def main():
    last_error = None
    for attempt in range(30):
        try:
            await ensure_document_lockers_schema(engine)
            print('document locker schema ensured')
            return
        except OperationalError as exc:
            last_error = exc
            print(f'database not ready yet ({attempt + 1}/30): {exc}')
            time.sleep(2)
        except Exception as exc:
            last_error = exc
            print(f'database migration failed: {exc}')
            raise

    raise RuntimeError(f'database migration failed after retries: {last_error}')

asyncio.run(main())
PY

exec uvicorn main:app --host 0.0.0.0 --port 8000

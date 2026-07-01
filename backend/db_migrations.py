from sqlalchemy import inspect, text


async def ensure_document_lockers_schema(engine):
    """Add the missing file_path column to existing document_lockers tables, and normalize legacy rows."""
    async with engine.begin() as conn:
        def _ensure(sync_conn):
            inspector = inspect(sync_conn)
            if "document_lockers" not in inspector.get_table_names():
                return

            columns = {column["name"] for column in inspector.get_columns("document_lockers")}
            if "file_path" not in columns:
                sync_conn.execute(text("ALTER TABLE document_lockers ADD COLUMN file_path TEXT"))

            # Normalize any rows with missing file_path so application checks do not crash.
            sync_conn.execute(text(
                "UPDATE document_lockers SET file_path = NULL WHERE file_path IS NULL"
            ))

        await conn.run_sync(_ensure)

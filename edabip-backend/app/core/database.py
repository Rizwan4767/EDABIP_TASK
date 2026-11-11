from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_recycle=280)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_settings_database() -> None:
    """Create the settings schema on the same MySQL server if it is missing."""
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine.url import make_url

    url = make_url(settings.DATABASE_URL)
    db_name = url.database or ""
    if not db_name.isidentifier():
        raise RuntimeError("Refusing to create a settings database with an unsafe name")

    server_engine = create_engine(url.set(database=None), pool_pre_ping=True)
    try:
        with server_engine.connect() as conn:
            conn.execute(
                text(
                    f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            )
            conn.commit()
    finally:
        server_engine.dispose()


def get_db() -> Generator[Session, None, None]:
    """
    INTEGRATION POINT: if the main EDABIP app already has its own
    app.database.get_db / Base / engine, mount this module against THAT
    engine instead of creating a second connection pool to the same MySQL
    instance. Do this by overriding the dependency:

        from app.core.database import get_db as settings_get_db
        main_app.dependency_overrides[settings_get_db] = main_app_get_db

    and pointing app.core.database.Base.metadata at the same MetaData /
    running this module's models through the main app's Alembic chain
    (see alembic/README in this module and "Integration Points" in README.md).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

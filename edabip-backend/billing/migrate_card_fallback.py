"""One-off schema migration for the TEST-mode card fallback.

This project has no Alembic history (alembic.ini points at a directory
that does not exist), and `Base.metadata.create_all` only ever CREATEs -
it never ALTERs an existing table. So an already-provisioned database
needs this script once:

    python -m billing.migrate_card_fallback

Idempotent: every step checks information_schema first, so re-running it
is a no-op. Safe on a fresh database too, where create_all has already
produced the final shape and nothing here applies.
"""
from sqlalchemy import text

from database import engine

TABLE = "billing_payment_methods"


def _columns(conn) -> set[str]:
    rows = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t"
        ),
        {"t": TABLE},
    )
    return {r[0] for r in rows}


def migrate() -> list[str]:
    applied: list[str] = []
    with engine.begin() as conn:
        cols = _columns(conn)
        if not cols:
            return ["table does not exist yet - nothing to migrate"]

        # A fallback row has no token, so the column has to accept NULL.
        # MySQL allows any number of NULLs under a UNIQUE key, so the
        # existing uniqueness guarantee for real tokens is unaffected.
        conn.execute(text(
            f"ALTER TABLE {TABLE} MODIFY COLUMN razorpay_token_id VARCHAR(64) NULL"
        ))
        applied.append("razorpay_token_id -> NULL-able")

        # Razorpay gives no expiry on a payment entity, only on a token
        # fetch. NULL means "unknown" rather than a guessed date.
        conn.execute(text(f"ALTER TABLE {TABLE} MODIFY COLUMN exp_month INT NULL"))
        conn.execute(text(f"ALTER TABLE {TABLE} MODIFY COLUMN exp_year INT NULL"))
        applied.append("exp_month/exp_year -> NULL-able")

        if "razorpay_card_id" not in cols:
            conn.execute(text(
                f"ALTER TABLE {TABLE} ADD COLUMN razorpay_card_id VARCHAR(64) NULL AFTER razorpay_token_id"
            ))
            applied.append("razorpay_card_id added")

        if "is_chargeable" not in cols:
            # Real tokens default to chargeable; the demo rows are fixed
            # up by the UPDATE below.
            conn.execute(text(
                f"ALTER TABLE {TABLE} ADD COLUMN is_chargeable TINYINT(1) NOT NULL DEFAULT 1"
            ))
            applied.append("is_chargeable added (existing rows -> 1)")

        cols = _columns(conn)
        if "method" not in cols:
            conn.execute(text(
                f"ALTER TABLE {TABLE} ADD COLUMN method VARCHAR(16) NOT NULL DEFAULT 'card'"
            ))
            applied.append("method added (existing rows -> card)")

        # seed_demo writes placeholder tokens Razorpay never minted, and
        # since this patch it marks them is_chargeable=False. Rows seeded
        # BEFORE that were swept up by the DEFAULT 1 above, so they now
        # claim to be chargeable - and removing one sends "token_demo_..."
        # to token.delete, which 502s the whole removal. Demote them to
        # match what seed_demo writes today.
        #
        # Backslash-escaped so MySQL treats the underscores as literals
        # rather than single-character wildcards.
        result = conn.execute(text(
            f"UPDATE {TABLE} SET is_chargeable = 0 "
            r"WHERE razorpay_token_id LIKE 'token\_demo\_%' AND is_chargeable = 1"
        ))
        if result.rowcount:
            applied.append(f"demo placeholder tokens -> not chargeable ({result.rowcount} row(s))")

    return applied


if __name__ == "__main__":
    for line in migrate():
        print(f"  {line}")
    print("done")

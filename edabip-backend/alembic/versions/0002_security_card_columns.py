"""security card columns

Adds the two columns that back the Settings page's Security card
(app/routers/security.py): a 2FA preference flag and a password hash.
Deliberately minimal — see the column comments in app/models.py — this is
NOT a real MFA/login system, just somewhere for the Security card to persist
what it reads/writes.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-01

"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("two_factor_enabled", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_hash")
    op.drop_column("users", "two_factor_enabled")

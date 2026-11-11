"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-28

"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.String(255), nullable=False),
    )

    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.String(255), server_default=""),
    )
    op.create_index("ix_permissions_code", "permissions", ["code"])

    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer, sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.Integer, sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("first_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("last_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("mobile_number", sa.String(30), server_default=""),
        sa.Column("application_name", sa.String(150), server_default="EDABIP"),
        sa.Column("timezone", sa.String(100), server_default="UTC"),
        sa.Column("company_size", sa.String(50), server_default=""),
        sa.Column("industry", sa.String(100), server_default=""),
        sa.Column("email_notifications", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("role_id", sa.Integer, sa.ForeignKey("roles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role_id", "users", ["role_id"])

    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("dashboard_alerts", sa.String(50), nullable=False, server_default="all"),
        sa.Column("report_updates", sa.Enum("realtime", "hourly", "daily", "weekly", name="reportfrequency"), nullable=False, server_default="daily"),
        sa.Column("sms_notifications", sa.Boolean, nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "integration_providers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text, server_default=""),
    )

    op.create_table(
        "user_integrations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider_id", sa.Integer, sa.ForeignKey("integration_providers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("active", "inactive", name="integrationstatus"), nullable=False, server_default="inactive"),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_user_integrations_user_provider", "user_integrations", ["user_id", "provider_id"], unique=True
    )


def downgrade() -> None:
    op.drop_table("user_integrations")
    op.drop_table("integration_providers")
    op.drop_table("notification_preferences")
    op.drop_index("ix_users_role_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("role_permissions")
    op.drop_index("ix_permissions_code", table_name="permissions")
    op.drop_table("permissions")
    op.drop_table("roles")

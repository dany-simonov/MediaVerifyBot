"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-02-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), nullable=False, comment="Telegram user_id"),
        sa.Column("username", sa.String(length=255), nullable=True),
        sa.Column("first_name", sa.String(length=255), nullable=True),
        sa.Column("is_premium", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("daily_checks_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("daily_checks_reset", sa.DateTime(), nullable=True, comment="Timestamp of last counter reset"),
        sa.Column("total_checks", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # checks
    op.create_table(
        "checks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("media_type", sa.String(length=20), nullable=False, comment="image | audio | video | text"),
        sa.Column("verdict", sa.String(length=20), nullable=False, comment="REAL | FAKE | UNCERTAIN"),
        sa.Column("confidence", sa.Float(), nullable=False, comment="0.0 – 1.0"),
        sa.Column("model_used", sa.String(length=50), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("processing_ms", sa.Integer(), nullable=False, comment="Processing time in ms"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # rate_limits
    op.create_table(
        "rate_limits",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("count", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id", "date"),
    )


def downgrade() -> None:
    op.drop_table("rate_limits")
    op.drop_table("checks")
    op.drop_table("users")

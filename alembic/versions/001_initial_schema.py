"""Initial database schema migration creating all 16 DAYFLOW models

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-22 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='EMPLOYEE'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. departments
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_departments_code'), 'departments', ['code'], unique=True)
    op.create_index(op.f('ix_departments_id'), 'departments', ['id'], unique=False)
    op.create_index(op.f('ix_departments_name'), 'departments', ['name'], unique=True)

    # 3. employees
    op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('employee_code', sa.String(length=50), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('designation', sa.String(length=100), nullable=False),
        sa.Column('joining_date', sa.Date(), nullable=False),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('profile_picture_url', sa.String(length=500), nullable=True),
        sa.Column('employment_status', sa.String(length=50), nullable=False, server_default='FULL_TIME'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['manager_id'], ['employees.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_employees_department_id'), 'employees', ['department_id'], unique=False)
    op.create_index(op.f('ix_employees_employee_code'), 'employees', ['employee_code'], unique=True)
    op.create_index(op.f('ix_employees_id'), 'employees', ['id'], unique=False)

    # 4. attendance
    op.create_table(
        'attendance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('check_in', sa.DateTime(timezone=True), nullable=True),
        sa.Column('check_out', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('working_hours', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='WEB'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_attendance_date_status', 'attendance', ['date', 'status'], unique=False)
    op.create_index('idx_attendance_emp_date', 'attendance', ['employee_id', 'date'], unique=False)
    op.create_index(op.f('ix_attendance_date'), 'attendance', ['date'], unique=False)
    op.create_index(op.f('ix_attendance_employee_id'), 'attendance', ['employee_id'], unique=False)
    op.create_index(op.f('ix_attendance_id'), 'attendance', ['id'], unique=False)
    op.create_index(op.f('ix_attendance_status'), 'attendance', ['status'], unique=False)

    # 5. leave_types
    op.create_table(
        'leave_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('max_days_per_year', sa.Integer(), nullable=False, server_default='12'),
        sa.Column('is_paid', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leave_types_code'), 'leave_types', ['code'], unique=True)
    op.create_index(op.f('ix_leave_types_id'), 'leave_types', ['id'], unique=False)

    # 6. leave_requests
    op.create_table(
        'leave_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('leave_type_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('total_days', sa.Float(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewer_comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['leave_type_id'], ['leave_types.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leave_requests_employee_id'), 'leave_requests', ['employee_id'], unique=False)
    op.create_index(op.f('ix_leave_requests_id'), 'leave_requests', ['id'], unique=False)
    op.create_index(op.f('ix_leave_requests_leave_type_id'), 'leave_requests', ['leave_type_id'], unique=False)
    op.create_index(op.f('ix_leave_requests_status'), 'leave_requests', ['status'], unique=False)

    # 7. leave_balances
    op.create_table(
        'leave_balances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('leave_type_id', sa.Integer(), nullable=False),
        sa.Column('allocated_days', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('used_days', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('pending_days', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('remaining_days', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['leave_type_id'], ['leave_types.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id', 'leave_type_id', 'year', name='uq_emp_leave_year')
    )
    op.create_index(op.f('ix_leave_balances_employee_id'), 'leave_balances', ['employee_id'], unique=False)
    op.create_index(op.f('ix_leave_balances_id'), 'leave_balances', ['id'], unique=False)
    op.create_index(op.f('ix_leave_balances_leave_type_id'), 'leave_balances', ['leave_type_id'], unique=False)
    op.create_index(op.f('ix_leave_balances_year'), 'leave_balances', ['year'], unique=False)

    # 8. payroll
    op.create_table(
        'payroll',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('basic_salary', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('allowances', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('deductions', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('net_salary', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='USD'),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payroll_employee_id'), 'payroll', ['employee_id'], unique=False)
    op.create_index(op.f('ix_payroll_id'), 'payroll', ['id'], unique=False)

    # 9. documents
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('document_type', sa.String(length=100), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_employee_id'), 'documents', ['employee_id'], unique=False)
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)

    # 10. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, server_default='INFO'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('link', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)

    # 11. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=True),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='SYSTEM'),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

    # 12. ai_events
    op.create_table(
        'ai_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.String(length=100), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('agent_name', sa.String(length=100), nullable=False),
        sa.Column('action_type', sa.String(length=100), nullable=False),
        sa.Column('input_summary', sa.Text(), nullable=True),
        sa.Column('data_sources', sa.Text(), nullable=True),
        sa.Column('decision', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('guardrail_status', sa.String(length=50), nullable=False, server_default='PASSED'),
        sa.Column('human_approval_required', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('human_approved', sa.Boolean(), nullable=True),
        sa.Column('tool_name', sa.String(length=100), nullable=True),
        sa.Column('tool_result_reference', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_events_created_at'), 'ai_events', ['created_at'], unique=False)
    op.create_index(op.f('ix_ai_events_id'), 'ai_events', ['id'], unique=False)
    op.create_index(op.f('ix_ai_events_request_id'), 'ai_events', ['request_id'], unique=False)
    op.create_index(op.f('ix_ai_events_user_id'), 'ai_events', ['user_id'], unique=False)

    # 13. ai_insights
    op.create_table(
        'ai_insights',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('metrics_json', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=50), nullable=False, server_default='INFO'),
        sa.Column('is_dismissed', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_insights_id'), 'ai_insights', ['id'], unique=False)

    # 14. attendance_anomalies
    op.create_table(
        'attendance_anomalies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('anomaly_type', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False, server_default='MEDIUM'),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='OPEN'),
        sa.Column('detected_by', sa.String(length=100), nullable=False, server_default='AI_GUARDRAIL'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendance_anomalies_employee_id'), 'attendance_anomalies', ['employee_id'], unique=False)
    op.create_index(op.f('ix_attendance_anomalies_id'), 'attendance_anomalies', ['id'], unique=False)

    # 15. workforce_metrics
    op.create_table(
        'workforce_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric_date', sa.Date(), nullable=False),
        sa.Column('total_employees', sa.Integer(), nullable=False),
        sa.Column('attendance_rate', sa.Float(), nullable=False),
        sa.Column('late_rate', sa.Float(), nullable=False),
        sa.Column('leave_rate', sa.Float(), nullable=False),
        sa.Column('turnover_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('department_breakdown_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workforce_metrics_id'), 'workforce_metrics', ['id'], unique=False)
    op.create_index(op.f('ix_workforce_metrics_metric_date'), 'workforce_metrics', ['metric_date'], unique=False)

    # 16. policies
    op.create_table(
        'policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('version', sa.String(length=20), nullable=False, server_default='1.0'),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_policies_id'), 'policies', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('policies')
    op.drop_table('workforce_metrics')
    op.drop_table('attendance_anomalies')
    op.drop_table('ai_insights')
    op.drop_table('ai_events')
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('documents')
    op.drop_table('payroll')
    op.drop_table('leave_balances')
    op.drop_table('leave_requests')
    op.drop_table('leave_types')
    op.drop_table('attendance')
    op.drop_table('employees')
    op.drop_table('departments')
    op.drop_table('users')

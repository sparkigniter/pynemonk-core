-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add Notices & Communication Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure announcements table is created
CREATE TABLE IF NOT EXISTS school.announcement (
    id           serial        NOT NULL,
    tenant_id    int           NOT NULL REFERENCES auth.tenant(id),
    classroom_id int           REFERENCES school.classroom(id),  -- NULL = school-wide
    title        varchar(200)  NOT NULL,
    content      text          NOT NULL,
    published_by int           NOT NULL REFERENCES school.staff(id),
    publish_date DATE          NOT NULL DEFAULT CURRENT_DATE,
    expiry_date  DATE,
    is_deleted   BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_tenant ON school.announcement (tenant_id, publish_date) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Communication Ticket (parent queries & teacher complaints)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.communication_ticket (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    student_id      int           NOT NULL REFERENCES school.student(id),
    teacher_id      int           NOT NULL REFERENCES school.staff(id),
    guardian_id     int           NOT NULL REFERENCES school.guardian(id),
    title           varchar(255)  NOT NULL,
    type            varchar(20)   NOT NULL CHECK (type IN ('complaint', 'query')),
    status          varchar(20)   NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    category        varchar(50)   NOT NULL DEFAULT 'general' CHECK (category IN ('academic', 'behavioral', 'attendance', 'general')),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_comm_ticket_tenant ON school.communication_ticket (tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comm_ticket_student ON school.communication_ticket (student_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comm_ticket_teacher ON school.communication_ticket (teacher_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comm_ticket_guardian ON school.communication_ticket (guardian_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Communication Message (threaded discussions)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.communication_message (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    ticket_id       int           NOT NULL REFERENCES school.communication_ticket(id) ON DELETE CASCADE,
    sender_id       int           NOT NULL REFERENCES auth.user(id),
    message         text          NOT NULL,
    attachment_url  varchar(500),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_comm_message_ticket ON school.communication_message (ticket_id) WHERE is_deleted = FALSE;

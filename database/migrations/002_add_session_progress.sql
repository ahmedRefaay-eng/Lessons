-- Migration 002: Session progress tracking
-- Tracks which sessions each student has completed.

CREATE TABLE IF NOT EXISTS session_progress (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id   INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_session_progress_user_id    ON session_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_session_id ON session_progress(session_id);

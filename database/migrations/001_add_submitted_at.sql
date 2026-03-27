-- Migration 001: Add submitted_at to exam_access
-- Prevents students from submitting an exam more than once.
-- Safe to run on existing databases (uses IF NOT EXISTS / idempotent ALTER).

ALTER TABLE exam_access
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_exam_access_submitted_at
  ON exam_access(submitted_at)
  WHERE submitted_at IS NOT NULL;

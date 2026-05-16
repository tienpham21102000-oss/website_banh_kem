-- Migration: 004-users-meta.sql
-- Description: Add meta JSONB column to users for storing OAuth provider metadata (FB avatar, name, etc.)

ALTER TABLE users ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT NULL;

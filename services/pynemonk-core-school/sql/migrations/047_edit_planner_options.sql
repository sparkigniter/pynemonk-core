-- Migration: 047_edit_planner_options.sql
-- Description: Add columns to support editing planned session details and custom ordering

ALTER TABLE school.planned_session 
ADD COLUMN IF NOT EXISTS custom_topic_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS sequence_order INT DEFAULT 0;

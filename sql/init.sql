
CREATE EXTENSION IF NOT EXISTS citext; 

CREATE DATABASE pynemonk_core;

\c pynemonk_core;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE pynemonk_core.auth.user (
    id int NOT NULL, 
    email citext NOT NULL,
    role_id int NOT NULL, 
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
  
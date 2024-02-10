CREATE DATABASE pynemonk_core;

\c pynemonk_core;

CREATE EXTENSION IF NOT EXISTS citext; 

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE pynemonk_core.auth.client (
    id serial NOT NULL,
    name varchar NOT NULL,
    description text,
    client_id varchar NOT NULL,
    client_secret varchar NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id) 
);

CREATE TABLE pynemonk_core.auth.scope (
    id serial NOT NULL,
    value varchar NOT NULL,
    description text,
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id) 
);

CREATE TABLE pynemonk_core.auth.claim (
    id serial NOT NULL,
    value varchar NOT NULL,
    description text,
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id) 
);

CREATE TABLE pynemonk_core.auth.client_scope (
    id serial NOT NULL,
    client_id int NOT NULL,
    scope_id int NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id) 
);

CREATE TABLE pynemonk_core.auth.client_claim (
    id serial NOT NULL,
    client_id int NOT NULL,
    claim_id int NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id) 
);

CREATE TABLE pynemonk_core.auth.role (
    id serial NOT NULL, 
    name int NOT NULL,
    description text,
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
); 

CREATE TABLE pynemonk_core.auth.user (
    id serial NOT NULL, 
    email citext NOT NULL,
    role_id int NOT NULL, 
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_role_id_ref_role_id FOREIGN KEY (role_id) REFERENCES pynemonk_core.auth.role(id)
);

CREATE TABLE pynemonk_core.auth.user_profile (
    id serial NOT NULL, 
    user_id int NOT NULL,
    first_name varchar,
    last_name varchar,
    phone varchar, 
    date_of_birth DATE, 
    is_deleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    CONSTRAINT fk_user_profile_user_id_ref_user_id FOREIGN KEY (user_id) REFERENCES pynemonk_core.auth.user(id)
);

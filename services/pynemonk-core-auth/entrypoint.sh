#!/bin/sh
# entrypoint.sh — waits for Postgres to be ready then starts the app.
# Used as the Docker ENTRYPOINT so the app never tries to connect before the DB is up.

set -e

PG_HOST="${PGHOST:-postgres}"
PG_PORT="${PGPORT:-5432}"
PG_USER="${PGUSER:-postgres}"

echo "[entrypoint] Waiting for Postgres at ${PG_HOST}:${PG_PORT}..."

# Poll until pg_isready succeeds (max 60 seconds)
MAX=60
i=0
until pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -q; do
  i=$((i + 1))
  if [ "$i" -ge "$MAX" ]; then
    echo "[entrypoint] Postgres did not become ready in ${MAX}s. Aborting."
    exit 1
  fi
  echo "[entrypoint] Still waiting... (${i}/${MAX})"
  sleep 1
done

echo "[entrypoint] Postgres is ready. Starting application on PORT=${PORT}..."
exec npm start

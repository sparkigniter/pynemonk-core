FROM node:18.16.0-alpine3.17

# Install postgresql-client so pg_isready is available in the entrypoint
RUN apk add --no-cache postgresql-client

RUN mkdir -p /opt/app
WORKDIR /opt/app

# Dependencies first (better layer caching)
COPY package.json package-lock.json ./
COPY tsconfig.json ./
RUN npm install

# Application source
COPY src/ ./src/

# Compile TypeScript → dist/
RUN npm run build

# SQL migrations (mounted into docker-entrypoint-initdb.d via compose, but
# we copy them here too so the image is self-contained for reference)
RUN mkdir -p sql
COPY sql/ ./sql/

# Entrypoint script (waits for Postgres to be ready before starting)
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]

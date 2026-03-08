
import secrets
import string
import re
import hmac
import hashlib
import base64
import json
import time

def generate_secret(length=32):
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))

def generate_jwt_secret():
    return secrets.token_hex(32)

def base64url_encode(input_str):
    return base64.urlsafe_b64encode(input_str).replace(b'=', b'').decode('utf-8')

def generate_jwt(payload, secret):
    header = {"alg": "HS256", "typ": "JWT"}
    header_enc = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_enc = base64url_encode(json.dumps(payload).encode('utf-8'))
    msg = f"{header_enc}.{payload_enc}"
    signature = hmac.new(secret.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).digest()
    signature_enc = base64url_encode(signature)
    return f"{msg}.{signature_enc}"

# --- TEMPLATES (Embedded to avoid file reading issues) ---

ENV_TEMPLATE = """# --- CONFIGURAÇÃO BÁSICA ---
POSTGRES_PASSWORD=ChangeMe123!
API_EXTERNAL_URL=http://76.13.171.93:8000
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=ChangeMe123!

# --- SEGREDOS CRÍTICOS ---
JWT_SECRET=8d39aec5f05a07e3c75a6097df175d88a84dd9576a91d4e8d38aabf0c7ddcc67
SECRET_KEY_BASE=definitely-change-this-in-prod-32-chars-long
VAULT_ENC_KEY=definitely-change-this-in-prod-32-chars-long
PG_META_CRYPTO_KEY=definitely-change-this-in-prod-32-chars-long

# --- CHAVES JWT PADRÃO ---
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwMzU3ODM3LCJleHAiOjIwODU3MTc4Mzd9.N_P_5I3YPDgMen317bTz8393qVIrYJQi_NuYJsBWF7s
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzAzNTc4MzcsImV4cCI6MjA4NTcxNzgzN30.cNDlMtf-mwu372JqfHpa6OurDQmK9cyOm_QSgiQ8q-4

# --- SERVIÇOS ---
DB_PORT=5432
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_HOST=db
STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
POOLER_PROXY_PORT_TRANSACTION=6543

# --- VARIÁVEIS DE SISTEMA ---
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
SITE_URL=http://76.13.171.93:3000
SUPABASE_PUBLIC_URL=http://76.13.171.93:8000

# --- LOGFLARE & ANALYTICS ---
LOGFLARE_PUBLIC_ACCESS_TOKEN=YOUR_SUPER_SECRET_TOKEN
LOGFLARE_PRIVATE_ACCESS_TOKEN=YOUR_SUPER_SECRET_TOKEN
JWT_EXPIRY=3600
PGRST_DB_SCHEMAS=public,storage,graphql_public
IMGPROXY_ENABLE_WEBP_DETECTION=true
FUNCTIONS_VERIFY_JWT=false

# --- POOLER & KONG ---
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_DB_POOL_SIZE=20
POOLER_TENANT_ID=tenant_id
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# --- EMAIL ---
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=password
SMTP_SENDER_NAME=Admin
MAILER_URLPATHS_INVITE=http://76.13.171.93:3000/auth/callback
MAILER_URLPATHS_CONFIRMATION=http://76.13.171.93:3000/auth/callback
MAILER_URLPATHS_RECOVERY=http://76.13.171.93:3000/auth/callback
MAILER_URLPATHS_EMAIL_CHANGE=http://76.13.171.93:3000/auth/callback
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_ANONYMOUS_USERS=false
DISABLE_SIGNUP=false
ADDITIONAL_REDIRECT_URLS=
"""

DOCKER_TEMPLATE = """
# Usage
#   Start:              docker compose up
#   Stop:               docker compose down
#   Destroy:            docker compose down -v --remove-orphans

name: ig-imports

services:

  studio:
    container_name: supabase-studio
    image: supabase/studio:2026.01.27-sha-6aa59ff
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://studio:3000/api/platform/profile').then((r) => {if (r.status !== 200) throw new Error(r.status)})"
        ]
      timeout: 10s
      interval: 5s
      retries: 3
    depends_on:
      analytics:
        condition: service_healthy
    ports:
      - ${STUDIO_PORT}:3000
    environment:
      HOSTNAME: "::"
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PORT: ${POSTGRES_PORT}
      POSTGRES_HOST: ${POSTGRES_HOST}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PG_META_CRYPTO_KEY: ${PG_META_CRYPTO_KEY}
      DEFAULT_ORGANIZATION_NAME: ${STUDIO_DEFAULT_ORGANIZATION}
      DEFAULT_PROJECT_NAME: ${STUDIO_DEFAULT_PROJECT}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      SUPABASE_URL: http://kong:8000
      SUPABASE_PUBLIC_URL: ${SUPABASE_PUBLIC_URL}
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
      AUTH_JWT_SECRET: ${JWT_SECRET}
      LOGFLARE_API_KEY: ${LOGFLARE_PUBLIC_ACCESS_TOKEN}
      LOGFLARE_PUBLIC_ACCESS_TOKEN: ${LOGFLARE_PUBLIC_ACCESS_TOKEN}
      LOGFLARE_PRIVATE_ACCESS_TOKEN: ${LOGFLARE_PRIVATE_ACCESS_TOKEN}
      LOGFLARE_URL: http://analytics:4000
      NEXT_PUBLIC_ENABLE_LOGS: true
      NEXT_ANALYTICS_BACKEND_PROVIDER: postgres
      SNIPPETS_MANAGEMENT_FOLDER: /app/snippets
      EDGE_FUNCTIONS_MANAGEMENT_FOLDER: /app/edge-functions
    volumes:
      - ./volumes/snippets:/app/snippets:Z
      - ./volumes/functions:/app/edge-functions:Z

  kong:
    container_name: supabase-kong
    image: kong:2.8.1
    restart: unless-stopped
    ports:
      - ${KONG_HTTP_PORT}:8000/tcp
      - ${KONG_HTTPS_PORT}:8443/tcp
    volumes:
      - ./volumes/api/kong.yml:/home/kong/temp.yml:ro,z
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /home/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth,request-termination,ip-restriction
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64 160k
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
      DASHBOARD_USERNAME: ${DASHBOARD_USERNAME}
      DASHBOARD_PASSWORD: ${DASHBOARD_PASSWORD}
    entrypoint: bash -c 'eval "echo \\"$$(cat ~/temp.yml)\\"" > ~/kong.yml && /docker-entrypoint.sh kong docker-start'

  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.185.0
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:9999/health"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: ${API_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: ${ADDITIONAL_REDIRECT_URLS}
      GOTRUE_DISABLE_SIGNUP: ${DISABLE_SIGNUP}
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: ${JWT_EXPIRY}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: ${ENABLE_EMAIL_SIGNUP}
      GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED: ${ENABLE_ANONYMOUS_USERS}
      GOTRUE_MAILER_AUTOCONFIRM: ${ENABLE_EMAIL_AUTOCONFIRM}
      GOTRUE_SMTP_ADMIN_EMAIL: ${SMTP_ADMIN_EMAIL}
      GOTRUE_SMTP_HOST: ${SMTP_HOST}
      GOTRUE_SMTP_PORT: ${SMTP_PORT}
      GOTRUE_SMTP_USER: ${SMTP_USER}
      GOTRUE_SMTP_PASS: ${SMTP_PASS}
      GOTRUE_SMTP_SENDER_NAME: ${SMTP_SENDER_NAME}
      GOTRUE_MAILER_URLPATHS_INVITE: ${MAILER_URLPATHS_INVITE}
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: ${MAILER_URLPATHS_CONFIRMATION}
      GOTRUE_MAILER_URLPATHS_RECOVERY: ${MAILER_URLPATHS_RECOVERY}
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: ${MAILER_URLPATHS_EMAIL_CHANGE}
      GOTRUE_EXTERNAL_PHONE_ENABLED: ${ENABLE_PHONE_SIGNUP}
      GOTRUE_SMS_AUTOCONFIRM: ${ENABLE_PHONE_AUTOCONFIRM}

  rest:
    container_name: supabase-rest
    image: postgrest/postgrest:v14.3
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      PGRST_DB_SCHEMAS: ${PGRST_DB_SCHEMAS}
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
      PGRST_APP_SETTINGS_JWT_SECRET: ${JWT_SECRET}
      PGRST_APP_SETTINGS_JWT_EXP: ${JWT_EXPIRY}
    command:
      [
        "postgrest"
      ]

  realtime:
    container_name: realtime-dev.supabase-realtime
    image: supabase/realtime:v2.72.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "curl -sSfL --head -o /dev/null -H \\"Authorization: Bearer ${ANON_KEY}\\" http://localhost:4000/api/tenants/realtime-dev/health"
        ]
      timeout: 5s
      interval: 30s
      retries: 3
    environment:
      PORT: 4000
      DB_HOST: ${POSTGRES_HOST}
      DB_PORT: ${POSTGRES_PORT}
      DB_USER: supabase_admin
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'
      DB_ENC_KEY: supabaserealtime
      API_JWT_SECRET: ${JWT_SECRET}
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      ERL_AFLAGS: -proto_dist inet_tcp
      DNS_NODES: "''"
      RLIMIT_NOFILE: "10000"
      APP_NAME: realtime
      SEED_SELF_HOST: "true"
      RUN_JANITOR: "true"
      DISABLE_HEALTHCHECK_LOGGING: "true"

  storage:
    container_name: supabase-storage
    image: supabase/storage-api:v1.37.1
    restart: unless-stopped
    volumes:
      - ./volumes/storage:/var/lib/storage:z
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://storage:5000/status"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    depends_on:
      db:
        condition: service_healthy
      rest:
        condition: service_started
      imgproxy:
        condition: service_started
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      REQUEST_ALLOW_X_FORWARDED_PATH: "true"
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub
      ENABLE_IMAGE_TRANSFORMATION: "true"
      IMGPROXY_URL: http://imgproxy:5001

  imgproxy:
    container_name: supabase-imgproxy
    image: darthsim/imgproxy:v3.30.1
    restart: unless-stopped
    volumes:
      - ./volumes/storage:/var/lib/storage:z
    healthcheck:
      test:
        [
          "CMD",
          "imgproxy",
          "health"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    environment:
      IMGPROXY_BIND: ":5001"
      IMGPROXY_LOCAL_FILESYSTEM_ROOT: /
      IMGPROXY_USE_ETAG: "true"
      IMGPROXY_ENABLE_WEBP_DETECTION: ${IMGPROXY_ENABLE_WEBP_DETECTION}
      IMGPROXY_MAX_SRC_RESOLUTION: 16.8

  meta:
    container_name: supabase-meta
    image: supabase/postgres-meta:v0.95.2
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: ${POSTGRES_HOST}
      PG_META_DB_PORT: ${POSTGRES_PORT}
      PG_META_DB_NAME: ${POSTGRES_DB}
      PG_META_DB_USER: supabase_admin
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}
      CRYPTO_KEY: ${PG_META_CRYPTO_KEY}

  functions:
    container_name: supabase-edge-functions
    image: supabase/edge-runtime:v1.70.0
    restart: unless-stopped
    volumes:
      - ./volumes/functions:/home/deno/functions:Z
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      JWT_SECRET: ${JWT_SECRET}
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY}
      SUPABASE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      VERIFY_JWT: "${FUNCTIONS_VERIFY_JWT}"
    command:
      [
        "start",
        "--main-service",
        "/home/deno/functions/main"
      ]

  analytics:
    container_name: supabase-analytics
    image: supabase/logflare:1.30.3
    restart: unless-stopped
    ports:
      - 4001:4000
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "http://localhost:4000/health"
        ]
      timeout: 5s
      interval: 5s
      retries: 10
    depends_on:
      db:
        condition: service_healthy
    environment:
      LOGFLARE_NODE_HOST: 127.0.0.1
      DB_USERNAME: supabase_admin
      DB_DATABASE: _supabase
      DB_HOSTNAME: ${POSTGRES_HOST}
      DB_PORT: ${POSTGRES_PORT}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_SCHEMA: _analytics
      LOGFLARE_PUBLIC_ACCESS_TOKEN: ${LOGFLARE_PUBLIC_ACCESS_TOKEN}
      LOGFLARE_PRIVATE_ACCESS_TOKEN: ${LOGFLARE_PRIVATE_ACCESS_TOKEN}
      LOGFLARE_SINGLE_TENANT: true
      LOGFLARE_SUPABASE_MODE: true
      POSTGRES_BACKEND_URL: postgresql://supabase_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/_supabase
      POSTGRES_BACKEND_SCHEMA: _analytics
      LOGFLARE_FEATURE_FLAG_OVERRIDE: multibackend=true

  db:
    container_name: supabase-db
    image: supabase/postgres:15.8.1.085
    restart: unless-stopped
    volumes:
      - ./volumes/db/realtime.sql:/docker-entrypoint-initdb.d/migrations/99-realtime.sql:Z
      - ./volumes/db/webhooks.sql:/docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql:Z
      - ./volumes/db/roles.sql:/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:Z
      - ./volumes/db/jwt.sql:/docker-entrypoint-initdb.d/init-scripts/99-jwt.sql:Z
      - ./volumes/db/data:/var/lib/postgresql/data:Z
      - ./volumes/db/_supabase.sql:/docker-entrypoint-initdb.d/migrations/97-_supabase.sql:Z
      - ./volumes/db/logs.sql:/docker-entrypoint-initdb.d/migrations/99-logs.sql:Z
      - ./volumes/db/pooler.sql:/docker-entrypoint-initdb.d/migrations/99-pooler.sql:Z
      - db-config:/etc/postgresql-custom
    healthcheck:
      test:
        [
        "CMD",
        "pg_isready",
        "-U",
        "postgres",
        "-h",
        "localhost"
        ]
      interval: 5s
      timeout: 5s
      retries: 10
    depends_on:
      vector:
        condition: service_healthy
    environment:
      POSTGRES_HOST: /var/run/postgresql
      PGPORT: ${POSTGRES_PORT}
      POSTGRES_PORT: ${POSTGRES_PORT}
      PGPASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGDATABASE: ${POSTGRES_DB}
      POSTGRES_DB: ${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXP: ${JWT_EXPIRY}
    command:
      [
        "postgres",
        "-c",
        "config_file=/etc/postgresql/postgresql.conf",
        "-c",
        "log_min_messages=fatal"
      ]

  vector:
    container_name: supabase-vector
    image: timberio/vector:0.28.1-alpine
    restart: unless-stopped
    volumes:
      - ./volumes/logs/vector.yml:/etc/vector/vector.yml:ro,z
      - ${DOCKER_SOCKET_LOCATION}:/var/run/docker.sock:ro,z
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://vector:9001/health"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    environment:
      LOGFLARE_PUBLIC_ACCESS_TOKEN: ${LOGFLARE_PUBLIC_ACCESS_TOKEN}
    command:
      [
        "--config",
        "/etc/vector/vector.yml"
      ]
    security_opt:
      - "label=disable"

  supavisor:
    container_name: supabase-pooler
    image: supabase/supavisor:2.7.4
    restart: unless-stopped
    ports:
      - ${POSTGRES_PORT}:5432
      - ${POOLER_PROXY_PORT_TRANSACTION}:6543
    volumes:
      - ./volumes/pooler/pooler.exs:/etc/pooler/pooler.exs:ro,z
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "-sSfL",
          "--head",
          "-o",
          "/dev/null",
          "http://127.0.0.1:4000/api/health"
        ]
      interval: 10s
      timeout: 5s
      retries: 5
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    environment:
      PORT: 4000
      POSTGRES_PORT: ${POSTGRES_PORT}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASE_URL: ecto://supabase_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/_supabase
      CLUSTER_POSTGRES: true
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      VAULT_ENC_KEY: ${VAULT_ENC_KEY}
      API_JWT_SECRET: ${JWT_SECRET}
      METRICS_JWT_SECRET: ${JWT_SECRET}
      REGION: local
      ERL_AFLAGS: -proto_dist inet_tcp
      POOLER_TENANT_ID: ${POOLER_TENANT_ID}
      POOLER_DEFAULT_POOL_SIZE: ${POOLER_DEFAULT_POOL_SIZE}
      POOLER_MAX_CLIENT_CONN: ${POOLER_MAX_CLIENT_CONN}
      POOLER_POOL_MODE: transaction
      DB_POOL_SIZE: ${POOLER_DB_POOL_SIZE}
    command:
      [
        "/bin/sh",
        "-c",
        "/app/bin/migrate && /app/bin/supavisor eval \\"$$(cat /etc/pooler/pooler.exs)\\" && /app/bin/server"
      ]

volumes:
  db-config:

"""

# --- SCRIPT LOGIC ---

# Generate credentials
postgres_password = generate_secret(20) + "!"
new_jwt_secret = generate_jwt_secret()

# Determine timestamps
current_ts = int(time.time())
exp_ts = current_ts + 315360000

# Create payloads
anon_payload = {"role": "anon", "iss": "supabase", "iat": current_ts, "exp": exp_ts}
service_payload = {"role": "service_role", "iss": "supabase", "iat": current_ts, "exp": exp_ts}

# Sign tokens
new_anon_key = generate_jwt(anon_payload, new_jwt_secret)
new_service_key = generate_jwt(service_payload, new_jwt_secret)

# 1. Process ENV
env_content = ENV_TEMPLATE
replacements = {
    r'POSTGRES_PASSWORD=.*': f'POSTGRES_PASSWORD={postgres_password}',
    r'JWT_SECRET=.*': f'JWT_SECRET={new_jwt_secret}',
    r'ANON_KEY=.*': f'ANON_KEY={new_anon_key}',
    r'SERVICE_ROLE_KEY=.*': f'SERVICE_ROLE_KEY={new_service_key}',
    r'API_EXTERNAL_URL=.*': 'API_EXTERNAL_URL=http://76.13.171.93:8001',
    r'SUPABASE_PUBLIC_URL=.*': 'SUPABASE_PUBLIC_URL=http://76.13.171.93:8001',
    r'SITE_URL=.*': 'SITE_URL=http://76.13.171.93:3001',
    r'POSTGRES_PORT=.*': 'POSTGRES_PORT=5433',
    r'DB_PORT=.*': 'DB_PORT=5433',
    r'KONG_HTTP_PORT=.*': 'KONG_HTTP_PORT=8001',
    r'KONG_HTTPS_PORT=.*': 'KONG_HTTPS_PORT=8444',
    r'STUDIO_PORT=.*': 'STUDIO_PORT=3001',
    r'PGRST_DB_SCHEMAS=.*': 'PGRST_DB_SCHEMAS=public,storage,graphql_public',
}

for pattern, repl in replacements.items():
    env_content = re.sub(pattern, repl, env_content)

# 2. Process Docker Compose
docker_compose = DOCKER_TEMPLATE

# Rename containers
docker_compose = docker_compose.replace('container_name: supabase-', 'container_name: ig-imports-')
docker_compose = docker_compose.replace('container_name: realtime-dev.supabase-realtime', 'container_name: ig-imports-realtime')

# Write outputs
with open('ig-imports.env', 'w', encoding='utf-8') as f:
    f.write(env_content)

with open('ig-imports-docker-compose.yml', 'w', encoding='utf-8') as f:
    f.write(docker_compose)

print("Configuration generated successfully!")

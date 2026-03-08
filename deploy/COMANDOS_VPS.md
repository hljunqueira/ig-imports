# Comandos para Configurar VPS - IG Imports

## Estrutura de Projetos

```
/opt/
├── ig-imports-database/     # PostgreSQL + Studio
│   ├── docker-compose.yml
│   ├── .env
│   └── volumes/
│       └── db/
│           └── data/
│
└── ig-imports-api/          # Backend Node.js
    ├── docker-compose.yml
    ├── .env
    └── backend/
        ├── Dockerfile
        ├── package.json
        └── src/
```

## PORTAS

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| PostgreSQL | 5432 | Banco de dados |
| Studio | 3002 | Interface admin do banco |
| Backend API | 3001 | API REST Node.js |

---

## PASSO 1: Preparar Diretórios na VPS

```bash
# Conectar na VPS
ssh root@76.13.171.93

# Criar diretórios
mkdir -p /opt/ig-imports-database/volumes/db/data
mkdir -p /opt/ig-imports-api

# Verificar diretórios criados
ls -la /opt/
```

---

## PASSO 2: Configurar Database (ig-imports-database)

```bash
cd /opt/ig-imports-database

# Criar arquivo .env
cat > .env << 'EOF'
POSTGRES_DB=igimports_db
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
POSTGRES_PORT=5432
JWT_SECRET=SUA_CHAVE_JWT_32_CHARS_MINIMO
JWT_EXPIRY=604800
STUDIO_PORT=3002
STUDIO_DEFAULT_ORGANIZATION=IG Imports
STUDIO_DEFAULT_PROJECT=Production
PG_META_CRYPTO_KEY=SUA_CHAVE_CRYPTO_AQUI
EOF

# Verificar .env
cat .env
```

---

## PASSO 3: Subir Database

```bash
cd /opt/ig-imports-database

# Subir serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Verificar containers rodando
docker ps

# Testar conexão PostgreSQL
docker exec igimports-db pg_isready -U postgres
```

---

## PASSO 4: Copiar Backend para VPS

**No seu computador local:**

```bash
# Compactar backend
cd "c:\Users\Henrique - PC\Desktop\Projetos Dev\ig-imports"
tar -czvf backend.tar.gz backend/

# Enviar para VPS
scp backend.tar.gz root@76.13.171.93:/opt/ig-imports-api/
```

**Na VPS:**

```bash
cd /opt/ig-imports-api

# Extrair
tar -xzvf backend.tar.gz

# Verificar
ls -la backend/
```

---

## PASSO 5: Configurar API (ig-imports-api)

```bash
cd /opt/ig-imports-api

# Criar arquivo .env
cat > .env << 'EOF'
BACKEND_PORT=3001
DB_HOST=76.13.171.93
DB_PORT=5432
DB_NAME=igimports_db
DB_USER=postgres
DB_PASSWORD=MESMA_SENHA_DO_DATABASE
JWT_SECRET=MESMA_CHAVE_JWT_DO_DATABASE
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,https://igimports.com.br
EOF

# Verificar .env
cat .env
```

---

## PASSO 6: Subir API

```bash
cd /opt/ig-imports-api

# Criar network (se não existir)
docker network create igimports-network

# Subir serviço
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Verificar containers
docker ps
```

---

## PASSO 7: Verificar Funcionamento

```bash
# Testar Database
docker exec igimports-db pg_isready -U postgres

# Testar API
curl http://localhost:3001/health

# Testar endpoint de auth
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@igimports.com","password":"admin123"}'
```

---

## COMANDOS ÚTEIS

```bash
# Ver logs database
docker logs -f igimports-db

# Ver logs API
docker logs -f igimports-api

# Restart database
docker-compose -f /opt/ig-imports-database/docker-compose.yml restart

# Restart API
docker-compose -f /opt/ig-imports-api/docker-compose.yml restart

# Parar tudo
docker-compose -f /opt/ig-imports-database/docker-compose.yml down
docker-compose -f /opt/ig-imports-api/docker-compose.yml down

# Entrar no banco de dados
docker exec -it igimports-db psql -U postgres -d igimports_db

# Listar networks
docker network ls

# Inspecionar network
docker network inspect igimports-network
```

---

## GERAR SENHAS SEGURAS

```bash
# Senha PostgreSQL (32 caracteres)
openssl rand -base64 32

# JWT Secret (48 caracteres)
openssl rand -base64 48

# Crypto Key (32 caracteres)
openssl rand -base64 32
```

---

## URLs DE ACESSO

| Serviço | URL |
|---------|-----|
| Studio (DB Admin) | http://76.13.171.93:3002 |
| API Backend | http://76.13.171.93:3001 |
| PostgreSQL | 76.13.171.93:5432 |

---

## TROUBLESHOOTING

```bash
# Se API não conecta no DB
# Verificar se DB_HOST está correto
docker exec igimports-api ping igimports-db

# Verificar variáveis de ambiente
docker exec igimports-api env | grep DB_

# Resetar tudo (CUIDADO: apaga dados!)
docker-compose -f /opt/ig-imports-database/docker-compose.yml down -v
docker-compose -f /opt/ig-imports-api/docker-compose.yml down -v
```

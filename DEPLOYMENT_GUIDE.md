# IG Imports - Guia de Implantação Segura

## ⚠️ Checklist de Segurança

Antes de implantar em produção, verifique:

- [ ] Arquivos `.env` estão no `.gitignore`
- [ ] Nenhuma credencial hardcoded no código
- [ ] Senhas fortes geradas para produção
- [ ] JWT_SECRET e chaves criptográficas únicas
- [ ] HTTPS habilitado
- [ ] CORS configurado corretamente
- [ ] RLS (Row Level Security) ativado

## 1. Configuração do Ambiente

### 1.1 Criar arquivo de ambiente

```bash
# Copie o arquivo de exemplo
cp supabase_env.example .env

# Edite com suas credenciais de produção
nano .env
```

### 1.2 Gerar segredos seguros

```bash
# JWT_SECRET (32 bytes hex)
openssl rand -hex 32

# SECRET_KEY_BASE (para Elixir/Phoenix)
mix phx.gen.secret

# Ou use Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 1.3 Gerar chaves JWT

Acesse: https://supabase.com/docs/guides/self-hosting#api-keys

Ou use o script em Python:
```python
import jwt
import datetime

payload = {
    "role": "anon",
    "iss": "supabase",
    "iat": datetime.datetime.utcnow(),
    "exp": datetime.datetime.utcnow() + datetime.timedelta(days=365*10)
}
token = jwt.encode(payload, "your-jwt-secret", algorithm="HS256")
print(token)
```

## 2. Configuração do Frontend

### 2.1 Criar .env.local

```bash
# No diretório do frontend
cp .env.example .env.local

# Edite com valores de produção
VITE_SUPABASE_URL=https://your-domain.com
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WHATSAPP_NUMBER=5511999999999
```

### 2.2 Build de produção

```bash
npm install
npm run build
```

## 3. Configuração do Banco de Dados

### 3.1 Criar schema limpo

```bash
# Conecte ao PostgreSQL
psql -h your-server -U postgres -d postgres

# Execute o schema
\i supabase/schema_production.sql
```

### 3.2 Inserir dados essenciais

```bash
\i supabase/seed_production.sql
```

### 3.3 Criar usuário admin

1. Acesse o Supabase Studio: `http://your-server:3000`
2. Vá em Authentication → Users
3. Crie um novo usuário com email e senha
4. Copie o UUID do usuário
5. Execute:

```sql
INSERT INTO admin_profiles (id, full_name, role)
VALUES ('USER_UUID_AQUI', 'Administrator', 'super_admin');
```

## 4. Docker (Self-Hosted)

### 4.1 Iniciar serviços

```bash
docker compose -f ig-imports-docker-compose.yml up -d
```

### 4.2 Verificar logs

```bash
docker logs -f ig-imports-db
docker logs -f ig-imports-auth
docker logs -f ig-imports-kong
```

## 5. Verificação Pós-Implantação

### 5.1 Testar API

```bash
curl -X POST http://your-server:8001/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

### 5.2 Verificar RLS

```sql
-- Deve retornar apenas categorias ativas (como usuário anônimo)
SELECT * FROM categories;
```

## 6. Manutenção

### Backup do banco

```bash
docker exec ig-imports-db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
```

### Atualização

```bash
docker compose -f ig-imports-docker-compose.yml pull
docker compose -f ig-imports-docker-compose.yml up -d
```

## Suporte

Em caso de problemas, verifique:
1. Logs dos containers: `docker logs <container-name>`
2. Conectividade: `curl http://your-server:8001/rest/v1/`
3. Permissões do banco: `\dp` no psql

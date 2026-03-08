#!/bin/bash
# Script de atualização do backend na VPS

echo "=== Atualizando Backend IG Imports ==="

# Parar o container atual
cd /opt/ig-imports
docker-compose down

# Backup do banco de dados (opcional mas recomendado)
echo "Criando backup do banco..."
docker exec ig-imports-db pg_dump -U postgres ig_imports > backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo "Backup ignorado - container pode estar parado"

# Atualizar o código do backend
echo "Atualizando código do backend..."
cd /opt/ig-imports/backend

# Pull das últimas alterações (se estiver usando git)
# git pull origin main

# Ou copiar os arquivos manualmente
# Os arquivos devem ser copiados para /opt/ig-imports/backend/

# Reconstruir e iniciar os containers
echo "Reconstruindo containers..."
cd /opt/ig-imports
docker-compose up -d --build

# Verificar status
echo "Verificando status..."
sleep 5
docker-compose ps

echo "=== Atualização concluída ==="
echo "Logs: docker-compose logs -f api"

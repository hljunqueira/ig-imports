# Script de deploy do backend para VPS
# Executa os comandos via SSH na VPS

$VPS_HOST = "76.13.171.93"
$VPS_USER = "root"
$DEPLOY_DIR = "/opt/ig-imports-api"

Write-Host "=== DEPLOY BACKEND IG IMPORTS ===" -ForegroundColor Green
Write-Host "VPS: $VPS_HOST" -ForegroundColor Cyan
Write-Host ""

# Comandos a serem executados na VPS
$commands = @"
cd $DEPLOY_DIR
echo "=== Pull latest code ==="
git pull origin main
echo "=== Rebuild and restart containers ==="
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "=== Clean up ==="
docker system prune -f
echo "=== Status ==="
docker-compose ps
echo "=== Deploy completed ==="
"@

Write-Host "Executando deploy na VPS..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" $commands

Write-Host ""
Write-Host "=== DEPLOY CONCLUIDO ===" -ForegroundColor Green

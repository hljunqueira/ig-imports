# PowerShell Script - Deploy Backend to VPS
# Uso: .\deploy-to-vps.ps1

$VPS_HOST = "76.13.171.93"
$VPS_USER = "root"
$PROJECT_PATH = "C:\Users\Henrique - PC\Desktop\Projetos Dev\ig-imports"

Write-Host "=== Deploy Backend to VPS ===" -ForegroundColor Green
Write-Host "VPS: $VPS_HOST" -ForegroundColor Cyan
Write-Host ""

# Verificar se scp está disponível
if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: scp não encontrado. Instale o OpenSSH ou Git for Windows." -ForegroundColor Red
    exit 1
}

# 1. Copiar arquivos do backend para a VPS
Write-Host "[1/4] Copiando arquivos do backend para VPS..." -ForegroundColor Yellow
$backendPath = Join-Path $PROJECT_PATH "backend"
scp -r "$backendPath\*" "${VPS_USER}@${VPS_HOST}:/opt/ig-imports/backend/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao copiar arquivos. Verifique a conexão SSH." -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] Arquivos copiados com sucesso!" -ForegroundColor Green

# 2. Executar comandos na VPS via SSH
Write-Host "[3/4] Executando deploy na VPS..." -ForegroundColor Yellow
$remoteCommands = @"
cd /opt/ig-imports
echo "Parando containers..."
docker-compose down

echo "Reconstruindo e iniciando..."
docker-compose up -d --build api

echo "Limpando imagens antigas..."
docker image prune -f

echo "Status:"
docker-compose ps
"@

ssh "${VPS_USER}@${VPS_HOST}" $remoteCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao executar comandos na VPS." -ForegroundColor Red
    exit 1
}

Write-Host "[4/4] Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Verifique os logs: ssh ${VPS_USER}@${VPS_HOST} 'docker-compose logs -f api'" -ForegroundColor Cyan
Write-Host "Verifique a saúde: http://${VPS_HOST}:3001/health" -ForegroundColor Cyan

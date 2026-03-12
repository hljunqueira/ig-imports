#!/usr/bin/env node

/**
 * Script de Deploy do Backend IG Imports
 * 
 * Uso: node deploy-backend.js
 * 
 * Este script:
 * 1. Verifica a conexão SSH com a VPS
 * 2. Copia os arquivos do backend via SCP
 * 3. Executa build Docker e reinicia containers
 * 4. Verifica health check da API
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configurações
const CONFIG = {
    VPS_IP: '76.13.171.93',
    VPS_USER: 'root',
    SSH_KEY: path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'ig-imports-deploy'),
    REMOTE_PATH: '/opt/ig-imports-api',
    LOCAL_BACKEND_PATH: path.join(__dirname, 'backend'),
    HEALTH_CHECK_URL: 'https://api.igimports.com.br/health',
    MAX_RETRIES: 5,
    RETRY_DELAY: 3000, // 3 segundos
};

// Cores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
    try {
        return execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options,
        });
    } catch (error) {
        if (options.ignoreError) {
            return error.stdout || '';
        }
        throw error;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Passo 1: Verificar SSH
async function checkSSH() {
    log('\n📡 Verificando conexão SSH...', 'cyan');
    try {
        exec(
            `ssh -i "${CONFIG.SSH_KEY}" -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${CONFIG.VPS_USER}@${CONFIG.VPS_IP} "echo 'SSH OK'"`,
            { silent: true }
        );
        log('✅ Conexão SSH estabelecida!', 'green');
        return true;
    } catch (error) {
        log('❌ Falha na conexão SSH', 'red');
        log('Verifique se:', 'yellow');
        log('  - A chave SSH existe: ' + CONFIG.SSH_KEY, 'yellow');
        log('  - A VPS está acessível: ' + CONFIG.VPS_IP, 'yellow');
        log('  - O usuário tem permissões: ' + CONFIG.VPS_USER, 'yellow');
        return false;
    }
}

// Passo 2: Compilar TypeScript localmente
async function buildLocal() {
    log('\n🔨 Compilando TypeScript localmente...', 'cyan');
    try {
        exec(`cd "${CONFIG.LOCAL_BACKEND_PATH}" && npm run build`, { silent: false });
        log('✅ Compilação concluída!', 'green');
    } catch (error) {
        log('❌ Erro na compilação TypeScript', 'red');
        throw error;
    }
}

// Passo 3: Copiar arquivos
async function copyFiles() {
    log('\n📦 Copiando arquivos do backend...', 'cyan');
    
    // Usar tar para empacotar e enviar tudo de uma vez
    const tarFile = 'backend-deploy.tar.gz';
    const localTarPath = path.join(__dirname, tarFile);
    
    try {
        // Criar arquivo tar.gz com dist/ compilado + package.json + Dockerfile
        log('  Criando pacote de deploy...', 'blue');
        exec(
            `cd "${CONFIG.LOCAL_BACKEND_PATH}" && tar -czf "${localTarPath}" dist package.json package-lock.json Dockerfile`,
            { silent: true }
        );
        
        // Enviar para a VPS
        log('  Enviando pacote para VPS...', 'blue');
        exec(
            `scp -i "${CONFIG.SSH_KEY}" -o StrictHostKeyChecking=no "${localTarPath}" ${CONFIG.VPS_USER}@${CONFIG.VPS_IP}:${CONFIG.REMOTE_PATH}/`,
            { silent: true }
        );
        
        // Extrair na VPS
        log('  Extraindo arquivos na VPS...', 'blue');
        exec(
            `ssh -i "${CONFIG.SSH_KEY}" -o StrictHostKeyChecking=no ${CONFIG.VPS_USER}@${CONFIG.VPS_IP} "cd ${CONFIG.REMOTE_PATH} && tar -xzf ${tarFile} && rm ${tarFile}"`,
            { silent: true }
        );
        
        // Limpar arquivo local
        fs.unlinkSync(localTarPath);
        
    } catch (error) {
        // Limpar arquivo local em caso de erro
        if (fs.existsSync(localTarPath)) {
            fs.unlinkSync(localTarPath);
        }
        log(`❌ Erro ao copiar arquivos`, 'red');
        throw error;
    }
    
    log('✅ Arquivos copiados com sucesso!', 'green');
}

// Passo 3: Build e restart Docker
async function buildAndRestart() {
    log('\n🐳 Executando build Docker e reiniciando containers...', 'cyan');
    
    const commands = [
        'docker compose down',
        'docker compose build --no-cache',
        'docker compose up -d',
        'docker compose ps',
    ];

    const remoteCommand = `cd /opt/ig-imports-api && ${commands.join(' && ')}`;
    
    try {
        exec(
            `ssh -i "${CONFIG.SSH_KEY}" -o StrictHostKeyChecking=no ${CONFIG.VPS_USER}@${CONFIG.VPS_IP} "${remoteCommand}"`,
            { silent: false }
        );
        log('✅ Build e restart concluídos!', 'green');
    } catch (error) {
        log('❌ Erro durante build/restart', 'red');
        throw error;
    }
}

// Passo 4: Health Check
async function healthCheck() {
    log('\n🏥 Verificando saúde da API...', 'cyan');
    
    for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
        try {
            log(`  Tentativa ${i + 1}/${CONFIG.MAX_RETRIES}...`, 'blue');
            
            // Esperar um pouco antes da primeira tentativa
            if (i === 0) {
                await sleep(CONFIG.RETRY_DELAY);
            }
            
            const result = exec(
                `curl -s -o /dev/null -w "%{http_code}" ${CONFIG.HEALTH_CHECK_URL}`,
                { silent: true, ignoreError: true }
            );
            
            if (result.trim() === '200') {
                log('✅ API está saudável!', 'green');
                return true;
            }
        } catch (error) {
            // Ignora erro e tenta novamente
        }
        
        if (i < CONFIG.MAX_RETRIES - 1) {
            log(`  Aguardando ${CONFIG.RETRY_DELAY / 1000}s...`, 'yellow');
            await sleep(CONFIG.RETRY_DELAY);
        }
    }
    
    log('❌ API não respondeu corretamente após várias tentativas', 'red');
    return false;
}

// Função principal
async function main() {
    log('\n' + '='.repeat(60), 'cyan');
    log('🚀 DEPLOY DO BACKEND IG IMPORTS', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const startTime = Date.now();
    
    try {
        // Verificar se o diretório do backend existe
        if (!fs.existsSync(CONFIG.LOCAL_BACKEND_PATH)) {
            log(`❌ Diretório do backend não encontrado: ${CONFIG.LOCAL_BACKEND_PATH}`, 'red');
            process.exit(1);
        }

        // Executar passos
        const sshOk = await checkSSH();
        if (!sshOk) process.exit(1);
        
        await buildLocal();
        await copyFiles();
        await buildAndRestart();
        const healthOk = await healthCheck();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        log('\n' + '='.repeat(60), 'cyan');
        if (healthOk) {
            log(`✅ DEPLOY CONCLUÍDO COM SUCESSO!`, 'green');
            log(`⏱️  Duração: ${duration}s`, 'green');
            log(`🌐 URL: ${CONFIG.HEALTH_CHECK_URL}`, 'green');
        } else {
            log(`⚠️  DEPLOY CONCLUÍDO COM AVISOS`, 'yellow');
            log(`⏱️  Duração: ${duration}s`, 'yellow');
            log(`🌐 Verifique manualmente: ${CONFIG.HEALTH_CHECK_URL}`, 'yellow');
        }
        log('='.repeat(60), 'cyan');
        
    } catch (error) {
        log('\n❌ DEPLOY FALHOU', 'red');
        log(error.message, 'red');
        process.exit(1);
    }
}

// Executar
main();

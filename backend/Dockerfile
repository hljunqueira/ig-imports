# ========================================
# IG Imports Backend - Dockerfile
# Build local (tsc roda na máquina do dev)
# ========================================

FROM node:20-alpine

WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copia o dist/ pré-compilado localmente
COPY dist ./dist

# Cria diretório de uploads
RUN mkdir -p uploads

# Expõe porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Inicia o servidor
CMD ["npm", "start"]

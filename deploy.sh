#!/bin/bash

# Define cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando Script de Deploy SementeToken ===${NC}"

# Função para checar comando
check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    else
        return 0
    fi
}

# 1. Verificar e instalar Docker se necessário
if ! check_command "docker"; then
    echo -e "${RED}Docker não encontrado. Instalando Docker...${NC}"
    apt-get update
    apt-get install -y docker.io
    systemctl start docker
    systemctl enable docker
else
    echo -e "${GREEN}Docker já está instalado.${NC}"
fi

# 2. Verificar e instalar Docker Compose se necessário
# Tenta verificar se o plugin 'docker compose' (v2) funciona
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo -e "${GREEN}Docker Compose (Plugin v2) encontrado.${NC}"
elif check_command "docker-compose"; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}Docker Compose (Standalone v1) encontrado.${NC}"
else
    echo -e "${RED}Docker Compose não encontrado. Instalando...${NC}"
    apt-get update
    apt-get install -y docker-compose
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# 3. Atualizar código do repositório
echo -e "${GREEN}Atualizando repositório Git (Forçando sincronização)...${NC}"
git fetch origin
git reset --hard origin/main

# 4. Derrubar containers antigos (limpeza)
echo -e "${GREEN}Parando containers antigos e liberando portas...${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down --remove-orphans || true

# 5. Subir nova versão
echo -e "${GREEN}Construindo e iniciando containers...${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up --build -d --remove-orphans

# 6. Verificar status
echo -e "${GREEN}Status dos containers:${NC}"
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps

echo -e "${GREEN}=== Deploy Concluído com Sucesso! ===${NC}"
echo "Acesse: http://SEU_IP_OU_DOMINIO"

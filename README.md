# SementeToken 🌱

Plataforma SaaS Full-Stack para reflorestamento digital, tokenização ambiental (Waves Blockchain) e monitoramento com IA.

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura de microserviços containerizada, pronta para escalabilidade.

- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Backend**: NestJS + TypeORM
- **Database**: PostgreSQL + PostGIS (Geospatial Data)
- **AI Service**: Python (FastAPI) para simulação de crescimento e chat
- **Waves Service**: Node.js para integração com Blockchain Waves
- **Cache**: Redis
- **Proxy**: Nginx

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passos
1. Clone o repositório (ou acesse a pasta do projeto):
   ```bash
   cd sementetoken
   ```

2. Suba os containers:
   ```bash
   docker-compose up --build
   ```

3. Acesse os serviços:
   - **Frontend (Web)**: [http://localhost](http://localhost) (via Nginx na porta 80)
   - **Backend API**: [http://localhost/api](http://localhost/api)
   - **Swagger Docs**: [http://localhost/api/api](http://localhost/api/api)
   - **AI Service**: [http://localhost:8000](http://localhost:8000)

## 📂 Estrutura de Pastas

```
sementetoken/
├── backend/          # API NestJS
├── frontend/         # Next.js App
├── ai-service/       # Python Microservice (IA da Árvore)
├── waves-service/    # Integração Blockchain
├── database/         # Scripts SQL (Init)
├── nginx/            # Configuração do Proxy
└── docker-compose.yml
```

## 🧠 Funcionalidades Principais

1. **Marketplace de Árvores**: Usuários compram árvores (tokens) em projetos reais.
2. **Tokenização**: Cada árvore gera um NFT na rede Waves com metadados (espécie, lat/long).
3. **IA da Árvore**: Chatbot personalizado que simula a personalidade da árvore e reporta crescimento.
4. **Dashboard ESG**: Painel corporativo para empresas compensarem CO₂.

## 🛠️ Tecnologias

- **PostgreSQL + PostGIS**: Armazenamento de dados geoespaciais (localização das árvores).
- **NestJS**: Framework robusto para o backend.
- **Next.js**: Framework React para frontend de alta performance.
- **Docker**: Containerização de todos os serviços.

## 📝 Notas de Desenvolvimento

- A conexão com a Blockchain Waves está mockada no serviço `waves-service` para facilitar testes locais sem custos.
- A IA utiliza simulação baseada em regras no `ai-service`, preparada para integração com LLMs reais.

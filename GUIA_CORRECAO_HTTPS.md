# Guia Simplificado: Corrigir Erro "Mixed Content" (HTTPS)

O erro acontece porque o site é **HTTPS** (`https://sementetoken.com`), mas tenta acessar a API via **HTTP** (`http://69.62.97.6:4001`). O navegador bloqueia isso.

A solução mais fácil é usar o **mesmo domínio** para o site e para a API. Vamos configurar o endereço `https://sementetoken.com/api` para redirecionar para seu backend.

## Passo 1: Configurar Nginx na VPS

1.  Acesse sua VPS via terminal.
2.  Edite a configuração do seu site no Nginx (geralmente em `/etc/nginx/sites-available/default` ou `/etc/nginx/sites-available/sementetoken`):
    ```bash
    sudo nano /etc/nginx/sites-available/default
    ```
    *(Se não achar, procure qual arquivo está sendo usado)*

3.  Dentro do bloco `server { ... }` que já existe para o `sementetoken.com`, adicione este bloco `location`:

    ```nginx
    server {
        server_name sementetoken.com www.sementetoken.com;
        # ... outras configurações existentes ...

        # ADICIONE ISTO: Configuração da API no mesmo domínio
        location /api/ {
            # A barra no final é IMPORTANTE: faz /api/auth virar /auth no backend
            proxy_pass http://localhost:4001/;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # ... location / existente do frontend ...
    }
    ```

4.  Salve (`Ctrl+O`, `Enter`) e saia (`Ctrl+X`).
5.  Teste e recarregue o Nginx:
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

## Passo 2: Atualizar Variável de Ambiente

Agora que a API está acessível via `https://sementetoken.com/api`, atualize o projeto:

1.  Edite o arquivo `.env.production` na VPS:
    ```bash
    nano ~/sementetoken/.env.production
    ```
2.  Altere a URL da API para usar o domínio seguro:
    ```env
    # Use o caminho /api que configuramos no Nginx
    NEXT_PUBLIC_API_URL=https://sementetoken.com/api
    ```
    *(Não use mais o IP com porta 4001)*

## Passo 3: Reconstruir o Frontend

O Frontend precisa "gravar" a nova URL dentro dele.

```bash
cd ~/sementetoken
# Baixar atualizações do git (se houver)
git pull origin main

# Reconstruir os containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
```

## Resumo
1. Nginx redireciona `/api/` -> Backend (Porta 4001)
2. Frontend chama `https://sementetoken.com/api` (HTTPS Seguro)
3. Navegador fica feliz (Sem erro Mixed Content)

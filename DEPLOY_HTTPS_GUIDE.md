# Guia de Configuração HTTPS (Produção)

O erro "Mixed Content" ocorre porque o site principal está em HTTPS (`https://sementetoken.com`), mas tenta acessar a API em HTTP (`http://69.62.97.6:4001`). Navegadores bloqueiam isso por segurança.

**Solução:** Você precisa configurar um subdomínio seguro para a API (ex: `https://api.sementetoken.com`).

## Passo 1: Configurar DNS
No painel onde você comprou o domínio `sementetoken.com`, crie um novo registro do tipo **A**:
- **Nome/Host:** `api`
- **Valor/IP:** `69.62.97.6`

Isso fará com que `api.sementetoken.com` aponte para sua VPS.

## Passo 2: Configurar Nginx (Proxy Reverso)
Acesse sua VPS e configure o Nginx para gerenciar o tráfego e o SSL.

1. Instale o Nginx (se ainda não tiver):
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

2. Crie um arquivo de configuração para o SementeToken:
   ```bash
   sudo nano /etc/nginx/sites-available/sementetoken
   ```

3. Cole o conteúdo abaixo (ajuste se necessário):

   ```nginx
   # Frontend (sementetoken.com) -> Porta 4000
   server {
       server_name sementetoken.com www.sementetoken.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   # Backend API (api.sementetoken.com) -> Porta 4001
   server {
       server_name api.sementetoken.com;

       location / {
           proxy_pass http://localhost:4001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Ative a configuração e reinicie o Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sementetoken /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Passo 3: Ativar HTTPS (SSL Gratuito)
Rode o Certbot para gerar os certificados automaticamente:

```bash
sudo certbot --nginx -d sementetoken.com -d www.sementetoken.com -d api.sementetoken.com
```
*Siga as instruções na tela e escolha a opção para redirecionar HTTP para HTTPS se perguntado.*

## Passo 4: Atualizar Variáveis de Ambiente
Edite o arquivo `.env.production` na pasta do projeto na VPS:

```bash
nano ~/sementetoken/.env.production
```

Altere a linha `NEXT_PUBLIC_API_URL`:
```env
NEXT_PUBLIC_API_URL=https://api.sementetoken.com
```

## Passo 5: Reiniciar o Projeto
```bash
cd ~/sementetoken
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

Pronto! Agora o frontend (`https://sementetoken.com`) conseguirá falar com a API (`https://api.sementetoken.com`) sem erros de segurança.

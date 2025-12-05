# Painel de Acompanhamento - Programa Descomplicadamente

Sistema web completo (backend + frontend) para o programa Descomplicadamente, desenvolvido pela Pleno Consultoria. Permite que servidores municipais participem de uma jornada de 21 dias de microações, com acompanhamento, ranking, uploads de fotos e mensagens automáticas via WhatsApp Cloud API.

## Estrutura
- `backend/`: API NestJS modular com Prisma/PostgreSQL, autenticação JWT (access + refresh), uploads via Cloudinary, agendamento com node-cron e documentação Swagger em `/docs`.
- `frontend/`: SPA React + Vite + Tailwind com React Router e React Query, contendo telas de Login, Dashboards (Servidor, Gestor, Admin) e seções de ranking e mensagens.

## Como rodar o backend
1. Acesse `backend/` e crie o arquivo `.env` com base em `.env.example` ajustando:
   - `PORT` (padrão 3000)
   - `DATABASE_URL` (PostgreSQL em Neon/Railway)
   - `JWT_SECRET` e `JWT_REFRESH_SECRET`
   - `CLOUDINARY_URL` (credencial padrão do painel do Cloudinary)
   - `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` (WhatsApp Cloud API)
   - `FRONTEND_URL` (origem liberada no CORS)
2. Instale dependências e prepare o Prisma:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run start:dev
   ```
3. A documentação Swagger ficará em `http://localhost:3000/docs` e a API em `http://localhost:3000/api`.

## Como rodar o frontend
1. Acesse `frontend/` e copie `.env.example` para `.env`, configurando `VITE_API_URL` (padrão `http://localhost:3000/api`).
2. Instale dependências e execute:
   ```bash
   npm install
   npm run dev
   ```
3. A aplicação ficará disponível em `http://localhost:5173`.

## Principais rotas da API
- **Auth**: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`.
- **Usuários/Municípios/Projetos/DayTemplates**: CRUD protegidos por role ADMIN_PLENO.
- **Ações**: `POST /projects/:projectId/days/:dayNumber/complete`, `GET /projects/:projectId/my-progress`.
- **Uploads**: `POST /uploads` (Cloudinary, multipart/form-data).
- **Ranking**: `GET /projects/:projectId/ranking` e `GET /projects/:projectId/ranking/full`.
- **Mensagens**: `POST /messages` e `GET /messages` (agendadas via node-cron + WhatsApp Cloud API).
- **Relatórios**: `GET /projects/:projectId/report/summary` e `GET /projects/:projectId/report/export`.

Exemplos rápidos de chamadas estão em `backend/api.http`.

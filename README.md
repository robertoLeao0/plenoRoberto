# Painel de Acompanhamento - Programa Descomplicadamente

Este repositório contém a base do backend (NestJS + Prisma + PostgreSQL) e do frontend (React + Vite + Tailwind) para o painel de microações e ranking do Programa Descomplicadamente.

## Estrutura
- `backend/`: API REST com módulos de autenticação, usuários, municípios, projetos, templates de dias, registros de ação, ranking, uploads e relatórios.
- `frontend/`: SPA React com telas para login, dashboards de user, gestor e admin, usando React Router e React Query.

## Executando o backend
1. Acesse `backend/` e copie `.env.example` para `.env`, ajustando:
   - `PORT` (padrão 3000)
   - `DATABASE_URL` (PostgreSQL)
   - `JWT_SECRET` e `JWT_REFRESH_SECRET`
2. Instale dependências e gere o client do Prisma:
   ```bash
   npm install
   npx prisma generate
   npm run start:dev
   ```

## Executando o frontend
1. Acesse `frontend/` e copie `.env.example` para `.env`, configurando `VITE_API_URL` (padrão `http://localhost:3000/api`).
2. Instale dependências e rode em modo dev:
   ```bash
   npm install
   npm run dev
   ```

## Endpoints principais
- Autenticação: `POST /api/auth/login`, `GET /api/auth/me`
- Gestão: usuários, municípios, projetos, day templates, uploads
- Execução: `POST /api/projects/:projectId/days/:dayNumber/complete`, ranking e relatórios

Consulte `backend/api.http` para exemplos rápidos de chamadas.

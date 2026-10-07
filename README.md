# SocioTab — caderno colaborativo de Sociologia

Aplicação web para a atividade **Aula 15 — Movimentos Sociais — Capítulo 5, páginas 84–88**, comparando Karl Marx, Émile Durkheim e Talcott Parsons.

## Arquitetura

- **Frontend:** React 19 + TypeScript + Vite; SPA responsiva, modo claro/escuro.
- **API:** Express 5 + TypeScript; REST, validação Zod, Helmet, CORS e rate limit.
- **Persistência:** PostgreSQL, fonte única da verdade. IDs locais no navegador servem apenas para autoria (não autenticação).
- **Banco:** tabelas relacionais com migration SQL em `server/migrations/001_init.sql`; conteúdo de célula é HTML sanitizado por allowlist.
- **Atualização:** SSE com atualização de leitura a cada quatro segundos; autosave com debounce de 650 ms.
- **Deploy-alvo:** Render Web Service + Render PostgreSQL usando `render.yaml`. Imagens de upload não são falsamente tratadas como duráveis: integração de bucket S3-compatible exige implementação/configuração adicional.

O preview deste sandbox é temporário e não substitui banco externo. Os recursos da conta Render/GitHub não são conectados nem provisionados por este código automaticamente.

## Estrutura

```text
client/src/       interface React e estilos
server/src/       API, rotas, migrações
server/migrations/ SQL versionado
public/           manifesto de rotas
Dockerfile        imagem de produção
render.yaml       blueprint Render
```

## Requisitos locais

Node.js 20.19+ e PostgreSQL 14+. Se Docker estiver disponível:

```bash
docker compose up -d postgres
```

Sem Docker, crie banco e usuário no PostgreSQL instalado e ajuste `DATABASE_URL`.

```bash
cp .env.example .env
# ajuste DATABASE_URL para o seu PostgreSQL
npm ci
npm run migrate
npm run dev
```

Frontend: `http://localhost:5173`; API: `http://localhost:3001/api/health`. Para compilar e iniciar modo production: `npm run build`, `NODE_ENV=production npm start`.

## Migração PostgreSQL

`npm run migrate` executa o SQL versionado. O schema inclui:

- `users`: identidade escolar por UUID local, nome e sobrenome;
- `tables`: descrição, criador, versão, estado de rascunho/finalização e arquivamento lógico;
- `table_rows`, `table_columns`, `cells`: grade normalizada com dimensões e estilo por célula;
- `images`: metadados e referência a objeto externo;
- `edit_locks`: lock por tabela e heartbeat;
- `history`: eventos auditáveis.

Foreign keys, cascatas, checks, unicidade de célula/posição e índices para listagem, locks e histórico protegem a integridade.

## Rotas API

`GET /api/health`, `GET /api/tables?archived=false|true`, `POST /api/tables`, `GET /api/tables/:id`, `POST/PUT/DELETE /api/tables/:id/lock`, `PUT /api/tables/:id/cells/:cellId`, `POST /api/tables/:id/structure`, `POST /api/tables/:id/resize`, `POST /api/tables/:id/state`, `POST /api/tables/:id/archive|restore`, `GET /api/tables/:id/history`, `GET /api/tables/:id/events`.

Identidade enviada em `x-user-id`, `x-first-name`, `x-last-name`. Esses cabeçalhos são falsificáveis: arquivamento e autoria não são segurança forte. Lock expira após 90 s sem heartbeat; clientes renovam periodicamente.

## GitHub e Render

1. Crie um repositório GitHub privado ou público e envie estes arquivos (`git init`, `git add .`, `git commit`, `git remote add origin …`, `git push -u origin main`).
2. No Render, escolha **New + → Blueprint**, conecte o repositório e revise `render.yaml` antes de aplicar. O blueprint cria serviço Web e PostgreSQL gerenciado (planos dependem da disponibilidade/conta).
3. Configure `CLIENT_ORIGIN` para domínio do app e SSL/`DATABASE_URL` conforme o Render. Health check em `/api/health`.
4. Para armazenar imagens, configure bucket S3-compatible, política privada/pública apropriada e endpoints de upload assinados; não usar filesystem efêmero Render.

## Variáveis

Consulte `.env.example`: `DATABASE_URL`, `PORT`, `CLIENT_ORIGIN`, `LOCK_TTL_SECONDS` e configurações reservadas `S3_*`. Não comite `.env` ou credenciais.

## Funcionalidades implementadas

Identificação local de nome/sobrenome; criação e links próprios; grid com adição/remoção de linhas e colunas, rich text básico, redimensionamento por arraste, autosave, heartbeat/lock, leitura SSE, histórico, rascunho/finalização, arquivamento/restauração do criador, CSV, impressão, tema e destaque determinístico de vocabulário sociológico.

## Limitações conhecidas

Este primeiro corte não implementa integração efetiva de imagens/object storage, exportação XLSX/PDF, desfazer/refazer confiável, colagem complexa, seleção múltipla/formatos aplicados à linha/coluna/tabela, nem rich text avançado completo (tamanho/família de fonte e listas parciais). CSV e impressão estão implementados. A tela exige conexão PostgreSQL para funcionar; não há modo demo/localStorage alternativo. O ambiente desta tarefa não provisiona automaticamente banco Render, GitHub, ou bucket persistente.

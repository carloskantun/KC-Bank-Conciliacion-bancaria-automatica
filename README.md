# KC-Bank — Conciliación bancaria automática

Ver visión de producto completa en [`docs/01-vision-producto.md`](docs/01-vision-producto.md).

Este repositorio contiene, por ahora, **solo la estructura inicial del proyecto**:

- `frontend/` — Next.js (TypeScript)
- `backend/` — NestJS (TypeScript)
- `docs/` — documentación del producto

No incluye todavía conciliación, CFDI, usuarios ni parsers bancarios. Esta primera etapa solo levanta la infraestructura base y expone endpoints de salud.

## Arquitectura de esta etapa

| Componente        | Tecnología                     |
| ------------------ | ------------------------------- |
| Frontend            | Next.js + TypeScript            |
| Backend             | NestJS + TypeScript             |
| Base de datos       | PostgreSQL                      |
| Cola de trabajos    | Redis + BullMQ                  |
| Almacenamiento      | MinIO (compatible con S3)       |
| Infra local         | Docker Compose                  |

Docker Compose levanta **solo la infraestructura** (PostgreSQL, Redis, MinIO). El backend y el frontend se ejecutan directamente con Node en la máquina del desarrollador (`npm run start:dev` / `npm run dev`), conectándose a esa infraestructura.

## Requisitos

- Node.js 20+ y npm
- Docker y Docker Compose

## 1. Variables de entorno

Existe un único archivo de referencia en la raíz: `.env.example`.

```bash
# Copia usada por docker-compose y por el backend
cp .env.example .env

# Copia usada por el frontend (Next.js solo lee .env* dentro de frontend/)
cp .env.example frontend/.env.local
```

No es necesario editar los valores por defecto para levantar el proyecto en local.

## 2. Levantar la infraestructura (PostgreSQL, Redis, MinIO)

Desde la raíz del repositorio:

```bash
docker compose up -d
```

Esto expone:

- PostgreSQL en `localhost:5432` (usuario/clave/DB definidos en `.env`)
- Redis en `localhost:6379`
- MinIO en `localhost:9000` (API) y `localhost:9001` (consola web)

Para verificar que los contenedores están sanos:

```bash
docker compose ps
```

Para detener todo:

```bash
docker compose down
```

## 3. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

## 4. Ejecutar el backend (NestJS)

```bash
cd backend
npm run start:dev
```

El backend queda disponible en `http://localhost:3001` (puerto definido por `BACKEND_PORT` en `.env`).

### Endpoints de salud

- `GET /health` — estado general de la aplicación
- `GET /health/database` — verifica la conexión a PostgreSQL
- `GET /health/redis` — verifica la conexión a Redis

Ejemplo:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/database
curl http://localhost:3001/health/redis
```

Cada endpoint responde `200` con `{"status":"ok", ...}` cuando el chequeo pasa, o `503` con el detalle del error cuando falla.

## 5. Ejecutar el frontend (Next.js)

```bash
cd frontend
npm run dev
```

El frontend queda disponible en `http://localhost:3000` y muestra el estado de los tres health checks del backend, consumiendo la URL configurada en `NEXT_PUBLIC_API_URL` (dentro de `frontend/.env.local`).

## Orden recomendado para levantar todo

1. `cp .env.example .env && cp .env.example frontend/.env.local`
2. `docker compose up -d`
3. `cd backend && npm install && npm run start:dev`
4. `cd frontend && npm install && npm run dev` (en otra terminal)
5. Abrir `http://localhost:3000`

## Decisiones técnicas de esta etapa

- **NestJS + TypeORM**: se configuró `TypeOrmModule` con `synchronize: false` y sin entidades todavía (`entities: []`, `autoLoadEntities: true`), ya que aún no se modelan datos de negocio.
- **BullMQ**: se configuró `BullModule.forRootAsync` apuntando a Redis, sin colas ni procesadores todavía (se agregarán junto con la conciliación).
- **Health checks con `@nestjs/terminus`**: `/health/database` usa `TypeOrmHealthIndicator`; `/health/redis` usa un indicador propio (`RedisHealthIndicator`) que abre una conexión `ioredis` de corta duración y hace `PING`.
- **Un solo `.env.example`** en la raíz, reutilizado por docker-compose, backend y frontend, para evitar duplicar variables en esta etapa temprana.
- **Docker Compose solo para infraestructura**: backend y frontend corren con Node directamente en el host para facilitar hot-reload durante el desarrollo; no se creó Dockerfile para ellos en esta etapa.
- **CORS habilitado** en el backend (`app.enableCors()`) para que el frontend pueda consumir los endpoints de salud durante el desarrollo local.

## Errores / limitaciones pendientes conocidas

- No se implementó todavía autenticación, multiempresa, CFDI, parsers bancarios ni lógica de conciliación (fuera del alcance de esta etapa, según lo solicitado).
- No hay migraciones de base de datos todavía porque no existen entidades.
- No se creó Dockerfile para `backend/` ni `frontend/`; correrlos dentro de Docker Compose queda para una etapa posterior si se requiere.

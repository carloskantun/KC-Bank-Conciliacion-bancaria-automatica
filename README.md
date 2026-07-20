# KC-Bank — Conciliación bancaria automática

Ver visión de producto completa en [`docs/01-vision-producto.md`](docs/01-vision-producto.md).

Este repositorio contiene la **estructura base del proyecto**, ya estabilizada (variables de entorno validadas, CORS configurable, health checks de Postgres/Redis/MinIO, migraciones TypeORM y CI). Todavía **no** incluye usuarios, autenticación, empresas, CFDI, estados bancarios ni conciliación.

- `frontend/` — Next.js (TypeScript)
- `backend/` — NestJS (TypeScript)
- `docs/` — documentación del producto

## Arquitectura

| Componente        | Tecnología                     |
| ------------------ | ------------------------------- |
| Frontend            | Next.js + TypeScript            |
| Backend             | NestJS + TypeScript             |
| Base de datos       | PostgreSQL + TypeORM (migraciones, sin `synchronize`) |
| Cola de trabajos    | Redis + BullMQ                  |
| Almacenamiento      | MinIO (compatible con S3), versión fija |
| Infra local         | Docker Compose                  |
| CI                  | GitHub Actions                  |

Docker Compose levanta **solo la infraestructura** (PostgreSQL, Redis, MinIO). El backend y el frontend se ejecutan directamente con Node en la máquina del desarrollador.

## Requisitos

- Node.js 22.x y npm
- Docker y Docker Compose

## 1. Variables de entorno

Las variables están separadas por responsabilidad en tres archivos de referencia:

```text
/.env.example              → solo docker-compose (Postgres, Redis, MinIO)
/backend/.env.example      → solo backend (NestJS)
/frontend/.env.example     → solo frontend (Next.js)
```

Cópialos así:

```bash
# Infraestructura (docker-compose)
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend (Next.js solo lee .env* dentro de frontend/)
cp frontend/.env.example frontend/.env.local
```

`frontend/.env.example` únicamente contiene `NEXT_PUBLIC_API_URL`. **Nunca** agregues ahí credenciales de PostgreSQL, Redis, MinIO ni del backend.

### Variables validadas por el backend

Al iniciar, el backend valida (con Joi) que existan y tengan el formato correcto:

`NODE_ENV`, `BACKEND_PORT`, `CORS_ORIGINS`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_HOST`, `REDIS_PORT`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_USE_SSL`.

Si falta una variable obligatoria o tiene un formato inválido, **la aplicación no arranca** y termina con un error que indica el campo y el tipo de problema (nunca el valor, para no filtrar contraseñas).

## 2. Levantar la infraestructura (PostgreSQL, Redis, MinIO)

Desde la raíz del repositorio:

```bash
docker compose up -d
docker compose ps
```

Esto expone:

- PostgreSQL en `localhost:5432`
- Redis en `localhost:6379`
- MinIO en `localhost:9000` (API) y `localhost:9001` (consola web), imagen fija `minio/minio:RELEASE.2025-09-07T16-13-09Z`

Para detener todo: `docker compose down`.

## 3. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 4. Ejecutar el backend (NestJS)

```bash
cd backend
npm run start:dev
```

Disponible en `http://localhost:3001` (puerto `BACKEND_PORT`).

### CORS

El backend solo acepta los orígenes listados en `CORS_ORIGINS` (separados por comas), configurado explícitamente en `app.enableCors({ origin: [...] })`. No usa `origin: true` ni comodines. Por defecto en desarrollo: `http://localhost:3000`.

### Health checks

- `GET /health` — agrega PostgreSQL + Redis + MinIO (200 si todo está arriba, 503 si algo falla)
- `GET /health/database` — solo PostgreSQL
- `GET /health/redis` — solo Redis
- `GET /health/storage` — solo MinIO

Cada endpoint responde `503` con el detalle del fallo (sin bloquearse) cuando la dependencia correspondiente no está disponible.

```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/database
curl http://localhost:3001/health/redis
curl http://localhost:3001/health/storage
```

### Migraciones (TypeORM)

`synchronize` está deshabilitado (`false`) permanentemente. El esquema se gestiona con migraciones explícitas.

```bash
cd backend
npm run migration:create -- src/database/migrations/NombreDeLaMigracion
npm run migration:generate -- src/database/migrations/NombreDeLaMigracion
npm run migration:run
npm run migration:revert
npm run migration:show
```

Aún no existen tablas de negocio ni migraciones generadas (se agregarán junto con las próximas etapas del producto).

## 5. Ejecutar el frontend (Next.js)

```bash
cd frontend
npm run dev
```

Disponible en `http://localhost:3000`, consumiendo `NEXT_PUBLIC_API_URL` (`frontend/.env.local`).

## Orden recomendado para levantar todo

1. `cp .env.example .env && cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env.local`
2. `docker compose up -d`
3. `cd backend && npm install && npm run start:dev`
4. `cd frontend && npm install && npm run dev` (en otra terminal)
5. Abrir `http://localhost:3000`

## Pruebas

```bash
cd backend
npm run test       # pruebas unitarias (config, CORS, indicadores de salud)
npm run test:e2e   # pruebas HTTP end-to-end de /health, /health/database, /health/redis, /health/storage y CORS
```

Las pruebas **no** requieren Postgres/Redis/MinIO reales: se mockean únicamente los clientes de bajo nivel (`pg`/TypeORM `DataSource`, `ioredis`, `minio`), y se ejercita la lógica real de los indicadores, `HealthCheckService` y `HealthController`. Incluyen los casos: todo arriba (200), Redis caído (503), MinIO caído (503), configuración inválida (el arranque se detiene) y CORS (permite el origen configurado, rechaza otro).

```bash
cd frontend
npm run lint
npm run build
```

## Integración continua

`.github/workflows/ci.yml` corre en cada push y pull request hacia `main`, con Node.js 22 fijo:

- **backend**: `npm ci` → `npm run lint` → `npm run test` → `npm run build`
- **frontend**: `npm ci` → `npm run lint` → `npm run build`

No levanta PostgreSQL, Redis ni MinIO porque las pruebas actuales no dependen de ellos (usan mocks, ver sección de Pruebas).

## Decisiones técnicas de esta etapa

- **Tres `.env.example` separados** (raíz/backend/frontend) para que el frontend nunca tenga acceso a credenciales de infraestructura.
- **Validación de entorno con Joi** vía una función `validate` custom en `ConfigModule.forRoot`, en vez de `validationSchema`, para controlar el mensaje de error y no incluir valores (contraseñas) en él.
- **CORS explícito por lista de orígenes** (`CORS_ORIGINS`), sin `origin: true` ni wildcard.
- **MinIO con versión fija** (`RELEASE.2025-09-07T16-13-09Z`, verificada disponible en Docker Hub) en vez de `latest`, manteniendo volumen persistente y healthcheck.
- **`StorageService` + `MinioHealthIndicator`**: el servicio solo crea el cliente MinIO desde variables de entorno y expone `checkConnection()` (via `listBuckets()`); el indicador de salud aplica un timeout propio (3s) para garantizar que un MinIO inalcanzable no bloquee el endpoint.
- **`/health` agregado**: ahora ejecuta los tres indicadores (Postgres, Redis, MinIO) y responde `503` si cualquiera falla, sin ocultar cuál.
- **TypeORM con `synchronize: false`** y un `DataSource` de CLI independiente (`src/database/data-source.ts`) para migraciones, separado de la configuración de NestJS en tiempo de ejecución.
- **Pruebas mockeando solo el transporte** (`ioredis`, `minio`, `DataSource`), nunca la lógica de los indicadores, para que los tests reflejen comportamiento real ante fallos.
- **CI sin infraestructura real**: como las pruebas no dependen de Postgres/Redis/MinIO reales, el workflow no los levanta, manteniendo el pipeline simple y rápido.

## Limitaciones conocidas / pendientes

- No se implementó todavía autenticación, multiempresa, CFDI, parsers bancarios ni lógica de conciliación (fuera del alcance de esta etapa).
- No hay migraciones de base de datos generadas todavía porque no existen entidades de negocio.
- No se creó Dockerfile para `backend/` ni `frontend/`; corren con Node directamente en el host durante desarrollo.
- En este entorno de desarrollo (sandbox de esta sesión) no fue posible ejecutar `docker compose up` de forma literal porque el daemon de Docker no está disponible; la validación de Postgres/Redis se hizo con instancias nativas equivalentes, y MinIO se validó mediante pruebas automatizadas con mocks (no fue posible levantar un MinIO real en este sandbox). La configuración de `docker-compose.yml` sigue el patrón estándar y debe funcionar en un entorno con Docker disponible.

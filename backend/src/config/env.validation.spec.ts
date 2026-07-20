import { validateEnv } from './env.validation';

function omit<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...obj };
  delete copy[key as string];
  return copy;
}

const validConfig = {
  NODE_ENV: 'development',
  BACKEND_PORT: '3001',
  CORS_ORIGINS: 'http://localhost:3000',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'kcbank',
  POSTGRES_PASSWORD: 'super-secret-password',
  POSTGRES_DB: 'kcbank',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  MINIO_ENDPOINT: 'localhost',
  MINIO_PORT: '9000',
  MINIO_ROOT_USER: 'kcbank',
  MINIO_ROOT_PASSWORD: 'super-secret-password',
  MINIO_USE_SSL: 'false',
};

describe('validateEnv', () => {
  it('acepta una configuración completa y válida', () => {
    expect(() => validateEnv({ ...validConfig })).not.toThrow();
  });

  it('detiene el arranque si falta una variable obligatoria', () => {
    const incomplete = omit(validConfig, 'POSTGRES_PASSWORD');
    expect(() => validateEnv(incomplete)).toThrow(
      /Configuración de entorno inválida/,
    );
  });

  it('detiene el arranque si una variable tiene formato inválido', () => {
    expect(() =>
      validateEnv({ ...validConfig, POSTGRES_PORT: 'not-a-port' }),
    ).toThrow(/Configuración de entorno inválida/);
  });

  it('no incluye valores de contraseñas en el mensaje de error', () => {
    try {
      validateEnv({ ...validConfig, POSTGRES_PASSWORD: undefined });
      fail('se esperaba que validateEnv lanzara un error');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain('super-secret-password');
      expect(message).toContain('POSTGRES_PASSWORD');
    }
  });

  it('aplica valores por defecto cuando faltan opcionales', () => {
    const withoutPort = omit(validConfig, 'BACKEND_PORT');
    const result = validateEnv(withoutPort);
    expect(result.BACKEND_PORT).toBe(3001);
  });
});

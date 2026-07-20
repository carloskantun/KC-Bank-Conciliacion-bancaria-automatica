import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  BACKEND_PORT: Joi.number().port().default(3001),

  CORS_ORIGINS: Joi.string().required(),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),

  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().port().default(9000),
  MINIO_ROOT_USER: Joi.string().required(),
  MINIO_ROOT_PASSWORD: Joi.string().required(),
  MINIO_USE_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
}).unknown(true);

/**
 * Valida las variables de entorno sin exponer sus valores en el mensaje de
 * error (solo se reporta el nombre del campo y el tipo de problema), para no
 * filtrar contraseñas u otros secretos en logs de arranque.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = envValidationSchema.validate(config, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (result.error) {
    const details = result.error.details
      .map((detail) => `${detail.path.join('.')} (${detail.type})`)
      .join(', ');
    throw new Error(`Configuración de entorno inválida. Revisa: ${details}`);
  }

  return result.value as Record<string, unknown>;
}

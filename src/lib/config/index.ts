import { z } from 'zod';

/**
 * Server configuration as a zod schema declaration only: every value is
 * supplied by the environment — the per-environment vars in wrangler.jsonc
 * when deployed as a worker, or .env.development locally — and nothing is
 * hardcoded here.
 */
const serverConfigSchema = z.object({
  TRUSTED_ORIGINS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    )
    .pipe(z.array(z.string().url()).min(1)),
});

export interface ServerConfig {
  /** The only redirect targets the sign-in and sign-out pages accept. */
  trustedOrigins: string[];
}

let cached: ServerConfig | undefined;

/**
 * Returns the validated server configuration. The result is cached for
 * the lifetime of the process.
 *
 * @throws when the environment is missing a value or fails validation.
 */
export function getServerConfig(): ServerConfig {
  if (cached !== undefined) return cached;

  const env = serverConfigSchema.parse(process.env);
  cached = { trustedOrigins: env.TRUSTED_ORIGINS };
  return cached;
}

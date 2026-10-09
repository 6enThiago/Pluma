function required(key, minLength = 1) {
  const value = process.env[key];
  if (!value || value.length < minLength) {
    throw new Error(`Variable de entorno ${key} ausente o demasiado corta (mínimo ${minLength}).`);
  }
  return value;
}
const sessionHours = Number(process.env.SESSION_HOURS) || 2;

export const config = {
  port: Number(process.env.PORT) || 3000,
  isProd: process.env.NODE_ENV === 'production',
  jwtSecret: required('JWT_SECRET', 32),
  jwtExpiresIn: `${sessionHours}h`,
  cookieName: 'cms_token',
  cookieMaxAgeMs: sessionHours * 60 * 60 * 1000,
  dbPath: process.env.DB_PATH || './data/cms.db',
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};

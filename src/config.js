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
  // Cantidad de proxys delante del servidor (ej. 1 en Render/Railway/Nginx). 0 = ninguno.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  jwtSecret: required('JWT_SECRET', 32),
  jwtExpiresIn: `${sessionHours}h`,
  cookieName: 'cms_token',
  cookieMaxAgeMs: sessionHours * 60 * 60 * 1000,
  dbPath: process.env.DB_PATH || './data/cms.db',
  // Versión de los términos que acepta cada usuario al registrarse. Súbela si cambias terms.html.
  termsVersion: '2026-10-09',
  admin: {
    email: process.env.ADMIN_EMAIL,
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD,
  },
};

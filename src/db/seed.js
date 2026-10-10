import { config } from '../config.js';
import * as userService from '../services/userService.js';

// Crea el primer admin solo si la tabla de usuarios está vacía.
export async function seedAdmin() {
  if (userService.count() > 0) return;
  const { email, username, password } = config.admin;
  if (!email || !password) {
    console.warn('No hay usuarios y faltan ADMIN_EMAIL / ADMIN_PASSWORD: no se creó ningún admin.');
    return;
  }
  await userService.create({ email, username, password, role: 'admin', termsAccepted: true });
  console.log(`Usuario admin creado: ${username} <${email}>`);
}

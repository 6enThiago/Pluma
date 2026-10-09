import { config } from './config.js';
import app from './app.js';
import { seedAdmin } from './db/seed.js';

await seedAdmin();
app.listen(config.port, () => console.log(`CMS escuchando en http://localhost:${config.port}`));

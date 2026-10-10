import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);
app.use(helmet()); // CSP, X-Content-Type-Options, etc.
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));
app.get('/admin', (req, res) => res.redirect('/admin.html'));

app.use('/api', apiRouter);
app.use('/api', notFound);
app.use(errorHandler);

export default app;

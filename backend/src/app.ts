import express from 'express';
import cors from 'cors';

// Note: dotenv is loaded in env.ts which is imported first in server_entry.ts

const app = express();

// Build CORS origins from environment
const corsOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

// Add FRONTEND_URL if configured (for custom deployments)
if (process.env.FRONTEND_URL) {
    corsOrigins.push(process.env.FRONTEND_URL);
}

// Add NEXT_PUBLIC_API_URL origin if it's different from backend
if (process.env.NEXT_PUBLIC_API_URL) {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    const frontendOrigin = `${apiUrl.protocol}//${apiUrl.hostname}${apiUrl.port ? ':' + apiUrl.port : ''}`;
    if (!corsOrigins.includes(frontendOrigin)) {
        corsOrigins.push(frontendOrigin);
    }
}

// Middleware - CORS with dynamic origins for SSE
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
}));
app.use(express.json({ limit: process.env.BODY_LIMIT || '10mb' }));

// =============================================
// API Routes - Feature-based structure
// =============================================

// Website Scraping: /api/website/*
import websiteRoutes from './routes/websiteRoutes';
app.use('/api/website', websiteRoutes);

// Google SERP: /api/google-serp/* (Coming Soon)
import googleSerpRoutes from './routes/googleSerpRoutes';
app.use('/api/google-serp', googleSerpRoutes);

// Configuration: /api/config
import configRoutes from './routes/configRoutes';
app.use('/api/config', configRoutes);

// Dashboard: /api/dashboard
import dashboardRoutes from './routes/dashboardRoutes';
app.use('/api/dashboard', dashboardRoutes);

// API Keys: /api/keys
import keysRoutes from './routes/keysRoutes';
app.use('/api/keys', keysRoutes);

// Request Logs: /api/logs
import logsRoutes from './routes/logsRoutes';
app.use('/api/logs', logsRoutes);

// Profiles: /api/profiles
import profileRoutes from './routes/profileRoutes';
app.use('/api/profiles', profileRoutes);

// Proxies: /api/proxies
import proxyRoutes from './routes/proxyRoutes';
app.use('/api/proxies', proxyRoutes);

// Jobs: /api/jobs (for persistent scrape job tracking)
import jobRoutes from './routes/jobRoutes';
app.use('/api/jobs', jobRoutes);

// =============================================
// Legacy Routes (v1/v2 - keep for backwards compatibility)
// =============================================
import v1Router from './routes/v1';
import v2Router from './routes/v2';

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        service: 'HeadlessX V2 Pro Backend (Camoufox)',
        browser: 'Camoufox (Anti-detect Firefox)',
        endpoints: {
            website: '/api/website/*',
            googleSerp: '/api/google-serp/* (coming soon)',
            profiles: '/api/profiles/*',
            proxies: '/api/proxies/*',
            config: '/api/config',
            keys: '/api/keys',
            logs: '/api/logs'
        }
    });
});

// Server startup is handled by server_entry.ts

export default app;


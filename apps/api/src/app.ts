import express from 'express';
import cors from 'cors';

// Note: dotenv is loaded in env.ts which is imported first in server_entry.ts

const app = express();
const frontendUrl = process.env.FRONTEND_URL?.trim();
const webPort = process.env.WEB_PORT?.trim();

// Build CORS origins from environment
const corsOrigins: (string | RegExp)[] = [];

if (frontendUrl) {
    corsOrigins.push(frontendUrl);
}

if (webPort) {
    corsOrigins.push(`http://localhost:${webPort}`);
    corsOrigins.push(`http://127.0.0.1:${webPort}`);
}

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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
}));
app.use(express.json({ limit: process.env.BODY_LIMIT || '10mb' }));

// =============================================
// API Routes - Feature-based structure
// =============================================

// Website Scraping: /api/website/*
import websiteRoutes from './routes/scrape/websiteRoutes';
app.use('/api/website', websiteRoutes);

// Google SERP: /api/google-serp/* (Coming Soon)
import googleSerpRoutes from './routes/scrape/googleSerpRoutes';
app.use('/api/google-serp', googleSerpRoutes);

// Tavily: /api/tavily/*
import tavilyRoutes from './routes/ai/tavilyRoutes';
app.use('/api/tavily', tavilyRoutes);

// Configuration: /api/config
import configRoutes from './routes/config/configRoutes';
app.use('/api/config', configRoutes);

// Dashboard: /api/dashboard
import dashboardRoutes from './routes/dashboard/dashboardRoutes';
app.use('/api/dashboard', dashboardRoutes);

// API Keys: /api/keys
import keysRoutes from './routes/keysRoutes';
app.use('/api/keys', keysRoutes);

// Request Logs: /api/logs
import logsRoutes from './routes/logsRoutes';
app.use('/api/logs', logsRoutes);

// Proxies: /api/proxies
import proxyRoutes from './routes/proxy/proxyRoutes';
app.use('/api/proxies', proxyRoutes);

// Jobs: /api/jobs (for persistent scrape job tracking)
import jobRoutes from './routes/jobs/jobRoutes';
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
            websiteMap: '/api/website/map',
            websiteCrawl: '/api/website/crawl',
            googleSerp: '/api/google-serp/* (coming soon)',
            tavily: '/api/tavily/*',
            proxies: '/api/proxies/*',
            config: '/api/config',
            keys: '/api/keys',
            logs: '/api/logs',
            jobs: '/api/jobs',
            queueMetrics: '/api/jobs/metrics'
        }
    });
});

// Server startup is handled by server_entry.ts

export default app;

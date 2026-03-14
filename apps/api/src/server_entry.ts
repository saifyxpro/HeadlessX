// Load environment variables FIRST
import './env';
import { assertSecurityConfiguration } from './utils/security';

// Now import app after env is loaded
import app from './app';

const PORT = parseInt(process.env.PORT || '8000', 10);

async function startServer() {
    try {
        assertSecurityConfiguration();

        app.listen(PORT, () => {
            console.log(`🚀 HeadlessX Backend running on http://localhost:${PORT}`);
            console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

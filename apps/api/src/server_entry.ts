// Load environment variables FIRST
import './env';
import { profileService } from './services/ProfileService';

// Now import app after env is loaded
import app from './app';

const PORT = parseInt(process.env.PORT || '8000', 10);

async function startServer() {
    try {
        // Ensure there is always a baseline profile available for "default" usage
        await profileService.ensureDefaultProfile();

        // Reset running status for all profiles (since server restarted)
        console.log('🔄 Resetting profile states...');
        await profileService.resetAllRunningStatuses();

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

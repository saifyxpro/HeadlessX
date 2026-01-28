// Load environment variables FIRST
import './env';

// Now import app after env is loaded
import app from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, async () => {
    console.log(`🚀 HeadlessX Backend running on http://localhost:${PORT}`);
    console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
});

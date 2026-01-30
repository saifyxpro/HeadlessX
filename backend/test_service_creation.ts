import 'dotenv/config';
import { profileService } from './src/services/ProfileService';
import { prisma } from './src/database/client';

async function main() {
    try {
        console.log('Testing ProfileService.create()...');

        // Test creating a profile via the service
        // This uses the inputs expected by the service (camelCase)
        const profile = await profileService.create({
            name: `Service Test ${Date.now()}`,
            screenWidth: 1920,
            screenHeight: 1080,
            locale: 'en-US',
            storageType: 'local',
            proxyMode: 'none',
            // isActive is not in CreateProfileInput, it defaults key in service mapping?
            // checking ProfileService.ts match: 
            // input.screenWidth maps to screen_width
        });

        console.log('✅ Service creation successful:', profile);

        // Clean up
        await prisma.profile.delete({ where: { id: profile.id } });
        console.log('Cleanup successful');

    } catch (error) {
        console.error('❌ Service test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

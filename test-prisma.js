import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        // Example queries, replace with your actual models
        const users = await prisma.user.findMany();
        console.log('Users:', users);

        const voiceInterviews = await prisma.voiceInterview.findMany();
        console.log('Voice Interviews:', voiceInterviews);

    } catch (e) {
        console.error('Error querying Prisma:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();

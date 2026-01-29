import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        // Use env var or fallback to allow prisma generate during initial install
        url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    },
})

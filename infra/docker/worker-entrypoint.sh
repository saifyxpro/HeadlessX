#!/bin/sh
set -eu

cd /app/apps/api

MAX_ATTEMPTS="${PRISMA_MIGRATE_MAX_ATTEMPTS:-10}"
ATTEMPT=1

echo "🗄️ Applying Prisma migrations for worker..."

until pnpm exec prisma migrate deploy; do
    if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
        echo "❌ Worker Prisma migration failed after ${MAX_ATTEMPTS} attempts."
        exit 1
    fi

    echo "⚠️ Worker migration attempt ${ATTEMPT} failed. Retrying in 3 seconds..."
    ATTEMPT=$((ATTEMPT + 1))
    sleep 3
done

echo "✅ Worker Prisma migrations applied."
exec pnpm exec tsx src/worker_entry.ts

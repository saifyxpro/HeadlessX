-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLog" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "profile_id" TEXT,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "error_message" TEXT,
    "error_screenshot_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "browser_headless" BOOLEAN NOT NULL DEFAULT true,
    "browser_timeout" INTEGER NOT NULL DEFAULT 60000,
    "max_concurrency" INTEGER NOT NULL DEFAULT 5,
    "stealth_mode" TEXT NOT NULL DEFAULT 'advanced',
    "proxy_enabled" BOOLEAN NOT NULL DEFAULT false,
    "proxy_url" TEXT,
    "proxy_protocol" TEXT DEFAULT 'http',
    "profile_rotation" BOOLEAN NOT NULL DEFAULT true,
    "profile_rotation_interval" INTEGER NOT NULL DEFAULT 3600000,
    "camoufox_geoip" BOOLEAN NOT NULL DEFAULT true,
    "camoufox_block_webrtc" BOOLEAN NOT NULL DEFAULT true,
    "camoufox_block_images" BOOLEAN NOT NULL DEFAULT false,
    "camoufox_enable_cache" BOOLEAN NOT NULL DEFAULT true,
    "camoufox_humanize" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "screen_width" INTEGER NOT NULL DEFAULT 1920,
    "screen_height" INTEGER NOT NULL DEFAULT 1080,
    "user_agent" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "timezone" TEXT,
    "storage_type" TEXT NOT NULL DEFAULT 'local',
    "proxy_mode" TEXT NOT NULL DEFAULT 'none',
    "proxy_id" TEXT,
    "proxy_url" TEXT,
    "proxy_username" TEXT,
    "proxy_password" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_running" BOOLEAN NOT NULL DEFAULT false,
    "cookies_count" INTEGER NOT NULL DEFAULT 0,
    "storage_size_mb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'http',
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "country" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_rotating" BOOLEAN NOT NULL DEFAULT false,
    "last_checked" TIMESTAMP(3),
    "is_working" BOOLEAN NOT NULL DEFAULT true,
    "avg_latency" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_name_key" ON "Profile"("name");

-- CreateIndex
CREATE INDEX "Profile_is_active_idx" ON "Profile"("is_active");

-- CreateIndex
CREATE INDEX "Profile_last_used_at_idx" ON "Profile"("last_used_at");

-- CreateIndex
CREATE UNIQUE INDEX "Proxy_name_key" ON "Proxy"("name");

-- CreateIndex
CREATE INDEX "Proxy_is_active_idx" ON "Proxy"("is_active");

-- CreateIndex
CREATE INDEX "Proxy_country_idx" ON "Proxy"("country");

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_proxy_id_fkey" FOREIGN KEY ("proxy_id") REFERENCES "Proxy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

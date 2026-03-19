FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy
ENV YT_ENGINE_TEMP_DIR=/app/tmp/yt-engine

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    ffmpeg \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN python -m pip install --no-cache-dir --upgrade pip uv

WORKDIR /app

COPY packages/yt-dude ./packages/yt-dude
COPY apps/yt-engine ./apps/yt-engine

RUN mkdir -p /app/tmp/yt-engine \
    && uv pip install --system "./packages/yt-dude[default,curl-cffi]" "./apps/yt-engine"

EXPOSE 8090

WORKDIR /app/apps/yt-engine

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]

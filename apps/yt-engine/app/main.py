from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse

from .schemas import (
    DeleteDownloadResponse,
    EngineInfoResponse,
    EngineStatusResponse,
    ExtractionRequest,
    SaveRequest,
    SavedDownload,
)
from .service import YtEngineError, yt_dude_service

app = FastAPI(
    title="HeadlessX yt-dude engine",
    version="0.1.0",
)


@app.get("/health", response_model=EngineStatusResponse)
async def health() -> EngineStatusResponse:
    return EngineStatusResponse(
        status="online",
        ffmpeg_available=yt_dude_service.ffmpeg_available(),
        temp_dir=str(yt_dude_service._temp_dir()),
        job_ttl_hours=yt_dude_service._job_ttl_hours(),
    )


@app.post("/extract/info", response_model=EngineInfoResponse)
async def extract_info(request: ExtractionRequest) -> EngineInfoResponse:
    return yt_dude_service.extract(request)


@app.post("/extract/formats", response_model=EngineInfoResponse)
async def extract_formats(request: ExtractionRequest) -> EngineInfoResponse:
    request.include_formats = True
    request.include_subtitles = False
    return yt_dude_service.extract(request)


@app.post("/extract/subtitles", response_model=EngineInfoResponse)
async def extract_subtitles(request: ExtractionRequest) -> EngineInfoResponse:
    request.include_formats = False
    request.include_subtitles = True
    return yt_dude_service.extract(request)


@app.post("/save/video", response_model=SavedDownload)
async def save_video(request: SaveRequest) -> SavedDownload:
    return yt_dude_service.save_video(request)


@app.get("/download/{job_id}")
async def download_job(job_id: str) -> FileResponse:
    zip_path, zip_name = yt_dude_service.get_download_path(job_id)
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=zip_name,
    )


@app.delete("/download/{job_id}", response_model=DeleteDownloadResponse)
async def delete_download(job_id: str) -> DeleteDownloadResponse:
    return yt_dude_service.delete_job(job_id)


@app.exception_handler(YtEngineError)
async def yt_engine_error_handler(_, error: YtEngineError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={"success": False, "error": {"code": "YT_ENGINE_ERROR", "message": error.message}},
    )

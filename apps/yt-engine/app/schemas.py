from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class ExtractionRequest(BaseModel):
    url: HttpUrl | str
    flat_playlist: bool = True
    include_formats: bool = True
    include_subtitles: bool = True
    playlist_preview_limit: int = Field(default=10, ge=1, le=50)
    player_client_profile: Literal["mobile", "default", "web", "tv"] = "mobile"
    metadata_language: str | None = Field(default=None, min_length=2, max_length=16)
    socket_timeout: int = Field(default=30, ge=10, le=180)


class SaveRequest(BaseModel):
    url: HttpUrl | str
    quality_preset: Literal["best", "1080p", "720p", "480p"] = "best"
    format_id: str | None = Field(default=None, min_length=1, max_length=64)
    player_client_profile: Literal["mobile", "default", "web", "tv"] = "mobile"
    metadata_language: str | None = Field(default=None, min_length=2, max_length=16)
    socket_timeout: int = Field(default=30, ge=10, le=180)
    cleanup_job_id: str | None = Field(default=None, min_length=1, max_length=128)


class SubtitleTrack(BaseModel):
    ext: str | None = None
    url: str | None = None
    name: str | None = None


class FormatInfo(BaseModel):
    format_id: str | None = None
    ext: str | None = None
    format_note: str | None = None
    resolution: str | None = None
    width: int | None = None
    height: int | None = None
    vcodec: str | None = None
    acodec: str | None = None
    fps: float | None = None
    filesize: int | None = None
    filesize_approx: int | None = None
    protocol: str | None = None
    dynamic_range: str | None = None


class PreviewSource(BaseModel):
    url: str | None = None
    format_id: str | None = None
    ext: str | None = None
    resolution: str | None = None
    width: int | None = None
    height: int | None = None
    mime_type: str | None = None
    format_note: str | None = None


class PlaylistEntry(BaseModel):
    id: str | None = None
    title: str | None = None
    url: str | None = None
    duration: int | None = None
    channel: str | None = None
    availability: str | None = None


class ExtractedInfo(BaseModel):
    id: str | None = None
    extractor: str | None = None
    extractor_key: str | None = None
    webpage_url: str
    original_url: str
    title: str | None = None
    description: str | None = None
    duration: int | None = None
    view_count: int | None = None
    like_count: int | None = None
    comment_count: int | None = None
    live_status: str | None = None
    availability: str | None = None
    age_limit: int | None = None
    uploader: str | None = None
    channel: str | None = None
    channel_id: str | None = None
    uploader_id: str | None = None
    upload_date: str | None = None
    release_date: str | None = None
    thumbnail: str | None = None
    tags: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    duration_string: str | None = None
    is_playlist: bool = False
    playlist_count: int | None = None
    entries: list[PlaylistEntry] = Field(default_factory=list)


class SubtitleInventory(BaseModel):
    subtitles: dict[str, list[SubtitleTrack]] = Field(default_factory=dict)
    automatic_captions: dict[str, list[SubtitleTrack]] = Field(default_factory=dict)


class EngineMetadata(BaseModel):
    service: str = "yt-dude-v1"
    player_client_profile: Literal["mobile", "default", "web", "tv"]
    metadata_language: str | None = None
    socket_timeout: int


class EngineInfoResponse(BaseModel):
    engine: EngineMetadata
    info: ExtractedInfo
    preview: PreviewSource | None = None
    formats: list[FormatInfo] = Field(default_factory=list)
    subtitles: SubtitleInventory = Field(default_factory=SubtitleInventory)


class SavedDownload(BaseModel):
    job_id: str
    download_name: str
    media_file_name: str
    metadata_file_name: str
    resolved_format: str
    size_bytes: int
    available_until: str | None = None


class DeleteDownloadResponse(BaseModel):
    success: bool = True
    job_id: str


class EngineStatusResponse(BaseModel):
    status: Literal["online"]
    configured: bool = True
    service: str = "yt-dude-v1"
    ffmpeg_available: bool = True
    temp_dir: str | None = None
    job_ttl_hours: int = 12

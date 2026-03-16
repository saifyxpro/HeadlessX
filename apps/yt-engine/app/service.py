from __future__ import annotations

import mimetypes
import os
import re
import shutil
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from yt_dude import YoutubeDL
from yt_dude.utils import DownloadError

from .schemas import (
    DeleteDownloadResponse,
    EngineInfoResponse,
    EngineMetadata,
    ExtractedInfo,
    ExtractionRequest,
    FormatInfo,
    PlaylistEntry,
    PreviewSource,
    SaveRequest,
    SavedDownload,
    SubtitleInventory,
    SubtitleTrack,
)


class YtEngineError(Exception):
    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


PLAYER_CLIENT_PROFILES: dict[str, list[str] | None] = {
    "mobile": ["ios", "android"],
    "default": None,
}

YOUTUBE_FORMAT_EXTRACTION_ARGS = ["duplicate", "dashy", "missing_pot", "incomplete"]

DOWNLOAD_FORMAT_PRESETS: dict[str, tuple[str, str]] = {
    "best": ("bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b", "Best MP4"),
    "1080p": (
        "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4][height<=1080]/bv*[height<=1080]+ba/b[height<=1080]/best[height<=1080]/best",
        "1080p MP4",
    ),
    "720p": (
        "bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[ext=mp4][height<=720]/bv*[height<=720]+ba/b[height<=720]/best[height<=720]/best",
        "720p MP4",
    ),
    "480p": (
        "bv*[ext=mp4][height<=480]+ba[ext=m4a]/b[ext=mp4][height<=480]/bv*[height<=480]+ba/b[height<=480]/best[height<=480]/best",
        "480p MP4",
    ),
}

SKIP_MEDIA_SUFFIXES = {".part", ".ytdl", ".zip", ".md", ".json"}


def _build_track_list(value: Any) -> list[SubtitleTrack]:
    if not isinstance(value, list):
        return []

    tracks: list[SubtitleTrack] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        tracks.append(
            SubtitleTrack(
                ext=item.get("ext"),
                url=item.get("url"),
                name=item.get("name"),
            )
        )
    return tracks


def _build_subtitle_inventory(info: dict[str, Any]) -> SubtitleInventory:
    subtitles = {
        language: _build_track_list(tracks)
        for language, tracks in (info.get("subtitles") or {}).items()
    }
    automatic_captions = {
        language: _build_track_list(tracks)
        for language, tracks in (info.get("automatic_captions") or {}).items()
    }
    return SubtitleInventory(
        subtitles=subtitles,
        automatic_captions=automatic_captions,
    )


def _build_formats(info: dict[str, Any]) -> list[FormatInfo]:
    formats: list[FormatInfo] = []
    for item in info.get("formats") or []:
        if not isinstance(item, dict):
            continue
        if item.get("vcodec") in (None, "none") and item.get("acodec") in (None, "none"):
            continue
        resolution = item.get("resolution")
        width = item.get("width")
        height = item.get("height")
        if not resolution and width and height:
            resolution = f"{width}x{height}"

        formats.append(
            FormatInfo(
                format_id=item.get("format_id"),
                ext=item.get("ext"),
                format_note=item.get("format_note"),
                resolution=resolution,
                width=width,
                height=height,
                vcodec=item.get("vcodec"),
                acodec=item.get("acodec"),
                fps=item.get("fps"),
                filesize=item.get("filesize"),
                filesize_approx=item.get("filesize_approx"),
                protocol=item.get("protocol"),
                dynamic_range=item.get("dynamic_range"),
            )
        )
    return formats


def _is_saveable_format(format_item: FormatInfo) -> bool:
    format_id = (format_item.format_id or "").lower()
    format_note = (format_item.format_note or "").upper()
    protocol = (format_item.protocol or "").lower()

    if not format_item.format_id:
        return False

    if "dashy" in format_id:
        return False

    if "MISSING POT" in format_note:
        return False

    if protocol and protocol not in {"https", "http"}:
        return False

    return True


def _build_entries(info: dict[str, Any], limit: int) -> list[PlaylistEntry]:
    entries: list[PlaylistEntry] = []
    for item in (info.get("entries") or [])[:limit]:
        if not isinstance(item, dict):
            continue

        url = item.get("webpage_url") or item.get("url")
        if isinstance(url, str) and not url.startswith("http") and item.get("id"):
            url = f"https://www.youtube.com/watch?v={item.get('id')}"

        entries.append(
            PlaylistEntry(
                id=item.get("id"),
                title=item.get("title"),
                url=url,
                duration=item.get("duration"),
                channel=item.get("channel") or item.get("uploader"),
                availability=item.get("availability"),
            )
        )
    return entries


def _build_info(info: dict[str, Any], request: ExtractionRequest) -> ExtractedInfo:
    entries = _build_entries(info, request.playlist_preview_limit)
    webpage_url = info.get("webpage_url") or info.get("original_url") or str(request.url)

    return ExtractedInfo(
        id=info.get("id"),
        extractor=info.get("extractor"),
        extractor_key=info.get("extractor_key"),
        webpage_url=webpage_url,
        original_url=str(request.url),
        title=info.get("title"),
        description=info.get("description"),
        duration=info.get("duration"),
        view_count=info.get("view_count"),
        like_count=info.get("like_count"),
        comment_count=info.get("comment_count"),
        live_status=info.get("live_status"),
        availability=info.get("availability"),
        age_limit=info.get("age_limit"),
        uploader=info.get("uploader"),
        channel=info.get("channel"),
        channel_id=info.get("channel_id"),
        uploader_id=info.get("uploader_id"),
        upload_date=info.get("upload_date"),
        release_date=info.get("release_date"),
        thumbnail=info.get("thumbnail"),
        tags=info.get("tags") or [],
        categories=info.get("categories") or [],
        duration_string=info.get("duration_string"),
        is_playlist=bool(info.get("_type") == "playlist" or info.get("playlist_count") or info.get("entries")),
        playlist_count=info.get("playlist_count"),
        entries=entries,
    )


def _sanitize_filename(value: str) -> str:
    cleaned = re.sub(r"[\\/:*?\"<>|]+", " ", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ._-")
    cleaned = cleaned[:96].strip()
    return cleaned or "youtube-download"


def _build_markdown(response: EngineInfoResponse, requested_url: str) -> str:
    info = response.info
    engine = response.engine
    preview = response.preview

    lines = [
        "# YouTube Extract",
        "",
        "## Request",
        "",
        f"- URL: {requested_url}",
        f"- Engine: {engine.service}",
        f"- Player Client: {engine.player_client_profile}",
        f"- Socket Timeout: {engine.socket_timeout}s",
    ]

    if engine.metadata_language:
        lines.append(f"- Metadata Language: {engine.metadata_language}")

    lines.extend(
        [
            "",
            "## Video",
            "",
            f"- Title: {info.title or 'N/A'}",
            f"- Webpage: {info.webpage_url}",
            f"- Extractor: {info.extractor or 'N/A'}",
            f"- Extractor Key: {info.extractor_key or 'N/A'}",
            f"- Channel: {info.channel or info.uploader or 'N/A'}",
            f"- Duration: {info.duration_string or info.duration or 'N/A'}",
            f"- Upload Date: {info.upload_date or 'N/A'}",
            f"- Release Date: {info.release_date or 'N/A'}",
            f"- Views: {info.view_count if info.view_count is not None else 'N/A'}",
            f"- Likes: {info.like_count if info.like_count is not None else 'N/A'}",
            f"- Comments: {info.comment_count if info.comment_count is not None else 'N/A'}",
            f"- Live Status: {info.live_status or 'N/A'}",
            f"- Availability: {info.availability or 'N/A'}",
            f"- Age Limit: {info.age_limit if info.age_limit is not None else 'N/A'}",
            f"- Thumbnail: {info.thumbnail or 'N/A'}",
        ]
    )

    if preview and preview.url:
        lines.extend(
            [
                "",
                "## Preview",
                "",
                f"- Format ID: {preview.format_id or 'N/A'}",
                f"- Container: {preview.ext or 'N/A'}",
                f"- Resolution: {preview.resolution or 'N/A'}",
                f"- MIME Type: {preview.mime_type or 'N/A'}",
                f"- Source URL: {preview.url}",
            ]
        )

    if info.tags:
        lines.extend(["", "## Tags", "", *[f"- {tag}" for tag in info.tags]])

    if info.categories:
        lines.extend(["", "## Categories", "", *[f"- {category}" for category in info.categories]])

    if info.description:
        lines.extend(["", "## Description", "", info.description])

    if response.formats:
        lines.extend(["", "## Formats", ""])
        for format_item in response.formats:
            summary_parts = [
                format_item.ext or "n/a",
                format_item.resolution or "n/a",
                format_item.format_note or "n/a",
                f"fps={format_item.fps}" if format_item.fps is not None else None,
                f"v={format_item.vcodec}" if format_item.vcodec else None,
                f"a={format_item.acodec}" if format_item.acodec else None,
                f"protocol={format_item.protocol}" if format_item.protocol else None,
            ]
            lines.append(
                f"- {format_item.format_id or 'unknown'}: "
                + " | ".join(part for part in summary_parts if part)
            )

    if response.subtitles.subtitles:
        lines.extend(["", "## Subtitles", ""])
        for language, tracks in response.subtitles.subtitles.items():
            lines.append(f"- {language}: " + ", ".join(
                " / ".join(filter(None, [track.ext, track.name, track.url]))
                for track in tracks
            ))

    if response.subtitles.automatic_captions:
        lines.extend(["", "## Automatic Captions", ""])
        for language, tracks in response.subtitles.automatic_captions.items():
            lines.append(f"- {language}: " + ", ".join(
                " / ".join(filter(None, [track.ext, track.name, track.url]))
                for track in tracks
            ))

    if info.entries:
        lines.extend(["", "## Playlist Preview", ""])
        for index, entry in enumerate(info.entries, start=1):
            lines.append(
                f"{index}. {entry.title or 'Entry'}"
                + (f" ({entry.url})" if entry.url else "")
            )

    return "\n".join(lines)


class YtDudeService:
    def _repo_root(self) -> Path:
        return Path(__file__).resolve().parents[3]

    def _temp_dir(self) -> Path:
        configured = os.getenv("YT_ENGINE_TEMP_DIR", "").strip()
        path = Path(configured) if configured else self._repo_root() / "tmp" / "yt-engine"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def _job_ttl_hours(self) -> int:
        raw_value = os.getenv("YT_ENGINE_JOB_TTL_HOURS", "").strip()
        parsed = int(raw_value) if raw_value.isdigit() else 12
        return parsed if parsed > 0 else 12

    def ffmpeg_available(self) -> bool:
        return shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None

    def cleanup_old_jobs(self) -> None:
        job_root = self._temp_dir()
        expiry_cutoff = datetime.now(timezone.utc) - timedelta(hours=self._job_ttl_hours())

        for job_dir in job_root.iterdir():
            if not job_dir.is_dir():
                continue
            try:
                last_modified = datetime.fromtimestamp(job_dir.stat().st_mtime, tz=timezone.utc)
            except OSError:
                continue
            if last_modified < expiry_cutoff:
                shutil.rmtree(job_dir, ignore_errors=True)

    def delete_job(self, job_id: str) -> DeleteDownloadResponse:
        target = self._temp_dir() / job_id
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)
        return DeleteDownloadResponse(job_id=job_id)

    def _build_common_options(
        self,
        *,
        player_client_profile: str,
        metadata_language: str | None,
        socket_timeout: int,
        include_all_formats: bool = False,
    ) -> dict[str, Any]:
        options: dict[str, Any] = {
            "quiet": True,
            "no_warnings": True,
            "ignoreerrors": False,
            "socket_timeout": socket_timeout,
        }

        if shutil.which("node"):
            options["js_runtimes"] = {"node": {}}
            options["remote_components"] = {"ejs:npm"}

        extractor_args: dict[str, dict[str, list[str]]] = {}
        youtube_args: dict[str, list[str]] = {}

        player_clients = PLAYER_CLIENT_PROFILES.get(player_client_profile)
        if player_clients:
            youtube_args["player_client"] = player_clients

        if metadata_language:
            youtube_args["lang"] = [metadata_language]

        if include_all_formats:
            youtube_args["formats"] = YOUTUBE_FORMAT_EXTRACTION_ARGS

        if youtube_args:
            extractor_args["youtube"] = youtube_args
            options["extractor_args"] = extractor_args

        return options

    def _extract_info_with_options(self, *, url: str, options: dict[str, Any]) -> dict[str, Any]:
        try:
            with YoutubeDL(options) as ydl:
                raw_info = ydl.extract_info(url, download=False)
                info = ydl.sanitize_info(raw_info)
        except DownloadError as error:
            raise YtEngineError(str(error), 400) from error
        except Exception as error:
            raise YtEngineError(str(error), 500) from error

        if not isinstance(info, dict):
            raise YtEngineError("Unable to extract media information", 500)

        return info

    def _download_with_options(self, *, url: str, options: dict[str, Any]) -> None:
        try:
            with YoutubeDL(options) as ydl:
                ydl.download([url])
        except DownloadError as error:
            raise YtEngineError(str(error), 400) from error
        except Exception as error:
            raise YtEngineError(str(error), 500) from error

    def _extract_raw_info(
        self,
        *,
        url: str,
        player_client_profile: str,
        metadata_language: str | None,
        socket_timeout: int,
        flat_playlist: bool,
    ) -> dict[str, Any]:
        options = self._build_common_options(
            player_client_profile=player_client_profile,
            metadata_language=metadata_language,
            socket_timeout=socket_timeout,
            include_all_formats=True,
        )
        options.update(
            {
                "skip_download": True,
                "extract_flat": "in_playlist" if flat_playlist else False,
                "noplaylist": False,
            }
        )

        return self._extract_info_with_options(url=url, options=options)

    def _build_preview(self, info: dict[str, Any]) -> PreviewSource | None:
        direct_mp4_candidates: list[dict[str, Any]] = []
        fallback_candidates: list[dict[str, Any]] = []

        for item in info.get("formats") or []:
            if not isinstance(item, dict):
                continue
            if item.get("vcodec") in (None, "none"):
                continue
            if not item.get("url"):
                continue
            if item.get("ext") != "mp4":
                continue

            candidate_pool = (
                direct_mp4_candidates
                if item.get("acodec") not in (None, "none")
                else fallback_candidates
            )
            candidate_pool.append(item)

        candidates = direct_mp4_candidates or fallback_candidates
        if not candidates:
            return None

        candidates.sort(
            key=lambda item: (
                int(item.get("height") or 0),
                int(item.get("width") or 0),
                1 if item.get("protocol") in ("https", "http") else 0,
            ),
            reverse=True,
        )
        selected = candidates[0]
        resolution = selected.get("resolution")
        width = selected.get("width")
        height = selected.get("height")
        if not resolution and width and height:
            resolution = f"{width}x{height}"

        return PreviewSource(
            url=selected.get("url"),
            format_id=selected.get("format_id"),
            ext=selected.get("ext"),
            resolution=resolution,
            width=width,
            height=height,
            mime_type=mimetypes.guess_type(f"preview.{selected.get('ext') or 'mp4'}")[0] or "video/mp4",
            format_note=selected.get("format_note"),
        )

    def _build_response(
        self,
        info: dict[str, Any],
        request: ExtractionRequest,
    ) -> EngineInfoResponse:
        return EngineInfoResponse(
            engine=EngineMetadata(
                player_client_profile=request.player_client_profile,
                metadata_language=request.metadata_language,
                socket_timeout=request.socket_timeout,
            ),
            info=_build_info(info, request),
            preview=self._build_preview(info),
            formats=_build_formats(info) if request.include_formats else [],
            subtitles=_build_subtitle_inventory(info) if request.include_subtitles else SubtitleInventory(),
        )

    def extract(self, request: ExtractionRequest) -> EngineInfoResponse:
        self.cleanup_old_jobs()
        info = self._extract_raw_info(
            url=str(request.url),
            player_client_profile=request.player_client_profile,
            metadata_language=request.metadata_language,
            socket_timeout=request.socket_timeout,
            flat_playlist=request.flat_playlist,
        )
        return self._build_response(info, request)

    def _build_download_selector(
        self,
        request: SaveRequest,
        formats: list[FormatInfo],
    ) -> tuple[str, str, str | None]:
        if request.format_id:
            matched = next((item for item in formats if item.format_id == request.format_id), None)
            if not matched:
                raise YtEngineError("Selected format is not available in the current extract result", 400)
            if not _is_saveable_format(matched):
                raise YtEngineError("Selected format is extracted but not directly downloadable", 400)

            summary = " | ".join(
                part
                for part in [
                    matched.ext.upper() if matched.ext else None,
                    matched.resolution,
                    matched.format_note,
                ]
                if part
            )
            has_video = matched.vcodec not in (None, "none")
            has_audio = matched.acodec not in (None, "none")

            if not has_video:
                raise YtEngineError("Selected format does not contain video", 400)

            selector = request.format_id
            merge_output_format = None

            # When the user picks a video-only extracted format, merge in the best audio
            # automatically so the downloaded file is still usable by default.
            if has_video and not has_audio:
                selector = f"{request.format_id}+ba/b"

            if matched.ext == "mp4" and has_video:
                merge_output_format = "mp4"

            return selector, summary or request.format_id, merge_output_format

        preset_selector, preset_label = DOWNLOAD_FORMAT_PRESETS[request.quality_preset]
        return preset_selector, preset_label, "mp4"

    def _build_download_options(
        self,
        *,
        player_client_profile: str,
        request: SaveRequest,
        selector: str,
        output_template: str,
        merge_output_format: str | None,
    ) -> dict[str, Any]:
        options = self._build_common_options(
            player_client_profile=player_client_profile,
            metadata_language=request.metadata_language,
            socket_timeout=request.socket_timeout,
        )
        options.update(
            {
                "format": selector,
                "outtmpl": output_template,
                "noplaylist": True,
                "noprogress": True,
                "overwrites": True,
                "windowsfilenames": True,
                "continuedl": True,
            }
        )
        if merge_output_format:
            options["merge_output_format"] = merge_output_format
        return options

    def _download_video(
        self,
        *,
        url: str,
        request: SaveRequest,
        selector: str,
        output_template: str,
        merge_output_format: str | None,
        player_client_profile: str,
    ) -> None:
        options = self._build_download_options(
            player_client_profile=player_client_profile,
            request=request,
            selector=selector,
            output_template=output_template,
            merge_output_format=merge_output_format,
        )
        self._download_with_options(url=url, options=options)

    def _find_media_files(self, job_dir: Path) -> list[Path]:
        files = [
            item
            for item in job_dir.iterdir()
            if item.is_file()
            and item.suffix.lower() not in SKIP_MEDIA_SUFFIXES
            and not item.name.startswith(".")
        ]
        files.sort(key=lambda item: item.stat().st_size if item.exists() else 0, reverse=True)
        return files

    def save_video(self, request: SaveRequest) -> SavedDownload:
        self.cleanup_old_jobs()

        if request.cleanup_job_id:
            self.delete_job(request.cleanup_job_id)

        if not self.ffmpeg_available():
            raise YtEngineError("ffmpeg and ffprobe are required for MP4 downloads", 503)

        extraction_request = ExtractionRequest(
            url=request.url,
            flat_playlist=False,
            include_formats=True,
            include_subtitles=True,
            playlist_preview_limit=10,
            player_client_profile=request.player_client_profile,
            metadata_language=request.metadata_language,
            socket_timeout=request.socket_timeout,
        )
        info = self._extract_raw_info(
            url=str(request.url),
            player_client_profile=request.player_client_profile,
            metadata_language=request.metadata_language,
            socket_timeout=request.socket_timeout,
            flat_playlist=False,
        )
        response = self._build_response(info, extraction_request)

        if response.info.is_playlist:
            raise YtEngineError("Playlist downloads are not supported from the extract panel yet", 400)

        selector, resolved_format, merge_output_format = self._build_download_selector(request, response.formats)

        job_id = uuid4().hex
        job_dir = self._temp_dir() / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        safe_stem = _sanitize_filename(response.info.title or response.info.id or "youtube-download")
        output_template = str(job_dir / f"{safe_stem}.%(ext)s")

        try:
            self._download_video(
                url=str(request.url),
                request=request,
                selector=selector,
                output_template=output_template,
                merge_output_format=merge_output_format,
                player_client_profile=request.player_client_profile,
            )
        except Exception as error:
            shutil.rmtree(job_dir, ignore_errors=True)
            if isinstance(error, YtEngineError):
                raise
            raise YtEngineError(str(error), 500) from error

        metadata_path = job_dir / "metadata.md"
        metadata_path.write_text(_build_markdown(response, str(request.url)), encoding="utf-8")

        media_files = self._find_media_files(job_dir)
        if not media_files:
            shutil.rmtree(job_dir, ignore_errors=True)
            raise YtEngineError("yt-dude did not produce a downloadable media file", 500)

        zip_name = f"{safe_stem}.zip"
        zip_path = job_dir / zip_name
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.write(metadata_path, arcname="metadata.md")
            for media_file in media_files:
                archive.write(media_file, arcname=media_file.name)

        available_until = datetime.now(timezone.utc) + timedelta(hours=self._job_ttl_hours())

        return SavedDownload(
            job_id=job_id,
            download_name=zip_name,
            media_file_name=media_files[0].name,
            metadata_file_name=metadata_path.name,
            resolved_format=resolved_format,
            size_bytes=zip_path.stat().st_size,
            available_until=available_until.isoformat(),
        )

    def get_download_path(self, job_id: str) -> tuple[Path, str]:
        self.cleanup_old_jobs()
        job_dir = self._temp_dir() / job_id
        if not job_dir.exists():
            raise YtEngineError("Download job not found", 404)

        zip_files = sorted(item for item in job_dir.iterdir() if item.is_file() and item.suffix.lower() == ".zip")
        if not zip_files:
            raise YtEngineError("Download archive not found", 404)

        zip_path = zip_files[0]
        return zip_path, zip_path.name


yt_dude_service = YtDudeService()

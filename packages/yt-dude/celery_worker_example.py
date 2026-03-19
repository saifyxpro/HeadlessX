"""
Celery Worker for Reliable 24/7 YouTube Downloads with yt-dude

This script sets up a Celery task that utilizes our modified `yt-dude` library
to download videos systematically while avoiding YouTube's throttling schemas.
By default, yt-dude now injects iOS/Android client extraction and sleep internals,
meaning you don't need to specify them here manually.

To run:
1. Ensure Redis is running: `redis-server`
2. Start the worker: `celery -A celery_worker_example worker --loglevel=info`
"""

import os
import certifi
from celery import Celery
from celery.schedules import crontab
from datetime import timedelta

import yt_dude

# Setup Celery with a Redis broker
app = Celery(
    'youtube_downloader',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

# Optional: Configuration for the beat scheduler for running tasks every 2 hours
app.conf.beat_schedule = {
    'download-videos-every-2-hours': {
        'task': 'celery_worker_example.download_channel',
        'schedule': timedelta(hours=2),
        'args': ('https://www.youtube.com/@SomeChannelOrPlaylist',),
    },
}
app.conf.timezone = 'UTC'

@app.task(bind=True, max_retries=3, default_retry_delay=300)
def download_channel(self, url: str, output_directory: str = './downloads'):
    """
    Downloads videos from a channel or playlist. 
    Uses `yt_dude` standard Python API which has our anti-throttle overrides compiled in.
    """
    os.makedirs(output_directory, exist_ok=True)
    
    # Base options for yt-dude.
    # Note: Anti-throttling options (sleep_interval and iOS player_client) 
    # are now hardcoded as defaults deeply in YoutubeDude so they don't *must* be included here.
    ydl_opts = {
        'outtmpl': os.path.join(output_directory, '%(title)s.%(ext)s'),
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        
        # Highly recommended to pass logged-in cookies for stable extraction:
        # 'cookiefile': '/path/to/valid_youtube_cookies.txt',
        
        # Best Practice: Limit the download playlist length if scheduling every 2 hours
        'playlistend': 50,
        
        # Logging & Ignoring errors to keep the worker alive across long playlists
        'ignoreerrors': True,
        'quiet': False,
        'no_warnings': True,
    }

    try:
        with yt_dude.YoutubeDL(ydl_opts) as ydl:
            print(f"[Worker] Initiating reliable extraction for: {url}")
            # The download function executes in a blocking sync manner
            ydl.download([url])
            return f"Successfully processed items for {url}"
            
    except yt_dude.utils.DownloadError as e:
        print(f"[Worker] Download explicitly failed: {e}")
        # Automatically retry the Celery task after 5 minutes if there's a hard block
        raise self.retry(exc=e)
    except Exception as e:
        print(f"[Worker] Unexpected crash: {e}")
        raise

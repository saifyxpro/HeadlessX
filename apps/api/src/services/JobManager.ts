import type { StreamProgress, StreamScrapeResult } from './StreamingScraperService';
import { randomUUID } from 'crypto';
import type { Page } from 'playwright-core';

export interface Job {
    id: string;
    url: string;
    type: 'html' | 'html-js' | 'html-css-js' | 'content' | 'screenshot';
    options: {
        waitForSelector?: string;
        timeout?: number;
        fullPage?: boolean;
    };
    status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
    progress: StreamProgress[];
    result?: StreamScrapeResult;
    error?: string;
    createdAt: number;
    updatedAt: number;
    // SSE listeners for broadcasting progress
    listeners: Set<(event: string, data: any) => void>;
    abortController: AbortController;
    activePage: Page | null;
}

const JOB_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

class JobManager {
    private static instance: JobManager;
    private jobs: Map<string, Job> = new Map();
    private activeJobId: string | null = null;

    private constructor() {
        // Cleanup expired jobs every minute
        setInterval(() => this.cleanupExpiredJobs(), 60 * 1000);
    }

    public static getInstance(): JobManager {
        if (!JobManager.instance) {
            JobManager.instance = new JobManager();
        }
        return JobManager.instance;
    }

    /**
     * Create a new job and set it as active
     */
    public createJob(
        url: string,
        type: Job['type'],
        options: Job['options']
    ): Job {
        const job: Job = {
            id: randomUUID(),
            url,
            type,
            options,
            status: 'pending',
            progress: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            listeners: new Set(),
            abortController: new AbortController(),
            activePage: null
        };

        this.jobs.set(job.id, job);
        this.activeJobId = job.id;
        console.log(`📋 Job created: ${job.id}`);
        return job;
    }

    /**
     * Get a job by ID
     */
    public getJob(jobId: string): Job | undefined {
        return this.jobs.get(jobId);
    }

    /**
     * Get the currently active (running) job
     */
    public getActiveJob(): Job | null {
        if (!this.activeJobId) return null;
        const job = this.jobs.get(this.activeJobId);
        if (!job || job.status === 'completed' || job.status === 'error' || job.status === 'cancelled') {
            return null;
        }
        return job;
    }

    /**
     * Update job status
     */
    public updateStatus(jobId: string, status: Job['status']) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.status = status;
            job.updatedAt = Date.now();
            console.log(`📋 Job ${jobId} status: ${status}`);
        }
    }

    /**
     * Add progress update to job and broadcast to all listeners
     */
    public updateProgress(jobId: string, progress: StreamProgress) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.progress.push(progress);
            job.updatedAt = Date.now();
            // Broadcast to all listeners
            job.listeners.forEach(listener => {
                try {
                    listener('progress', progress);
                } catch (e) {
                    console.error('Error broadcasting progress:', e);
                }
            });
        }
    }

    /**
     * Complete job with result and broadcast to all listeners
     */
    public completeJob(jobId: string, result: StreamScrapeResult) {
        const job = this.jobs.get(jobId);
        if (job) {
            if (job.status === 'cancelled' || result.cancelled) {
                job.status = 'cancelled';
            } else {
                job.status = result.success ? 'completed' : 'error';
            }
            job.result = result;
            job.error = result.cancelled ? 'Job cancelled' : result.error;
            job.updatedAt = Date.now();
            job.activePage = null;

            if (this.activeJobId === jobId) {
                this.activeJobId = null;
            }

            console.log(`📋 Job ${jobId} completed: ${result.success ? 'success' : 'error'}`);
        }
    }

    /**
     * Cancel a job
     */
    public cancelJob(jobId: string) {
        const job = this.jobs.get(jobId);
        if (job && job.status !== 'completed' && job.status !== 'error' && job.status !== 'cancelled') {
            job.status = 'cancelled';
            job.updatedAt = Date.now();
            job.abortController.abort();

            if (job.activePage && !job.activePage.isClosed()) {
                job.activePage.close().catch(() => { });
            }
            job.activePage = null;

            if (this.activeJobId === jobId) {
                this.activeJobId = null;
            }

            // Notify all listeners
            job.listeners.forEach(listener => {
                try {
                    listener('cancelled', { jobId });
                } catch (e) {
                    console.error('Error broadcasting cancellation:', e);
                }
            });

            console.log(`📋 Job ${jobId} cancelled`);
        }
    }

    public attachPage(jobId: string, page: Page) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.activePage = page;
            job.updatedAt = Date.now();
        }
    }

    public detachPage(jobId: string, page?: Page) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return;
        }

        if (!page || job.activePage === page) {
            job.activePage = null;
            job.updatedAt = Date.now();
        }
    }

    public getAbortSignal(jobId: string): AbortSignal | undefined {
        return this.jobs.get(jobId)?.abortController.signal;
    }

    public isCancelled(jobId: string): boolean {
        return this.jobs.get(jobId)?.status === 'cancelled';
    }

    /**
     * Add a listener for job updates (for SSE reconnection)
     */
    public addListener(jobId: string, listener: (event: string, data: any) => void) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.listeners.add(listener);
        }
    }

    /**
     * Remove a listener
     */
    public removeListener(jobId: string, listener: (event: string, data: any) => void) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.listeners.delete(listener);
        }
    }

    /**
     * Broadcast event to all listeners of a job
     */
    public broadcast(jobId: string, event: string, data: any) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.listeners.forEach(listener => {
                try {
                    listener(event, data);
                } catch (e) {
                    console.error('Error broadcasting:', e);
                }
            });
        }
    }

    /**
     * Cleanup expired jobs
     */
    private cleanupExpiredJobs() {
        const now = Date.now();
        for (const [jobId, job] of this.jobs) {
            if (now - job.updatedAt > JOB_EXPIRY_MS) {
                this.jobs.delete(jobId);
                console.log(`🗑️ Expired job cleaned up: ${jobId}`);
            }
        }
    }
}

export const jobManager = JobManager.getInstance();

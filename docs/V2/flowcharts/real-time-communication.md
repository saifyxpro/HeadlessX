```mermaid
sequenceDiagram
    participant Client as Browser Client
    participant NextJS as Next.js Server
    participant WSServer as WebSocket Server
    participant Redis as Redis Pub/Sub
    participant Worker as Job Worker
    participant DB as Database
    
    %% Initial Connection
    rect rgb(230, 255, 230)
        Note over Client,WSServer: WebSocket Connection Setup
        Client->>NextJS: Load Dashboard Page
        NextJS-->>Client: HTML + WebSocket Client Code
        Client->>WSServer: Connect WebSocket
        WSServer->>WSServer: Authenticate Connection
        WSServer->>Redis: Subscribe to User Channel
        Redis-->>WSServer: Subscribed
        WSServer-->>Client: Connection Established
        Client->>Client: Display "Connected" Status
    end
    
    %% Job Submission
    rect rgb(230, 245, 255)
        Note over Client,Worker: Job Creation & Subscription
        Client->>NextJS: POST /api/scrape {url, config}
        NextJS->>DB: Create Job Record
        DB-->>NextJS: Job Created (ID: 12345)
        NextJS->>Redis: Publish job:created event
        NextJS-->>Client: 202 Accepted {jobId: 12345}
        
        Client->>WSServer: Subscribe to job:12345
        WSServer->>Redis: Subscribe to job:12345:*
        Redis-->>WSServer: Subscription Active
        WSServer-->>Client: Subscribed to Job Updates
    end
    
    %% Job Processing with Real-time Updates
    rect rgb(255, 245, 230)
        Note over Worker,Client: Job Execution with Live Updates
        
        Worker->>Redis: Get Next Job
        Redis-->>Worker: Job 12345
        Worker->>DB: Update Status: running
        Worker->>Redis: Publish job:12345:status
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: job_started
        Client->>Client: Show Progress Bar (0%)
        
        Worker->>Worker: Launch Browser
        Worker->>Redis: Publish job:12345:progress
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: browser_launched (10%)
        Client->>Client: Update Progress Bar (10%)
        
        Worker->>Worker: Navigate to URL
        Worker->>Redis: Publish job:12345:progress
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: navigating {url}
        Client->>Client: Show "Navigating..." (20%)
        
        Worker->>Worker: Page Loaded
        Worker->>Redis: Publish job:12345:progress
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: page_loaded {title}
        Client->>Client: Update Progress (40%)
        
        Worker->>Worker: Apply Stealth
        Worker->>Redis: Publish job:12345:log
        Redis->>WSServer: Forward Event
        WSServer->>Client: Log: "Applying anti-detection..."
        Client->>Client: Append to Log Viewer
        
        Worker->>Worker: Simulate Behavior
        Worker->>Redis: Publish job:12345:progress
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: behavior_simulated (60%)
        Client->>Client: Update Progress (60%)
        
        Worker->>Worker: Extract Data
        Worker->>Redis: Publish job:12345:progress
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: extracting_data
        Client->>Client: Show "Extracting data..." (75%)
        
        Worker->>Worker: Data Extracted
        Worker->>Redis: Publish job:12345:preview
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: data_preview {sample}
        Client->>Client: Show Data Preview (90%)
        
        Worker->>DB: Save Results
        DB-->>Worker: Results Saved
        Worker->>Redis: Publish job:12345:completed
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: job_completed {results}
        Client->>Client: Show Success (100%)
        Client->>Client: Enable "View Results" Button
    end
    
    %% Multiple Clients Sync
    rect rgb(255, 230, 255)
        Note over Client,WSServer: Multi-Client Synchronization
        participant Client2 as Another Browser Tab
        
        Client2->>WSServer: Connect WebSocket
        WSServer-->>Client2: Connected
        Client2->>WSServer: Subscribe to job:12345
        WSServer-->>Client2: Current Status: completed
        
        Worker->>Redis: Publish job:12345:export
        Redis->>WSServer: Forward to All Subscribers
        WSServer->>Client: Event: export_ready
        WSServer->>Client2: Event: export_ready
        Client->>Client: Show Download Button
        Client2->>Client2: Show Download Button
    end
    
    %% System-wide Notifications
    rect rgb(245, 245, 255)
        Note over WSServer,Client: Broadcast Notifications
        WSServer->>Redis: Publish system:maintenance
        Redis->>WSServer: Forward to All Connections
        WSServer->>Client: Event: system_notification
        WSServer->>Client2: Event: system_notification
        Client->>Client: Show Toast: "Maintenance in 1 hour"
        Client2->>Client2: Show Toast: "Maintenance in 1 hour"
    end
    
    %% Analytics Updates
    rect rgb(230, 245, 255)
        Note over Client,WSServer: Real-time Analytics
        Client->>WSServer: Subscribe to analytics:realtime
        WSServer->>Redis: Subscribe to analytics:*
        
        loop Every 5 seconds
            Worker->>Redis: Publish analytics:metrics
            Redis->>WSServer: Forward Metrics
            WSServer->>Client: Event: metrics_update {data}
            Client->>Client: Update Charts
        end
    end
    
    %% Workflow Execution Updates
    rect rgb(255, 245, 245)
        Note over Client,WSServer: Workflow Real-time Updates
        Client->>WSServer: Subscribe to workflow:abc123
        WSServer->>Redis: Subscribe to workflow:abc123:*
        
        Worker->>Redis: Publish workflow:abc123:node_started
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: node_executing {nodeId: "scrape-1"}
        Client->>Client: Highlight Active Node
        
        Worker->>Redis: Publish workflow:abc123:node_completed
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: node_done {nodeId: "scrape-1"}
        Client->>Client: Mark Node Complete
        
        Worker->>Redis: Publish workflow:abc123:completed
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: workflow_finished
        Client->>Client: Show Success Animation
    end
    
    %% Error Handling
    rect rgb(255, 230, 230)
        Note over Worker,Client: Error Scenario
        Worker->>Worker: Error Occurred
        Worker->>Redis: Publish job:12345:error
        Redis->>WSServer: Forward Event
        WSServer->>Client: Event: job_failed {error}
        Client->>Client: Show Error Details
        Client->>Client: Show "Retry" Button
        
        Client->>WSServer: Request AI suggestions
        WSServer->>NextJS: Get suggestions for job:12345
        NextJS-->>WSServer: AI Recommendations
        WSServer->>Client: Event: suggestions_ready
        Client->>Client: Display Fix Suggestions
    end
    
    %% Disconnection & Reconnection
    rect rgb(245, 230, 255)
        Note over Client,WSServer: Connection Management
        Client->>Client: Network Interruption
        Client->>WSServer: Connection Lost
        WSServer->>Redis: Unsubscribe User Channels
        
        Client->>Client: Auto-reconnect (Retry)
        Client->>WSServer: Reconnect WebSocket
        WSServer->>WSServer: Re-authenticate
        WSServer->>Redis: Re-subscribe Channels
        WSServer->>DB: Get Missed Events
        DB-->>WSServer: Events Since Disconnect
        WSServer->>Client: Catch-up Events
        Client->>Client: Sync UI State
        Client->>Client: Show "Reconnected"
    end
    
    %% Cleanup
    rect rgb(240, 240, 240)
        Note over Client,WSServer: Connection Cleanup
        Client->>Client: User Closes Tab
        Client->>WSServer: Disconnect
        WSServer->>Redis: Unsubscribe All Channels
        WSServer->>WSServer: Clean Session Data
        Redis-->>WSServer: Unsubscribed
    end
```

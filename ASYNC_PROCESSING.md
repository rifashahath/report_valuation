# Async File Processing — FastAPI + Celery + Redis (Docker)

## Architecture overview

```
Browser / API client
        │
        │  POST /api/v1/jobs/upload
        ▼
┌───────────────┐                 ┌─────────────────┐
│  FastAPI       │── task.delay ──▶│  Redis (broker)  │
│  (backend)    │                 └────────┬────────┘
└───────┬───────┘                          │ task picked up
        │ returns immediately              ▼
        │ { job_id, status_url }  ┌───────────────────┐
        │                         │  Celery Worker    │
        │  GET /api/v1/jobs/{id}  │  (process_task)   │
        │◀────────────────────────│  1. OCR           │
        │   { state, details }    │  2. Translate      │
        │                         │  3. Summarise      │
        │                         │  4. Save PDF       │
        │                         │  5. Update MongoDB │
        │                         └───────────────────┘
        │
        │  /uploads/<path>.pdf  (static)
        ▼
  Direct file download
```

---

## Files added / changed

| File | Purpose |
|------|---------|
| `api/app/celery_app.py` | Celery singleton (broker, backend, task routing) |
| `api/app/tasks/process_task.py` | The background task (OCR → translate → PDF → MongoDB) |
| `api/app/api/v1/jobs.py` | Upload, status-poll, and download endpoints |
| `api/app/main.py` | Registers the new `jobs_router` |
| `api/requirements.txt` | Adds `celery[redis]` and `redis` |
| `docker-compose.yml` | Adds healthchecks, shared volume, Flower dashboard |

---

## Quick start

```bash
# 1. Build & start everything
docker compose up --build -d

# 2. Check all services are healthy
docker compose ps

# 3. Tail the worker logs
docker compose logs -f celery_worker
```

Service URLs:
| Service | URL |
|---------|-----|
| FastAPI docs | http://localhost:8000/docs |
| Celery Flower | http://localhost:5555 |
| MailHog UI | http://localhost:8025 |

---

## API usage examples

### 1. Upload a file — returns immediately

```bash
TOKEN="<your JWT here>"

curl -X POST http://localhost:8000/api/v1/jobs/upload \
  -H "Authorization: Bearer $TOKEN"                   \
  -F "file=@/path/to/document.pdf"                    \
  -F "client_name=Acme Corp"                          \
  -F "report_id=<mongo-report-id>"
```

**Response (instant — < 100 ms)**
```json
{
  "success": true,
  "job_id": "6797d2a1f3c8e10abc123456",
  "document_id": "6797d2a1f3c8e10abc123456",
  "report_id": "6797bcf1a3c8e10abc111111",
  "file_name": "document.pdf",
  "file_size_mb": 1.234,
  "status": "queued",
  "status_url": "/api/v1/jobs/6797d2a1f3c8e10abc123456",
  "message": "File uploaded. Processing started in the background."
}
```

---

### 2. Poll status

```bash
curl http://localhost:8000/api/v1/jobs/6797d2a1f3c8e10abc123456 \
  -H "Authorization: Bearer $TOKEN"
```

**While processing:**
```json
{
  "job_id": "6797d2a1f3c8e10abc123456",
  "celery": {
    "state": "STARTED",
    "ready": false,
    "succeeded": false,
    "failed": false,
    "info": {}
  },
  "details": {
    "processing_status": "translation_started",
    "current_page": 3,
    "total_pages": 8,
    "output_pdf_path": null,
    "error_message": null,
    "completed_at": null,
    "summary": null
  }
}
```

**When completed:**
```json
{
  "job_id": "6797d2a1f3c8e10abc123456",
  "celery": {
    "state": "SUCCESS",
    "ready": true,
    "succeeded": true,
    "failed": false,
    "result": {
      "document_id": "6797d2a1f3c8e10abc123456",
      "status": "completed",
      "total_pages": 8,
      "output_pdf": "/app/uploads/2026/feb/acme_corp/6797...456_translated.pdf",
      "summary_length": 1420
    }
  },
  "details": {
    "processing_status": "completed",
    "current_page": null,
    "total_pages": 8,
    "output_pdf_path": "/app/uploads/2026/feb/acme_corp/6797...456_translated.pdf",
    "error_message": null,
    "completed_at": "2026-02-19T08:22:15.000Z",
    "summary": "This document describes a land transfer..."
  },
  "download_url": "/uploads/2026/feb/acme_corp/6797...456_translated.pdf"
}
```

---

### 3. Download the translated PDF

```bash
# Via the dedicated endpoint (auth-checked, streams the file)
curl -OJ http://localhost:8000/api/v1/jobs/6797d2a1f3c8e10abc123456/download \
  -H "Authorization: Bearer $TOKEN"

# Or directly from the static mount (URL from download_url field):
curl -O http://localhost:8000/uploads/2026/feb/acme_corp/6797...456_translated.pdf
```

---

## Status progression

```
queued          ← file saved to disk, task sent to Redis
  │
processing      ← worker picked up the task
  │
ocr_started
  │
ocr_completed   ( total_pages is set here )
  │
translation_started   ( current_page increments per page )
  │
translation_completed
  │
summarising
  │
completed       ← output_pdf_path, summary set in MongoDB
                ← Celery result stored in Redis backend
```

If anything goes wrong:
```
failed          ← error_message set in MongoDB
```

---

## Shared volume design

```yaml
# docker-compose.yml (key excerpt)
volumes:
  shared_uploads:            # named Docker volume

services:
  backend:
    volumes:
      - shared_uploads:/app/uploads   # backend writes the original file here

  celery_worker:
    volumes:
      - shared_uploads:/app/uploads   # worker reads the original & writes the output PDF
```

Both containers see **exactly the same bytes** under `/app/uploads`.  
No S3, no NFS, no HTTP — just a Docker named volume.

---

## MongoDB fields written by the worker

The `original_files` collection gains these fields:

| Field | Type | Set when |
|-------|------|----------|
| `processing_status` | `str` | Every status transition |
| `current_page` | `int` | During translation |
| `total_pages` | `int` | After OCR |
| `output_pdf_path` | `str` | After PDF is written |
| `error_message` | `str` | On failure |
| `completed_at` | `datetime` | On completion |
| `summary` | `str` | On completion |

`ai_extracted_content` gets a new document with:
- `page_results[]` — per-page OCR, legal English, and plain English
- `summary` — whole-document AI summary
- `ai_report_content` — full translated text (used for the PDF)

---

## Python polling example (frontend/integration)

```python
import time, httpx

BASE   = "http://localhost:8000"
TOKEN  = "Bearer <jwt>"
JOB_ID = "6797d2a1f3c8e10abc123456"

def poll_until_done(job_id: str, interval: int = 3, timeout: int = 600):
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = httpx.get(
            f"{BASE}/api/v1/jobs/{job_id}",
            headers={"Authorization": TOKEN},
        )
        r.raise_for_status()
        data = r.json()

        status = data["details"]["processing_status"]
        print(f"[{job_id}] {status}")

        if status == "completed":
            print("✅ Done!", data.get("download_url"))
            return data
        if status == "failed":
            print("❌ Failed:", data["details"].get("error_message"))
            return data

        time.sleep(interval)

    raise TimeoutError("Job did not complete in time")

poll_until_done(JOB_ID)
```

---

## TypeScript (React) polling example

```tsx
import { useState, useEffect, useRef } from "react";

type JobStatus =
  | "queued" | "processing" | "ocr_started" | "ocr_completed"
  | "translation_started" | "translation_completed"
  | "summarising" | "completed" | "failed";

interface JobState {
  processing_status: JobStatus;
  current_page?: number;
  total_pages?: number;
  summary?: string;
  error_message?: string;
}

function useJobPoller(jobId: string | null, token: string) {
  const [state, setState] = useState<JobState | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      const res = await fetch(`/api/v1/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setState(data.details);
      if (data.download_url) setDownloadUrl(data.download_url);

      const done = ["completed", "failed"].includes(data.details?.processing_status);
      if (done && intervalRef.current) clearInterval(intervalRef.current);
    };

    poll();  // immediate
    intervalRef.current = setInterval(poll, 3_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jobId, token]);

  return { state, downloadUrl };
}

// Usage:
// const { state, downloadUrl } = useJobPoller(jobId, authToken);
```

---

## Scaling workers

```bash
# Scale to 4 Celery worker replicas (Docker Compose v2+)
docker compose up --scale celery_worker=4 -d

# OR: increase per-worker concurrency (set in .env)
CELERY_CONCURRENCY=4 docker compose up -d celery_worker
```

---

## Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Worker can't find the file | Volumes not shared | Use `shared_uploads` named volume in both `backend` and `celery_worker` |
| Task stays `PENDING` forever | Worker not running / wrong queue | `docker compose ps`, check `celery_worker` is up and using `--queues=document_processing` |
| `KeyError: 'OPENAI_API_KEY'` | Env var missing in worker | Ensure `env_file: - ./api/.env` is in `celery_worker` service |
| Redis `WRONGTYPE` error | Mixed broker and backend keys | Use separate DB indices: broker on `/0`, backend on `/1` (optional) |

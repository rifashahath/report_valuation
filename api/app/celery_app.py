"""
Celery application factory.

All tasks import `celery_app` from here so there is a single,
shared Celery instance throughout the project.
"""

import os
from celery import Celery

BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
BACKEND_URL = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

celery_app = Celery(
    "report_worker",
    broker=BROKER_URL,
    backend=BACKEND_URL,
    include=["app.tasks.process_task"],   # auto-discover tasks
)

celery_app.conf.update(
    # Serialisation – JSON is safer and human-readable
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Retry policy applied to all tasks unless overridden
    task_acks_late=True,            # only ACK after the task finishes
    task_reject_on_worker_lost=True,

    # Silence Celery 6.0 deprecation warning
    broker_connection_retry_on_startup=True,

    # Result expiry (24 h)
    result_expires=86_400,

    # Worker concurrency – default: number of CPUs; override with env var
    worker_concurrency=int(os.getenv("CELERY_CONCURRENCY", 2)),

    # Optional: route heavy OCR/translation tasks to a dedicated queue
    task_routes={
        "app.tasks.process_task.process_document_task": {"queue": "document_processing"},
    },
)

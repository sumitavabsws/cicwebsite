import json
import logging
import os
import re
import shutil
import sys
import tempfile
import time
import uuid
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime, timedelta
from ipaddress import ip_address, ip_network
from logging.handlers import RotatingFileHandler
from pathlib import Path
from threading import RLock
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import Request as UrlRequest, urlopen

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from resource_registry import (
    RESOURCE_ROOTS,
    get_record_by_key,
    get_record_by_public_id,
    is_managed_file,
    public_url,
    public_url_for_file,
    register_file,
    resolve_record_path,
    restore_record,
    sync_registry,
    unregister_file,
)


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def select_activity_log_file() -> tuple[Path, str, list[str]]:
    candidates = (
        ((BASE_DIR / "log.txt").resolve(), "backend/log.txt"),
        ((BASE_DIR / "content" / "log.txt").resolve(), "backend/content/log.txt"),
        (
            (Path(tempfile.gettempdir()) / "cic-website" / "log.txt").resolve(),
            "temporary/cic-website/log.txt",
        ),
    )
    failures: list[str] = []
    for candidate, location in candidates:
        try:
            candidate.parent.mkdir(parents=True, exist_ok=True)
            with candidate.open("a", encoding="utf-8"):
                pass
            with Path(f"{candidate}.lock").open("a+b"):
                pass
            return candidate, location, failures
        except OSError as error:
            failures.append(f"{location}:{type(error).__name__}")

    raise RuntimeError(
        "Backend logging cannot start because no candidate log directory is writable: "
        + ", ".join(failures)
    )


ACTIVITY_LOG_FILE, ACTIVITY_LOG_LOCATION, ACTIVITY_LOG_FALLBACKS = (
    select_activity_log_file()
)
ACTIVITY_LOG_LAST_ERROR: str | None = None
ACTIVITY_LOG_LAST_WRITE_AT: str | None = None
ACTIVITY_LOG_MAX_BYTES = int(
    os.getenv("CIC_ACTIVITY_LOG_MAX_BYTES", str(10 * 1024 * 1024))
)
ACTIVITY_LOG_BACKUP_COUNT = int(os.getenv("CIC_ACTIVITY_LOG_BACKUP_COUNT", "5"))
CONTENT_FILE = BASE_DIR / "content" / "site_content.json"
CONFIG_FILE = BASE_DIR / "content" / "site_config.json"
SEED_CONTENT_FILE = BASE_DIR / "content" / "site_content.seed.json"
TEAMS_FILE = BASE_DIR / "content" / "teams.json"
TEAMS_SEED_FILE = BASE_DIR / "content" / "teams.seed.json"
TENDERS_FILE = BASE_DIR / "content" / "tenders.json"
MEDIA_DIR = BASE_DIR / "content" / "images"
TEAM_IMAGES_DIR = MEDIA_DIR / "teams"
RESOURCES_DIR = BASE_DIR / "content" / "resources"
TENDERS_DIR = RESOURCES_DIR / "tenders"
NOTICES_DIR = RESOURCES_DIR / "notice"
SOFTWARE_UPLOADS_DIR = RESOURCES_DIR / "softwaresupport" / "managed"
VIDEOS_DIR = BASE_DIR / "content" / "videos"
CYBER_SECURITY_AWARENESS_DIR = RESOURCES_DIR / "policies" / "cybersecurityawareness"
CYBER_SECURITY_GUIDELINES_DIR = RESOURCES_DIR / "policies" / "cybersecurityguidelines"
CYBER_SECURITY_SAFEGUARDS_DIR = RESOURCES_DIR / "policies" / "cybersecuritysafeguards"
HELPDESK_GUIDE_FILENAME = "Helpdesk End User Guide.pdf"
HELPDESK_URL = os.getenv("CIC_HELPDESK_URL", "https://cichelpdesk.iitkgp.ac.in/")
SOFTWARE_REPOSITORY_URL = os.getenv(
    "CIC_SOFTWARE_REPOSITORY_URL",
    "http://swrepo.iitkgp.ac.in/",
)
INTERNAL_NETWORKS = tuple(
    ip_network(cidr)
    for cidr in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")
)
TRUSTED_PROXY_NETWORKS = tuple(
    ip_network(cidr.strip())
    for cidr in os.getenv("CIC_TRUSTED_PROXY_CIDRS", "127.0.0.0/8,::1/128").split(",")
    if cidr.strip()
)
ANANTA_BASE_URL = os.getenv(
    "ANANTA_BASE_URL", "https://cicidp.iitkgp.ac.in/framework"
).rstrip("/")
ananta_base_parts = urlsplit(ANANTA_BASE_URL)
ANANTA_API_BASE_URL = os.getenv(
    "ANANTA_API_BASE_URL",
    os.getenv(
        "ANANTA_BEARER_BASE_URL",
        f"{ananta_base_parts.scheme}://{ananta_base_parts.netloc}",
    ),
).rstrip("/")
MAX_TEAM_PHOTO_SIZE_BYTES = int(os.getenv("CIC_MAX_TEAM_PHOTO_SIZE_BYTES", str(200 * 1024)))
MAX_TENDER_PDF_SIZE_BYTES = int(os.getenv("CIC_MAX_TENDER_PDF_SIZE_BYTES", str(25 * 1024 * 1024)))
MAX_NOTICE_PDF_SIZE_BYTES = int(os.getenv("CIC_MAX_NOTICE_PDF_SIZE_BYTES", str(25 * 1024 * 1024)))
MAX_CYBER_SECURITY_PDF_SIZE_BYTES = int(
    os.getenv("CIC_MAX_CYBER_SECURITY_PDF_SIZE_BYTES", str(25 * 1024 * 1024))
)
MAX_MANAGED_RESOURCE_SIZE_BYTES = int(
    os.getenv("CIC_MAX_MANAGED_RESOURCE_SIZE_BYTES", str(250 * 1024 * 1024))
)
ANANTA_SESSION_TIMEOUT_SECONDS = float(os.getenv("ANANTA_SESSION_TIMEOUT_SECONDS", "5"))
ANANTA_LOGIN_TIMEOUT_SECONDS = float(os.getenv("ANANTA_LOGIN_TIMEOUT_SECONDS", "8"))
ALLOWED_TEAM_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CIC_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
DEFAULT_SITE_CONFIG = {"adminAllowedIps": []}
TENDERS_LOCK = RLock()
RESOURCE_REPLACE_LOCK = RLock()
REQUEST_ID_CONTEXT: ContextVar[str] = ContextVar("cic_request_id", default="")
ACTIVITY_FILE_THREAD_LOCK = RLock()


def activity_timestamp() -> str:
    return datetime.now().astimezone().isoformat(timespec="milliseconds")


class ActivityLogFormatter(logging.Formatter):
    def formatTime(self, record, datefmt=None):
        return datetime.fromtimestamp(record.created).astimezone().isoformat(
            timespec="milliseconds"
        )


class OncePerRecordFilter(logging.Filter):
    def filter(self, record) -> bool:
        if getattr(record, "_cic_runtime_error_written", False):
            return False
        record._cic_runtime_error_written = True
        return True


class ProcessSafeRotatingFileHandler(RotatingFileHandler):
    """Coordinate writes and rotation between Gunicorn worker processes."""

    def __init__(self, filename, *args, **kwargs):
        super().__init__(filename, *args, **kwargs)
        self.process_lock_filename = f"{self.baseFilename}.lock"

    @contextmanager
    def process_lock(self):
        lock_file = open(self.process_lock_filename, "a+b")
        lock_acquired = False
        try:
            if os.name == "posix":
                import fcntl

                fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
                lock_acquired = True
            elif os.name == "nt":
                import msvcrt

                lock_file.seek(0, os.SEEK_END)
                if lock_file.tell() == 0:
                    lock_file.write(b"\0")
                    lock_file.flush()
                lock_file.seek(0)
                msvcrt.locking(lock_file.fileno(), msvcrt.LK_LOCK, 1)
                lock_acquired = True
            yield
        finally:
            if lock_acquired and os.name == "posix":
                import fcntl

                fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
            elif lock_acquired and os.name == "nt":
                import msvcrt

                lock_file.seek(0)
                msvcrt.locking(lock_file.fileno(), msvcrt.LK_UNLCK, 1)
            lock_file.close()

    def reopen_after_another_process_rotates(self) -> None:
        if self.stream is None:
            return
        try:
            current_file = os.stat(self.baseFilename)
            open_file = os.fstat(self.stream.fileno())
            unchanged = (
                current_file.st_dev == open_file.st_dev
                and current_file.st_ino == open_file.st_ino
            )
        except FileNotFoundError:
            unchanged = False

        if unchanged:
            return
        self.stream.flush()
        self.stream.close()
        self.stream = self._open()

    def doRollover(self) -> None:
        if os.name != "nt":
            super().doRollover()
            return

        # Windows cannot rename a log while another process has it open. The
        # inter-process lock makes copy-and-truncate safe for local workers.
        if self.stream:
            self.stream.flush()
        if self.backupCount > 0:
            oldest_backup = self.rotation_filename(
                f"{self.baseFilename}.{self.backupCount}"
            )
            if os.path.exists(oldest_backup):
                os.remove(oldest_backup)
            for backup_number in range(self.backupCount - 1, 0, -1):
                source = self.rotation_filename(f"{self.baseFilename}.{backup_number}")
                destination = self.rotation_filename(
                    f"{self.baseFilename}.{backup_number + 1}"
                )
                if os.path.exists(source):
                    os.replace(source, destination)
            first_backup = self.rotation_filename(f"{self.baseFilename}.1")
            if os.path.exists(self.baseFilename):
                shutil.copyfile(self.baseFilename, first_backup)

        with open(self.baseFilename, "w", encoding=self.encoding):
            pass
        if self.stream is None and not self.delay:
            self.stream = self._open()

    def emit(self, record) -> None:
        global ACTIVITY_LOG_LAST_ERROR, ACTIVITY_LOG_LAST_WRITE_AT
        self._cic_emit_failed = False
        try:
            with ACTIVITY_FILE_THREAD_LOCK, self.process_lock():
                self.reopen_after_another_process_rotates()
                super().emit(record)
            if not self._cic_emit_failed:
                ACTIVITY_LOG_LAST_ERROR = None
                ACTIVITY_LOG_LAST_WRITE_AT = activity_timestamp()
        except Exception as error:
            ACTIVITY_LOG_LAST_ERROR = type(error).__name__
            self.handleError(record)

    def handleError(self, record) -> None:
        global ACTIVITY_LOG_LAST_ERROR
        self._cic_emit_failed = True
        error = sys.exc_info()[1]
        ACTIVITY_LOG_LAST_ERROR = type(error).__name__ if error else "LoggingError"
        super().handleError(record)


def create_activity_file_handler() -> ProcessSafeRotatingFileHandler:
    return ProcessSafeRotatingFileHandler(
        ACTIVITY_LOG_FILE,
        maxBytes=ACTIVITY_LOG_MAX_BYTES,
        backupCount=ACTIVITY_LOG_BACKUP_COUNT,
        encoding="utf-8",
        delay=True,
    )


def configure_activity_logger() -> logging.Logger:
    logger = logging.getLogger("cic.backend.activity")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    if logger.handlers:
        return logger

    ACTIVITY_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    handler = create_activity_file_handler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
    return logger


ACTIVITY_LOGGER = configure_activity_logger()


def configure_runtime_error_logging() -> None:
    handler = create_activity_file_handler()
    handler.setLevel(logging.ERROR)
    handler.setFormatter(
        ActivityLogFormatter(
            "[ERROR %(asctime)s]: pid=%(process)d logger=%(name)s "
            "level=%(levelname)s %(message)s"
        )
    )
    handler.addFilter(OncePerRecordFilter())
    handler._cic_runtime_error_handler = True

    root_logger = logging.getLogger()
    if not any(
        getattr(existing, "_cic_runtime_error_handler", False)
        for existing in root_logger.handlers
    ):
        root_logger.addHandler(handler)

    # Uvicorn and Gunicorn normally disable propagation for their error
    # loggers, so attach the same error-only handler directly to them.
    for logger_name in ("uvicorn.error", "gunicorn.error"):
        server_logger = logging.getLogger(logger_name)
        if not any(
            getattr(existing, "_cic_runtime_error_handler", False)
            for existing in server_logger.handlers
        ):
            server_logger.addHandler(handler)


configure_runtime_error_logging()


def log_backend_worker_startup() -> None:
    ACTIVITY_LOGGER.info(
        "[SYSTEM %s]: pid=%s event=backend_worker_started log_file=%s fallback_attempts=%s",
        activity_timestamp(),
        os.getpid(),
        ACTIVITY_LOG_LOCATION,
        ",".join(ACTIVITY_LOG_FALLBACKS) or "none",
    )


log_backend_worker_startup()


def sanitize_outgoing_url(url: str) -> str:
    parts = urlsplit(url)
    safe_path = re.sub(
        r"(/api/session/)[^/?]+",
        r"\1<redacted-session>",
        parts.path,
        flags=re.IGNORECASE,
    )
    sensitive_query_names = {
        "access_token",
        "authorization",
        "password",
        "secret",
        "session",
        "session_id",
        "token",
    }
    safe_query = urlencode(
        [
            (name, "<redacted>" if name.casefold() in sensitive_query_names else value)
            for name, value in parse_qsl(parts.query, keep_blank_values=True)
        ]
    )
    host = parts.hostname or ""
    safe_netloc = f"{host}:{parts.port}" if parts.port else host
    return urlunsplit((parts.scheme, safe_netloc, safe_path, safe_query, ""))


def redirected_outgoing_request(request: UrlRequest, location: str) -> UrlRequest:
    redirect_url = urljoin(request.full_url, location)
    source = urlsplit(request.full_url)
    destination = urlsplit(redirect_url)
    source_host = (source.hostname or "").casefold()
    destination_host = (destination.hostname or "").casefold()

    if destination.scheme not in {"http", "https"} or destination_host != source_host:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication API attempted an unsafe redirect.",
        )
    if source.scheme == "https" and destination.scheme != "https":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication API attempted to downgrade a secure connection.",
        )

    return UrlRequest(
        redirect_url,
        data=request.data,
        method=request.get_method(),
        headers=dict(request.header_items()),
    )


def open_outgoing_request(request: UrlRequest, timeout: float):
    request_id = REQUEST_ID_CONTEXT.get() or uuid.uuid4().hex[:12]
    started_at = time.perf_counter()
    current_request = request
    redirect_count = 0

    while True:
        safe_url = sanitize_outgoing_url(current_request.full_url)
        method = current_request.get_method()
        ACTIVITY_LOGGER.info(
            "[OUTGOING %s:%s]: request_id=%s pid=%s method=%s event=started",
            activity_timestamp(),
            safe_url,
            request_id,
            os.getpid(),
            method,
        )
        try:
            response = urlopen(current_request, timeout=timeout)
            break
        except HTTPError as error:
            location = error.headers.get("Location") if error.headers else None
            if error.code in {307, 308} and location and redirect_count < 3:
                try:
                    next_request = redirected_outgoing_request(current_request, location)
                except HTTPException:
                    duration_ms = (time.perf_counter() - started_at) * 1000
                    ACTIVITY_LOGGER.error(
                        "[OUTGOING %s:%s]: request_id=%s pid=%s method=%s "
                        "event=failed error_type=UnsafeRedirect status=%s duration_ms=%.2f",
                        activity_timestamp(),
                        safe_url,
                        request_id,
                        os.getpid(),
                        method,
                        error.code,
                        duration_ms,
                        exc_info=True,
                    )
                    raise
                ACTIVITY_LOGGER.info(
                    "[OUTGOING %s:%s]: request_id=%s pid=%s method=%s "
                    "event=redirected status=%s redirect_to=%s",
                    activity_timestamp(),
                    safe_url,
                    request_id,
                    os.getpid(),
                    method,
                    error.code,
                    sanitize_outgoing_url(next_request.full_url),
                )
                current_request = next_request
                redirect_count += 1
                continue

            duration_ms = (time.perf_counter() - started_at) * 1000
            ACTIVITY_LOGGER.error(
                "[OUTGOING %s:%s]: request_id=%s pid=%s method=%s event=failed error_type=%s status=%s duration_ms=%.2f",
                activity_timestamp(),
                safe_url,
                request_id,
                os.getpid(),
                method,
                type(error).__name__,
                error.code,
                duration_ms,
                exc_info=True,
            )
            raise
        except Exception as error:
            duration_ms = (time.perf_counter() - started_at) * 1000
            ACTIVITY_LOGGER.error(
                "[OUTGOING %s:%s]: request_id=%s pid=%s method=%s event=failed error_type=%s duration_ms=%.2f",
                activity_timestamp(),
                safe_url,
                request_id,
                os.getpid(),
                method,
                type(error).__name__,
                duration_ms,
                exc_info=True,
            )
            raise

    duration_ms = (time.perf_counter() - started_at) * 1000
    response_status = getattr(response, "status", None)
    if response_status is None:
        response_status = response.getcode()
    ACTIVITY_LOGGER.info(
        "[OUTGOING %s:%s]: request_id=%s pid=%s method=%s event=completed status=%s duration_ms=%.2f",
        activity_timestamp(),
        safe_url,
        request_id,
        os.getpid(),
        method,
        response_status,
        duration_ms,
    )
    return response


class ContentSectionPayload(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list)


class SiteContentPayload(BaseModel):
    notices: list[dict[str, Any]] = Field(default_factory=list)
    events: list[dict[str, Any]] = Field(default_factory=list)
    services: list[dict[str, Any]] = Field(default_factory=list)


class LoginPayload(BaseModel):
    username: str
    password: str
    next: str | None = None


def ensure_content_file() -> None:
    if CONTENT_FILE.exists():
        return

    CONTENT_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SEED_CONTENT_FILE.exists():
        CONTENT_FILE.write_text(SEED_CONTENT_FILE.read_text(encoding="utf-8"), encoding="utf-8")
        return

    CONTENT_FILE.write_text(json.dumps({"notices": [], "events": [], "services": []}, indent=2), encoding="utf-8")


def ensure_config_file() -> None:
    if CONFIG_FILE.exists():
        return

    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(DEFAULT_SITE_CONFIG, indent=2), encoding="utf-8")


def ensure_teams_file() -> None:
    if TEAMS_FILE.exists():
        return

    TEAMS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if TEAMS_SEED_FILE.exists():
        TEAMS_FILE.write_text(TEAMS_SEED_FILE.read_text(encoding="utf-8"), encoding="utf-8")
        return

    TEAMS_FILE.write_text(json.dumps([], indent=2), encoding="utf-8")


def get_default_tenders() -> list[dict[str, Any]]:
    ai_tender_filename = "10-06-2026 AI Software Tender.pdf"
    ai_tender_path = TENDERS_DIR / ai_tender_filename

    if not ai_tender_path.exists():
        return []

    return [
        {
            "id": "ai-software-tender-2026",
            "title": "AI Software Tender",
            "refNo": "IIT/CIC/AI-SW/2026-27/06",
            "startDate": "10 Jun 2026 10:00 AM",
            "endDate": "02 Jul 2026 03:00 PM",
            "bidOpeningDate": "02 Jul 2026 04:00 PM",
            "corrigendumDetails": "",
            "pdfUrl": public_url_for_file("resources", ai_tender_path),
            "pdfLabel": "View Tender PDF",
        }
    ]


def ensure_tenders_file() -> None:
    if TENDERS_FILE.exists():
        return

    TENDERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    TENDERS_FILE.write_text(
        json.dumps(get_default_tenders(), indent=2, ensure_ascii=True),
        encoding="utf-8",
    )


def ensure_media_dirs() -> None:
    TEAM_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    RESOURCES_DIR.mkdir(parents=True, exist_ok=True)
    TENDERS_DIR.mkdir(parents=True, exist_ok=True)
    NOTICES_DIR.mkdir(parents=True, exist_ok=True)
    SOFTWARE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    CYBER_SECURITY_AWARENESS_DIR.mkdir(parents=True, exist_ok=True)
    CYBER_SECURITY_GUIDELINES_DIR.mkdir(parents=True, exist_ok=True)
    CYBER_SECURITY_SAFEGUARDS_DIR.mkdir(parents=True, exist_ok=True)
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


def read_content() -> dict[str, list[dict[str, Any]]]:
    ensure_content_file()
    with CONTENT_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_content(content: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    ensure_content_file()
    with CONTENT_FILE.open("w", encoding="utf-8") as file:
        json.dump(content, file, indent=2, ensure_ascii=True)
        file.write("\n")

    return content


def read_site_config() -> dict[str, Any]:
    ensure_config_file()
    with CONFIG_FILE.open("r", encoding="utf-8") as file:
        config = json.load(file)

    return {
        **DEFAULT_SITE_CONFIG,
        **config,
    }


def get_request_ip(request: Request) -> str:
    peer_ip = normalize_ip_address(request.client.host) if request.client else ""
    if not is_ip_in_networks(peer_ip, TRUSTED_PROXY_NETWORKS):
        return peer_ip

    forwarded_ips = [
        normalize_ip_address(value)
        for value in request.headers.get("x-forwarded-for", "").split(",")
        if value.strip()
    ]

    for candidate in reversed([*forwarded_ips, peer_ip]):
        if candidate and not is_ip_in_networks(candidate, TRUSTED_PROXY_NETWORKS):
            return candidate

    real_ip = normalize_ip_address(request.headers.get("x-real-ip", ""))
    return real_ip or peer_ip


def normalize_ip_address(value: str) -> str:
    """Return a canonical address, converting IPv4-mapped IPv6 to IPv4."""
    try:
        parsed = ip_address(value.strip())
    except ValueError:
        return value.strip()

    if getattr(parsed, "ipv4_mapped", None):
        return str(parsed.ipv4_mapped)

    return str(parsed)


def is_ip_in_networks(value: str, networks: tuple[Any, ...]) -> bool:
    try:
        parsed = ip_address(value)
    except ValueError:
        return False

    return any(parsed.version == network.version and parsed in network for network in networks)


def is_internal_request(request: Request) -> bool:
    return is_ip_in_networks(get_request_ip(request), INTERNAL_NETWORKS)


def is_admin_ip_allowed(ip_address: str) -> bool:
    allowed_ips = read_site_config().get("adminAllowedIps", [])
    return ip_address in allowed_ips


def require_admin_ip(request: Request) -> None:
    ip_address = get_request_ip(request)

    if not is_admin_ip_allowed(ip_address):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is restricted from this IP address.",
        )


def read_teams() -> list[dict[str, Any]]:
    ensure_teams_file()
    with TEAMS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_teams(teams: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_teams_file()
    with TEAMS_FILE.open("w", encoding="utf-8") as file:
        json.dump(teams, file, indent=2, ensure_ascii=True)
        file.write("\n")

    return teams


def read_tenders() -> list[dict[str, Any]]:
    ensure_tenders_file()
    with TENDERS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def persist_tenders_file(tenders: list[dict[str, Any]]) -> None:
    ensure_tenders_file()
    temporary_file = TENDERS_FILE.with_suffix(".json.tmp")
    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(tenders, file, indent=2, ensure_ascii=True)
        file.write("\n")
    os.replace(temporary_file, TENDERS_FILE)


def write_tenders(tenders: list[dict[str, Any]]) -> list[dict[str, Any]]:
    persist_tenders_file(tenders)

    remove_unreferenced_tender_pdfs(tenders)
    return tenders


def remove_unreferenced_tender_pdfs(tenders: list[dict[str, Any]]) -> None:
    referenced_filenames = set()

    for tender in tenders:
        for url_field, filename_field in (
            ("pdfUrl", "pdfFileName"),
            ("corrigendumUrl", "corrigendumFileName"),
        ):
            resource_path = urlsplit(tender.get(url_field, "")).path
            if resource_path.startswith("/api/assets/"):
                record = get_record_by_public_id(Path(resource_path).name)
                if record and record["storage"].startswith("resources/tenders/"):
                    referenced_filenames.add(Path(record["storage"]).name.casefold())
                    continue

            legacy_filename = tender.get(filename_field, "")
            if legacy_filename:
                referenced_filenames.add(Path(legacy_filename).name.casefold())

    for pdf_path in TENDERS_DIR.glob("*.pdf"):
        if pdf_path.name.casefold() not in referenced_filenames:
            pdf_path.unlink()
            unregister_file("resources", pdf_path)


def parse_tender_form(data: str) -> dict[str, Any]:
    try:
        payload = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tender details are not valid JSON.",
        ) from None

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tender details must be an object.",
        )

    normalized = {
        field: str(payload.get(field, "")).strip()
        for field in (
            "title",
            "refNo",
            "startDate",
            "endDate",
            "bidOpeningDate",
            "corrigendumDetails",
            "pdfLabel",
            "corrigendumLabel",
        )
    }
    normalized["removeCorrigendum"] = payload.get("removeCorrigendum") is True

    if not normalized["title"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tender title is required.",
        )

    normalized["pdfLabel"] = normalized["pdfLabel"] or "View Tender PDF"
    normalized["corrigendumLabel"] = (
        normalized["corrigendumLabel"] or "View Corrigendum"
    )
    return normalized


async def read_tender_pdf(upload: UploadFile | None, label: str) -> tuple[bytes, str] | None:
    if upload is None or not upload.filename:
        return None

    original_name = Path(upload.filename).name
    extension = Path(original_name).suffix.lower()
    file_bytes = await upload.read()
    if (
        extension != ".pdf"
        or not file_bytes.startswith(b"%PDF-")
        or (
            upload.content_type
            and upload.content_type not in {"application/pdf", "application/octet-stream"}
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Please upload a valid PDF for {label}.",
        )

    if len(file_bytes) > MAX_TENDER_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{label} PDF must be 25 MB or smaller.",
        )

    return file_bytes, original_name


def store_tender_document(
    file_bytes: bytes,
    original_name: str,
    document_type: str,
) -> tuple[Path, dict[str, Any]]:
    filename = f"{document_type}-{uuid.uuid4().hex}.pdf"
    destination = TENDERS_DIR / filename
    temporary_file = TENDERS_DIR / f".{filename}.tmp"
    temporary_file.write_bytes(file_bytes)
    os.replace(temporary_file, destination)
    try:
        resource = register_file("resources", destination, display_name=original_name)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    return destination, resource


def remove_managed_tender_document(path: Path) -> None:
    path.unlink(missing_ok=True)
    unregister_file("resources", path)


def validate_managed_resource_content(
    file_bytes: bytes,
    suffix: str,
    content_type: str | None,
) -> None:
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The replacement file is empty.",
        )
    if len(file_bytes) > MAX_MANAGED_RESOURCE_SIZE_BYTES:
        limit_mb = MAX_MANAGED_RESOURCE_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The replacement file must be {limit_mb} MB or smaller.",
        )

    signatures = {
        ".pdf": file_bytes.startswith(b"%PDF-"),
        ".png": file_bytes.startswith(b"\x89PNG\r\n\x1a\n"),
        ".jpg": file_bytes.startswith(b"\xff\xd8\xff"),
        ".jpeg": file_bytes.startswith(b"\xff\xd8\xff"),
        ".gif": file_bytes.startswith((b"GIF87a", b"GIF89a")),
        ".webp": file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP",
        ".mp4": len(file_bytes) >= 12 and file_bytes[4:8] == b"ftyp",
        ".webm": file_bytes.startswith(b"\x1a\x45\xdf\xa3"),
    }
    if suffix in signatures and not signatures[suffix]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The uploaded file does not contain valid {suffix} content.",
        )

    expected_family = {
        ".pdf": "application/",
        ".png": "image/",
        ".jpg": "image/",
        ".jpeg": "image/",
        ".gif": "image/",
        ".webp": "image/",
        ".svg": "image/",
        ".mp4": "video/",
        ".webm": "video/",
    }.get(suffix)
    if (
        expected_family
        and content_type
        and content_type != "application/octet-stream"
        and not content_type.startswith(expected_family)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file type does not match the managed resource.",
        )


def replace_managed_resource(
    record: dict[str, Any],
    file_bytes: bytes,
    display_name: str,
) -> dict[str, Any]:
    destination = resolve_record_path(record)
    temporary_file = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.tmp")
    backup_file = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.bak")
    temporary_file.write_bytes(file_bytes)

    try:
        os.replace(destination, backup_file)
        os.replace(temporary_file, destination)
        try:
            updated = register_file(
                record["storage"].split("/", 1)[0],
                destination,
                display_name=display_name,
            )
        except Exception:
            destination.unlink(missing_ok=True)
            os.replace(backup_file, destination)
            raise
        try:
            backup_file.unlink(missing_ok=True)
        except OSError:
            # The replacement is already committed. A hidden backup is safer
            # than reporting failure after the live resource has changed.
            pass
        return updated
    finally:
        temporary_file.unlink(missing_ok=True)


def stage_managed_resource_replacement(
    record: dict[str, Any],
    file_bytes: bytes,
    display_name: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Replace content while retaining enough state to roll the change back."""
    destination = resolve_record_path(record)
    temporary_file = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.tmp")
    backup_file = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.bak")
    snapshot = dict(record)
    had_original_file = destination.is_file()
    temporary_file.write_bytes(file_bytes)

    try:
        if had_original_file:
            os.replace(destination, backup_file)
        os.replace(temporary_file, destination)
        try:
            updated = register_file(
                record["storage"].split("/", 1)[0],
                destination,
                display_name=display_name,
            )
        except Exception:
            destination.unlink(missing_ok=True)
            if had_original_file:
                os.replace(backup_file, destination)
            restore_record(snapshot)
            raise
    finally:
        temporary_file.unlink(missing_ok=True)

    return updated, {
        "destination": destination,
        "backup": backup_file,
        "record": snapshot,
        "hadOriginalFile": had_original_file,
    }


def rollback_staged_resource_replacement(replacement: dict[str, Any]) -> None:
    destination = replacement["destination"]
    backup_file = replacement["backup"]
    destination.unlink(missing_ok=True)
    if replacement["hadOriginalFile"]:
        os.replace(backup_file, destination)
    restore_record(replacement["record"])


def commit_staged_resource_replacement(replacement: dict[str, Any]) -> None:
    replacement["backup"].unlink(missing_ok=True)


def tender_resource_record(tender: dict[str, Any], url_field: str) -> dict[str, Any] | None:
    resource_path = urlsplit(str(tender.get(url_field, ""))).path
    if not resource_path.startswith("/api/assets/"):
        return None
    record = get_record_by_public_id(Path(resource_path).name)
    if record is None or not record["storage"].startswith("resources/tenders/"):
        return None
    return record


def remove_tender_resource_record(record: dict[str, Any] | None) -> None:
    if record is None:
        return
    remove_managed_tender_document(resolve_record_path(record))


def save_tender_mutation(
    tender_id: str | None,
    payload: dict[str, Any],
    tender_pdf: tuple[bytes, str] | None,
    corrigendum_pdf: tuple[bytes, str] | None,
) -> list[dict[str, Any]]:
    with TENDERS_LOCK:
        tenders = read_tenders()
        existing_index = next(
            (
                index
                for index, tender in enumerate(tenders)
                if tender.get("id") == tender_id
            ),
            None,
        )
        if tender_id and existing_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tender was not found.",
            )

        existing = tenders[existing_index] if existing_index is not None else {}
        if not existing and tender_pdf is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tender PDF is required.",
            )

        created_paths: list[Path] = []
        staged_replacements: list[dict[str, Any]] = []
        resources_to_remove: list[dict[str, Any]] = []
        next_tender = {
            **existing,
            "id": tender_id or f"tender-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}",
            "title": payload["title"],
            "refNo": payload["refNo"],
            "startDate": payload["startDate"],
            "endDate": payload["endDate"],
            "bidOpeningDate": payload["bidOpeningDate"],
            "corrigendumDetails": payload["corrigendumDetails"],
            "pdfLabel": payload["pdfLabel"],
        }

        committed = False
        try:
            if tender_pdf is not None:
                existing_resource = tender_resource_record(existing, "pdfUrl")
                if existing_resource is not None:
                    resource, replacement = stage_managed_resource_replacement(
                        existing_resource, tender_pdf[0], tender_pdf[1]
                    )
                    staged_replacements.append(replacement)
                else:
                    path, resource = store_tender_document(
                        tender_pdf[0], tender_pdf[1], "tender"
                    )
                    created_paths.append(path)
                next_tender["pdfUrl"] = public_url(resource)
                next_tender["pdfFileName"] = tender_pdf[1]

            if corrigendum_pdf is not None:
                existing_resource = tender_resource_record(existing, "corrigendumUrl")
                if existing_resource is not None:
                    resource, replacement = stage_managed_resource_replacement(
                        existing_resource,
                        corrigendum_pdf[0],
                        corrigendum_pdf[1],
                    )
                    staged_replacements.append(replacement)
                else:
                    path, resource = store_tender_document(
                        corrigendum_pdf[0], corrigendum_pdf[1], "corrigendum"
                    )
                    created_paths.append(path)
                next_tender["corrigendumUrl"] = public_url(resource)
                next_tender["corrigendumFileName"] = corrigendum_pdf[1]
                next_tender["corrigendumLabel"] = payload["corrigendumLabel"]
            elif payload["removeCorrigendum"]:
                existing_resource = tender_resource_record(existing, "corrigendumUrl")
                if existing_resource is not None:
                    resources_to_remove.append(existing_resource)
                next_tender.pop("corrigendumUrl", None)
                next_tender.pop("corrigendumFileName", None)
                next_tender.pop("corrigendumLabel", None)
            elif next_tender.get("corrigendumUrl"):
                next_tender["corrigendumLabel"] = payload["corrigendumLabel"]

            next_tenders = list(tenders)
            if existing_index is None:
                next_tenders.insert(0, next_tender)
            else:
                next_tenders[existing_index] = next_tender

            persist_tenders_file(next_tenders)
            committed = True
            for replacement in staged_replacements:
                commit_staged_resource_replacement(replacement)
            for resource in resources_to_remove:
                remove_tender_resource_record(resource)
            return next_tenders
        except Exception:
            if not committed:
                for replacement in reversed(staged_replacements):
                    rollback_staged_resource_replacement(replacement)
                for path in created_paths:
                    remove_managed_tender_document(path)
            raise


def validate_ananta_session(access_token: str, renew: bool = True) -> dict[str, Any]:
    url = f"{ANANTA_API_BASE_URL}/api/v1/users/profile/"
    request = UrlRequest(
        url,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {access_token}",
        },
    )

    try:
        with open_outgoing_request(
            request, timeout=ANANTA_SESSION_TIMEOUT_SECONDS
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = "Ananta session expired or invalid."
        try:
            error_payload = json.loads(error.read().decode("utf-8"))
            detail = error_payload.get("detail") or error_payload.get("error") or detail
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from None
    except (TimeoutError, URLError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Ananta authentication API: {error}",
        ) from None

    if payload.get("active") is False or payload.get("authenticated") is False:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=payload.get("detail") or "Ananta session expired or invalid.",
        )

    identity = payload.get("identity") or payload.get("user") or {
        "username": payload.get("email") or payload.get("user_id") or "",
        "employee_code": payload.get("user_id") or "",
        "display_name": payload.get("name") or payload.get("user_id") or "",
    }
    return {
        **payload,
        "valid": True,
        "renewed": renew,
        "_auth_mode": "external_api",
        "identity": identity,
    }


def verify_ananta_credentials(payload: LoginPayload) -> dict[str, Any]:
    url = f"{ANANTA_API_BASE_URL}/api/v1/users/login/"
    body = json.dumps(
        {
            "username": payload.username,
            "password": payload.password,
        }
    ).encode("utf-8")
    request = UrlRequest(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )

    try:
        with open_outgoing_request(request, timeout=ANANTA_LOGIN_TIMEOUT_SECONDS) as response:
            api_payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = "Invalid username or password."
        try:
            error_payload = json.loads(error.read().decode("utf-8"))
            detail = error_payload.get("detail") or error_payload.get("error") or detail
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        raise HTTPException(status_code=error.code, detail=detail) from None
    except (TimeoutError, URLError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Ananta authentication API: {error}",
        ) from None

    access_token = api_payload.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ananta bearer authentication did not return an access token.",
        )
    return {
        **api_payload,
        "_auth_mode": "external_api",
        "_login_username": payload.username,
    }


def delete_ananta_session(access_token: str) -> None:
    url = f"{ANANTA_API_BASE_URL}/api/v1/users/logout/"
    request = UrlRequest(
        url,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {access_token}",
        },
    )
    try:
        with open_outgoing_request(request, timeout=ANANTA_SESSION_TIMEOUT_SECONDS):
            return
    except HTTPError as error:
        if error.code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND}:
            return
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to invalidate the Ananta session.",
        ) from None
    except (TimeoutError, URLError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Ananta authentication API: {error}",
        ) from None


def require_admin(
    request: Request,
    authorization: str | None = Header(default=None),
) -> str:
    require_admin_ip(request)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Ananta session token.",
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = validate_ananta_session(token, renew=True)
    identity = payload.get("identity") or {}
    return identity.get("employee_code") or payload.get("employee_code") or payload.get("username") or ""


app = FastAPI(title="CIC CMS Backend")
ensure_media_dirs()
sync_registry()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_backend_activity(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    context_token = REQUEST_ID_CONTEXT.set(request_id)
    started_at = time.perf_counter()
    client_ip = get_request_ip(request) or "unknown"
    content_length = request.headers.get("content-length", "unknown")
    ACTIVITY_LOGGER.info(
        "[INCOMING %s]: request_id=%s pid=%s client=%s method=%s path=%s content_length=%s event=started",
        activity_timestamp(),
        request_id,
        os.getpid(),
        client_ip,
        request.method,
        request.url.path,
        content_length,
    )

    try:
        response = await call_next(request)
    except Exception as error:
        duration_ms = (time.perf_counter() - started_at) * 1000
        ACTIVITY_LOGGER.error(
            "[INCOMING %s]: request_id=%s pid=%s client=%s method=%s path=%s event=failed error_type=%s duration_ms=%.2f",
            activity_timestamp(),
            request_id,
            os.getpid(),
            client_ip,
            request.method,
            request.url.path,
            type(error).__name__,
            duration_ms,
            exc_info=True,
        )
        REQUEST_ID_CONTEXT.reset(context_token)
        raise

    duration_ms = (time.perf_counter() - started_at) * 1000
    response.headers["X-Request-ID"] = request_id
    log_response = ACTIVITY_LOGGER.info
    response_event = (
        "response_started"
        if request.url.path.startswith("/api/assets/") and response.status_code < 400
        else "completed"
    )
    if response.status_code >= 500:
        log_response = ACTIVITY_LOGGER.error
        response_event = "failed"
    elif response.status_code >= 400:
        log_response = ACTIVITY_LOGGER.warning
        response_event = "rejected"
    log_response(
        "[INCOMING %s]: request_id=%s pid=%s client=%s method=%s path=%s event=%s status=%s duration_ms=%.2f",
        activity_timestamp(),
        request_id,
        os.getpid(),
        client_ip,
        request.method,
        request.url.path,
        response_event,
        response.status_code,
        duration_ms,
    )
    REQUEST_ID_CONTEXT.reset(context_token)
    return response


def asset_filesystem_diagnostics(file_path: Path) -> dict[str, Any]:
    try:
        file_stat = file_path.stat()
        return {
            "exists": file_path.exists(),
            "is_file": file_path.is_file(),
            "size": file_stat.st_size,
            "mode": oct(file_stat.st_mode & 0o7777),
            "owner_uid": getattr(file_stat, "st_uid", "unavailable"),
            "owner_gid": getattr(file_stat, "st_gid", "unavailable"),
        }
    except OSError as error:
        return {
            "exists": "unknown",
            "is_file": "unknown",
            "size": "unknown",
            "mode": "unknown",
            "owner_uid": "unknown",
            "owner_gid": "unknown",
            "stat_error": f"{type(error).__name__}:{error}",
        }


def log_asset_file_error(
    event: str,
    public_id: str,
    record: dict[str, Any],
    file_path: Path,
    error: Exception,
) -> None:
    diagnostics = asset_filesystem_diagnostics(file_path)
    ACTIVITY_LOGGER.error(
        "[ASSET %s]: request_id=%s pid=%s euid=%s egid=%s public_id=%s resource_key=%s storage=%s resolved_path=%s event=%s error_type=%s error_errno=%s error=%r exists=%s is_file=%s size=%s registry_size=%s mode=%s owner_uid=%s owner_gid=%s stat_error=%s",
        activity_timestamp(),
        REQUEST_ID_CONTEXT.get() or "unavailable",
        os.getpid(),
        getattr(os, "geteuid", lambda: "unavailable")(),
        getattr(os, "getegid", lambda: "unavailable")(),
        public_id,
        record.get("key", "unknown"),
        record.get("storage", "unknown"),
        file_path,
        event,
        type(error).__name__,
        getattr(error, "errno", "unavailable"),
        str(error),
        diagnostics.get("exists"),
        diagnostics.get("is_file"),
        diagnostics.get("size"),
        record.get("size", "unknown"),
        diagnostics.get("mode"),
        diagnostics.get("owner_uid"),
        diagnostics.get("owner_gid"),
        diagnostics.get("stat_error", "none"),
        exc_info=True,
    )


class LoggedAssetFileResponse(FileResponse):
    def __init__(
        self,
        *args: Any,
        public_id: str,
        resource_record: dict[str, Any],
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.public_id = public_id
        self.resource_record = resource_record

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        try:
            await super().__call__(scope, receive, send)
        except Exception as error:
            log_asset_file_error(
                "transfer_failed",
                self.public_id,
                self.resource_record,
                Path(self.path),
                error,
            )
            raise
        else:
            diagnostics = asset_filesystem_diagnostics(Path(self.path))
            ACTIVITY_LOGGER.info(
                "[ASSET %s]: request_id=%s pid=%s public_id=%s resource_key=%s storage=%s event=transfer_completed size=%s mode=%s",
                activity_timestamp(),
                REQUEST_ID_CONTEXT.get() or "unavailable",
                os.getpid(),
                self.public_id,
                self.resource_record.get("key", "unknown"),
                self.resource_record.get("storage", "unknown"),
                diagnostics.get("size"),
                diagnostics.get("mode"),
            )


@app.get("/api/assets/{public_id}", response_class=FileResponse)
def get_registered_asset(public_id: str, request: Request) -> FileResponse:
    record = get_record_by_public_id(public_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")

    access = record.get("access")
    if access not in {"public", "iit-network"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")
    if access == "iit-network" and not is_internal_request(request):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")

    file_path = resolve_record_path(record)
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")

    try:
        file_stat = file_path.stat()
        with file_path.open("rb") as asset_file:
            first_byte = asset_file.read(1)
        if file_stat.st_size > 0 and not first_byte:
            raise OSError("The file is non-empty but its first byte could not be read.")
    except OSError as error:
        log_asset_file_error("read_preflight_failed", public_id, record, file_path, error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The resource exists but the backend process cannot read it.",
        ) from None

    cache_control = (
        "private, max-age=0, must-revalidate"
        if record.get("access") != "public"
        else "public, max-age=0, must-revalidate"
    )
    headers = {"Cache-Control": cache_control, "X-Content-Type-Options": "nosniff"}
    if record.get("mediaType") == "text/html":
        headers["Content-Security-Policy"] = (
            "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:"
        )

    return LoggedAssetFileResponse(
        file_path,
        public_id=public_id,
        resource_record=record,
        media_type=record.get("mediaType") or "application/octet-stream",
        filename=record.get("displayName") or file_path.name,
        content_disposition_type=record.get("disposition") or "inline",
        headers=headers,
    )


@app.get("/api/admin/resources")
def get_admin_resources(_: str = Depends(require_admin)) -> list[dict[str, Any]]:
    registry, _ = sync_registry()
    return [
        {
            "key": record["key"],
            "url": public_url(record),
            "displayName": record["displayName"],
            "mediaType": record["mediaType"],
            "access": record["access"],
            "version": record["version"],
            "size": record["size"],
            "updatedAt": record["updatedAt"],
        }
        for record in registry["resources"]
        if not record["storage"].startswith("resources/tenders/")
    ]


def admin_resource_payload(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "key": record["key"],
        "url": public_url(record),
        "displayName": record["displayName"],
        "mediaType": record["mediaType"],
        "access": record["access"],
        "version": record["version"],
        "size": record["size"],
        "updatedAt": record["updatedAt"],
    }


@app.post("/api/admin/resources")
async def create_admin_resource(
    file: UploadFile = File(...),
    display_name: str | None = Form(None, alias="displayName"),
    _: str = Depends(require_admin),
) -> dict[str, Any]:
    uploaded_name = Path(file.filename or "").name
    suffix = Path(uploaded_name).suffix.casefold()
    allowed_suffixes = {
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".mp4",
        ".webm",
        ".html",
        ".txt",
    }
    if suffix not in allowed_suffixes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported managed-resource file format.",
        )

    file_bytes = await file.read()
    validate_managed_resource_content(file_bytes, suffix, file.content_type)
    SOFTWARE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"software-{uuid.uuid4().hex}{suffix}"
    destination = SOFTWARE_UPLOADS_DIR / filename
    temporary_file = SOFTWARE_UPLOADS_DIR / f".{filename}.tmp"
    temporary_file.write_bytes(file_bytes)
    os.replace(temporary_file, destination)
    try:
        record = register_file(
            "resources",
            destination,
            display_name=Path(display_name or uploaded_name).name,
        )
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    return admin_resource_payload(record)


@app.put("/api/admin/resources/{resource_key:path}")
async def replace_admin_resource(
    resource_key: str,
    file: UploadFile = File(...),
    display_name: str | None = Form(None, alias="displayName"),
    _: str = Depends(require_admin),
) -> dict[str, Any]:
    record = get_record_by_key(resource_key)
    if record is None or record["storage"].startswith("resources/tenders/"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Managed resource was not found.",
        )

    destination = resolve_record_path(record)
    expected_suffix = destination.suffix.casefold()
    uploaded_name = Path(file.filename or "").name
    if Path(uploaded_name).suffix.casefold() != expected_suffix:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Replacement must use the {expected_suffix} file format.",
        )

    file_bytes = await file.read()
    validate_managed_resource_content(
        file_bytes,
        expected_suffix,
        file.content_type,
    )
    safe_display_name = Path(display_name or uploaded_name).name.strip()
    if not safe_display_name:
        safe_display_name = record["displayName"]

    with RESOURCE_REPLACE_LOCK:
        current_record = get_record_by_key(resource_key)
        if current_record is None or current_record["publicId"] != record["publicId"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The resource changed while the replacement was being prepared.",
            )
        updated = replace_managed_resource(
            current_record,
            file_bytes,
            safe_display_name,
        )
    return admin_resource_payload(updated)


@app.get("/api/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "activityLog": {
            "location": ACTIVITY_LOG_LOCATION,
            "exists": ACTIVITY_LOG_FILE.is_file(),
            "lastWriteAt": ACTIVITY_LOG_LAST_WRITE_AT,
            "lastError": ACTIVITY_LOG_LAST_ERROR,
            "fallbackAttempts": ACTIVITY_LOG_FALLBACKS,
        },
    }


def list_cyber_security_library(directory: Path, _library: str) -> list[dict[str, str]]:
    if not directory.exists():
        return []

    files = sorted(
        (path for path in directory.rglob("*") if path.is_file()),
        key=lambda path: path.name.lower(),
    )
    return [
        {
            "name": path.name,
            "type": "pdf" if path.suffix.lower() == ".pdf" else "download",
            "url": public_url_for_file("resources", path),
        }
        for path in files
    ]


@app.get("/api/cyber-security-awareness")
def get_cyber_security_awareness_files() -> list[dict[str, str]]:
    return list_cyber_security_library(
        CYBER_SECURITY_AWARENESS_DIR,
        "cybersecurityawareness",
    )


@app.get("/api/cyber-security-guidelines")
def get_cyber_security_guideline_files() -> list[dict[str, str]]:
    return list_cyber_security_library(
        CYBER_SECURITY_GUIDELINES_DIR,
        "cybersecurityguidelines",
    )


@app.get("/api/cyber-security-safeguards")
def get_cyber_security_safeguard_files() -> list[dict[str, str]]:
    return list_cyber_security_library(
        CYBER_SECURITY_SAFEGUARDS_DIR,
        "cybersecuritysafeguards",
    )


@app.get("/api/client-ip")
def get_client_ip(request: Request) -> dict[str, str]:
    return {"ip": get_request_ip(request)}


@app.get("/api/admin-access")
def get_admin_access(request: Request) -> dict[str, Any]:
    ip_address = get_request_ip(request)
    return {
        "ip": ip_address,
        "allowed": is_admin_ip_allowed(ip_address),
    }


@app.get("/api/helpdesk-access")
def get_helpdesk_access(request: Request) -> JSONResponse:
    allowed = is_internal_request(request)
    payload: dict[str, Any] = {"allowed": allowed}

    if allowed:
        guide_resource_url = public_url_for_file(
            "resources", RESOURCES_DIR / HELPDESK_GUIDE_FILENAME
        )
        payload.update(
            {
                "ticketUrl": HELPDESK_URL,
                "guideUrl": f"/document?{urlencode({'url': guide_resource_url, 'title': 'Helpdesk End User Guide'})}",
                "softwareRepositoryUrl": SOFTWARE_REPOSITORY_URL,
            }
        )

    return JSONResponse(
        payload,
        headers={
            "Cache-Control": "private, no-store, max-age=0",
            "Vary": "X-Forwarded-For, X-Real-IP",
        },
    )


@app.post("/api/auth/login", include_in_schema=False)
@app.post("/api/cic-admin/auth/login")
def login(payload: LoginPayload, _: None = Depends(require_admin_ip)) -> dict[str, Any]:
    ananta_payload = verify_ananta_credentials(payload)
    access_token = ananta_payload.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ananta did not return an access token.",
        )

    expires_in = ananta_payload.get("expires_in")
    expires_at = None
    if isinstance(expires_in, (int, float)):
        expires_at = (
            datetime.now().astimezone() + timedelta(seconds=expires_in)
        ).isoformat(timespec="seconds")
    return {
        "token": access_token,
        "username": ananta_payload.get("username")
        or ananta_payload.get("_login_username")
        or payload.username,
        "employee_code": ananta_payload.get("employee_code") or "",
        "expires_at": expires_at,
        "seconds_remaining": expires_in,
        "sso": {
            "type": "external_api",
            "token": access_token,
            "me_url": None,
            "activation_url": None,
        },
    }


@app.get("/api/auth/me", include_in_schema=False)
@app.get("/api/cic-admin/auth/me")
def me(
    renew: bool = True,
    _: None = Depends(require_admin_ip),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Ananta session token.",
        )

    admin_token = authorization.split(" ", 1)[1].strip()
    payload = validate_ananta_session(admin_token, renew=renew)
    identity = payload.get("identity") or {}

    return {
        "token": admin_token,
        "username": identity.get("display_name")
        or identity.get("name")
        or identity.get("username")
        or payload.get("username")
        or "",
        "employee_code": identity.get("employee_code")
        or identity.get("employeeCode")
        or payload.get("employee_code")
        or "",
        "expires_at": payload.get("expires_at"),
        "seconds_remaining": payload.get("seconds_remaining")
        or payload.get("expires_in"),
        "renewed": payload.get("renewed", renew),
        "sso": {
            "type": "external_api",
            "token": admin_token,
            "me_url": None,
            "activation_url": None,
        },
    }


@app.post("/api/auth/logout", include_in_schema=False)
@app.post("/api/cic-admin/auth/logout")
def logout(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if authorization and authorization.startswith("Bearer "):
        session_id = authorization.split(" ", 1)[1].strip()
        delete_ananta_session(session_id)

    return {"status": "success"}


@app.get("/api/content")
def get_content() -> dict[str, list[dict[str, Any]]]:
    return read_content()


@app.put("/api/content")
def replace_content(
    payload: SiteContentPayload,
    _: str = Depends(require_admin),
) -> dict[str, list[dict[str, Any]]]:
    return write_content(payload.model_dump())


@app.put("/api/content/notices")
def update_notices(
    payload: ContentSectionPayload,
    _: str = Depends(require_admin),
) -> dict[str, list[dict[str, Any]]]:
    content = read_content()
    content["notices"] = payload.items
    return write_content(content)


@app.put("/api/content/events")
def update_events(
    payload: ContentSectionPayload,
    _: str = Depends(require_admin),
) -> dict[str, list[dict[str, Any]]]:
    content = read_content()
    content["events"] = payload.items
    return write_content(content)


@app.put("/api/content/services")
def update_services(
    payload: ContentSectionPayload,
    _: str = Depends(require_admin),
) -> dict[str, list[dict[str, Any]]]:
    content = read_content()
    content["services"] = payload.items
    return write_content(content)


@app.post("/api/content/reset")
def reset_content(_: str = Depends(require_admin)) -> dict[str, list[dict[str, Any]]]:
    if SEED_CONTENT_FILE.exists():
        content = json.loads(SEED_CONTENT_FILE.read_text(encoding="utf-8"))
        return write_content(content)

    return write_content({"notices": [], "events": [], "services": []})


@app.get("/api/teams")
def get_teams() -> list[dict[str, Any]]:
    return read_teams()


@app.put("/api/teams")
def update_teams(
    payload: ContentSectionPayload,
    _: str = Depends(require_admin),
) -> list[dict[str, Any]]:
    return write_teams(payload.items)


@app.post("/api/teams/reset")
def reset_teams(_: str = Depends(require_admin)) -> list[dict[str, Any]]:
    if TEAMS_SEED_FILE.exists():
        teams = json.loads(TEAMS_SEED_FILE.read_text(encoding="utf-8"))
        return write_teams(teams)

    return write_teams([])


@app.get("/api/tenders")
def get_tenders() -> list[dict[str, Any]]:
    return read_tenders()


@app.post("/api/tenders")
async def create_tender(
    data: str = Form(...),
    tender_pdf: UploadFile = File(..., alias="tenderPdf"),
    corrigendum_pdf: UploadFile | None = File(None, alias="corrigendumPdf"),
    _: str = Depends(require_admin),
) -> list[dict[str, Any]]:
    payload = parse_tender_form(data)
    tender_document = await read_tender_pdf(tender_pdf, "tender")
    corrigendum_document = await read_tender_pdf(corrigendum_pdf, "corrigendum")
    return save_tender_mutation(None, payload, tender_document, corrigendum_document)


@app.put("/api/tenders/{tender_id}")
async def update_tender(
    tender_id: str,
    data: str = Form(...),
    tender_pdf: UploadFile | None = File(None, alias="tenderPdf"),
    corrigendum_pdf: UploadFile | None = File(None, alias="corrigendumPdf"),
    _: str = Depends(require_admin),
) -> list[dict[str, Any]]:
    payload = parse_tender_form(data)
    tender_document = await read_tender_pdf(tender_pdf, "tender")
    corrigendum_document = await read_tender_pdf(corrigendum_pdf, "corrigendum")
    return save_tender_mutation(
        tender_id,
        payload,
        tender_document,
        corrigendum_document,
    )


@app.delete("/api/tenders/{tender_id}")
def delete_tender(
    tender_id: str,
    _: str = Depends(require_admin),
) -> list[dict[str, Any]]:
    with TENDERS_LOCK:
        tenders = read_tenders()
        next_tenders = [tender for tender in tenders if tender.get("id") != tender_id]
        if len(next_tenders) == len(tenders):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tender was not found.",
            )
        return write_tenders(next_tenders)


@app.post("/api/uploads/team-photo")
async def upload_team_photo(
    file: UploadFile = File(...),
    _: str = Depends(require_admin),
) -> dict[str, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid image file.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_TEAM_PHOTO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team photo must be {MAX_TEAM_PHOTO_SIZE_BYTES // 1024} KB or smaller.",
        )

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_TEAM_IMAGE_EXTENSIONS:
        extension = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get(file.content_type, "")

    if extension not in ALLOWED_TEAM_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported team photo formats are JPG, PNG, and WebP.",
        )

    filename = f"{int(time.time())}-{uuid.uuid4().hex[:10]}{extension}"
    destination = TEAM_IMAGES_DIR / filename
    destination.write_bytes(file_bytes)
    resource = register_file("media", destination)

    return {
        "url": public_url(resource),
    }


@app.post("/api/uploads/notice-pdf")
async def upload_notice_pdf(
    file: UploadFile = File(...),
    _: str = Depends(require_admin),
) -> dict[str, str]:
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()
    if file.content_type != "application/pdf" and extension != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid PDF file.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_NOTICE_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notice PDF must be 25 MB or smaller.",
        )

    stem = "".join(
        character if character.isalnum() or character in {" ", "-", "_"} else "-"
        for character in Path(original_name).stem
    ).strip(" .-_")
    stem = " ".join(stem.split()) or "notice"
    filename = f"{stem}.pdf"
    counter = 2
    while (NOTICES_DIR / filename).exists():
        filename = f"{stem} ({counter}).pdf"
        counter += 1

    destination = NOTICES_DIR / filename
    destination.write_bytes(file_bytes)
    resource = register_file("resources", destination)

    return {
        "url": public_url(resource),
        "filename": filename,
    }


@app.post("/api/uploads/cyber-security-safeguard")
async def upload_cyber_security_safeguard(
    file: UploadFile = File(...),
    _: str = Depends(require_admin),
) -> dict[str, str]:
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()
    if file.content_type != "application/pdf" and extension != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid PDF file.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_CYBER_SECURITY_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safeguard PDF must be 25 MB or smaller.",
        )

    stem = "".join(
        character if character.isalnum() or character in {" ", "-", "_"} else "-"
        for character in Path(original_name).stem
    ).strip(" .-_")
    stem = " ".join(stem.split()) or "safeguard"
    filename = f"{stem}.pdf"
    counter = 2
    while (CYBER_SECURITY_SAFEGUARDS_DIR / filename).exists():
        filename = f"{stem} ({counter}).pdf"
        counter += 1

    destination = CYBER_SECURITY_SAFEGUARDS_DIR / filename
    destination.write_bytes(file_bytes)
    resource = register_file("resources", destination)
    return {
        "name": filename,
        "type": "pdf",
        "url": public_url(resource),
    }


@app.delete("/api/cyber-security-safeguards")
def delete_cyber_security_safeguard(
    filename: str,
    _: str = Depends(require_admin),
) -> dict[str, str]:
    if not filename or Path(filename).name != filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid safeguard filename.",
        )

    target = CYBER_SECURITY_SAFEGUARDS_DIR / filename
    if not target.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safeguard PDF was not found.",
        )

    unregister_file("resources", target)
    target.unlink()
    return {"status": "success"}

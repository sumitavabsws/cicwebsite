import json
import os
import time
import uuid
from ipaddress import ip_address
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urljoin, urlsplit
from urllib.request import Request as UrlRequest, urlopen

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
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
VIDEOS_DIR = BASE_DIR / "content" / "videos"
CYBER_SECURITY_AWARENESS_DIR = RESOURCES_DIR / "policies" / "cybersecurityawareness"
CYBER_SECURITY_GUIDELINES_DIR = RESOURCES_DIR / "policies" / "cybersecurityguidelines"
CYBER_SECURITY_SAFEGUARDS_DIR = RESOURCES_DIR / "policies" / "cybersecuritysafeguards"
ANANTA_BASE_URL = os.getenv("ANANTA_BASE_URL", "http://127.0.0.1:8000/framework").rstrip("/")
ANANTA_CLIENT_SECRET = os.getenv("ANANTA_CLIENT_SECRET", "")
MAX_TEAM_PHOTO_SIZE_BYTES = int(os.getenv("CIC_MAX_TEAM_PHOTO_SIZE_BYTES", str(200 * 1024)))
MAX_TENDER_PDF_SIZE_BYTES = int(os.getenv("CIC_MAX_TENDER_PDF_SIZE_BYTES", str(25 * 1024 * 1024)))
MAX_CYBER_SECURITY_PDF_SIZE_BYTES = int(
    os.getenv("CIC_MAX_CYBER_SECURITY_PDF_SIZE_BYTES", str(25 * 1024 * 1024))
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
            "pdfUrl": f"/resources/tenders/{ai_tender_filename}",
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
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return normalize_ip_address(forwarded_for.split(",", 1)[0].strip())

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        return normalize_ip_address(real_ip.strip())

    return normalize_ip_address(request.client.host) if request.client else ""


def normalize_ip_address(value: str) -> str:
    """Return a canonical address, converting IPv4-mapped IPv6 to IPv4."""
    try:
        parsed = ip_address(value.strip())
    except ValueError:
        return value.strip()

    if getattr(parsed, "ipv4_mapped", None):
        return str(parsed.ipv4_mapped)

    return str(parsed)


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


def write_tenders(tenders: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ensure_tenders_file()
    with TENDERS_FILE.open("w", encoding="utf-8") as file:
        json.dump(tenders, file, indent=2, ensure_ascii=True)
        file.write("\n")

    return tenders


def validate_ananta_session(session_id: str, renew: bool = True) -> dict[str, Any]:
    query = urlencode({"renew": "1" if renew else "0"})
    url = f"{ANANTA_BASE_URL}/api/session/{session_id}/me/?{query}"
    request = UrlRequest(url, headers={"Accept": "application/json"})

    try:
        with urlopen(request, timeout=ANANTA_SESSION_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = "Ananta session expired or invalid."
        try:
            payload = json.loads(error.read().decode("utf-8"))
            detail = payload.get("error") or detail
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from None
    except (TimeoutError, URLError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Ananta SSO: {error}",
        ) from None

    if not payload.get("valid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=payload.get("error") or "Ananta session expired or invalid.",
        )

    return payload


def verify_ananta_credentials(payload: LoginPayload) -> dict[str, Any]:
    url = f"{ANANTA_BASE_URL}/api/auth/verify/"
    body = json.dumps(
        {
            "username": payload.username,
            "password": payload.password,
            "next": payload.next or "/framework/landing/",
        }
    ).encode("utf-8")
    request = UrlRequest(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            **({"X-Ananta-Client-Secret": ANANTA_CLIENT_SECRET} if ANANTA_CLIENT_SECRET else {}),
        },
    )

    try:
        with urlopen(request, timeout=ANANTA_LOGIN_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = "Invalid username or password."
        try:
            error_payload = json.loads(error.read().decode("utf-8"))
            detail = error_payload.get("error") or error_payload.get("detail") or detail
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        raise HTTPException(status_code=error.code, detail=detail) from None
    except (TimeoutError, URLError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Ananta SSO: {error}",
        ) from None


def absolute_ananta_url(path_or_url: str | None) -> str | None:
    if not path_or_url:
        return None

    if path_or_url.startswith(("http://", "https://")):
        return path_or_url

    base_parts = urlsplit(ANANTA_BASE_URL)
    base_origin = f"{base_parts.scheme}://{base_parts.netloc}"
    return urljoin(f"{base_origin}/", path_or_url.lstrip("/"))


def delete_ananta_session(session_id: str) -> None:
    url = f"{ANANTA_BASE_URL}/api/session/{session_id}/delete/"
    request = UrlRequest(url, method="POST", headers={"Accept": "application/json"})

    try:
        with urlopen(request, timeout=ANANTA_SESSION_TIMEOUT_SECONDS):
            return
    except HTTPError as error:
        if error.code == status.HTTP_404_NOT_FOUND:
            return
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to delete Ananta session.",
        ) from None
    except (TimeoutError, URLError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Ananta SSO: {error}",
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")
app.mount("/resources", StaticFiles(directory=RESOURCES_DIR), name="resources")
app.mount("/videos", StaticFiles(directory=VIDEOS_DIR), name="videos")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def list_cyber_security_library(directory: Path, library: str) -> list[dict[str, str]]:
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
            "url": f"/resources/policies/{library}/"
            + quote(path.relative_to(directory).as_posix()),
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


@app.post("/api/auth/login")
def login(payload: LoginPayload, _: None = Depends(require_admin_ip)) -> dict[str, Any]:
    ananta_payload = verify_ananta_credentials(payload)
    session_id = ananta_payload.get("session_id")
    sso = ananta_payload.get("sso") or {}

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ananta did not return a central session token.",
        )

    return {
        "token": session_id,
        "username": ananta_payload.get("username") or "",
        "employee_code": ananta_payload.get("employee_code") or "",
        "expires_at": sso.get("expires_at"),
        "sso": {
            "type": sso.get("type") or "central_session",
            "token": sso.get("token") or session_id,
            "me_url": absolute_ananta_url(sso.get("me_url")),
            "activation_url": absolute_ananta_url(sso.get("activation_url")),
        },
    }


@app.get("/api/auth/me")
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

    session_id = authorization.split(" ", 1)[1].strip()
    payload = validate_ananta_session(session_id, renew=renew)
    identity = payload.get("identity") or {}

    return {
        "token": session_id,
        "username": identity.get("display_name") or payload.get("username") or "",
        "employee_code": identity.get("employee_code") or payload.get("employee_code") or "",
        "expires_at": payload.get("expires_at"),
        "seconds_remaining": payload.get("seconds_remaining"),
        "renewed": payload.get("renewed", renew),
        "sso": {
            "type": "central_session",
            "token": session_id,
            "me_url": f"{ANANTA_BASE_URL}/api/session/{session_id}/me/",
            "activation_url": f"{ANANTA_BASE_URL}/api/session/{session_id}/activate/",
        },
    }


@app.post("/api/auth/logout")
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


@app.put("/api/tenders")
def update_tenders(
    payload: ContentSectionPayload,
    _: str = Depends(require_admin),
) -> list[dict[str, Any]]:
    return write_tenders(payload.items)


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

    return {
        "url": f"/media/teams/{filename}",
    }


@app.post("/api/uploads/tender-pdf")
async def upload_tender_pdf(
    file: UploadFile = File(...),
    _: str = Depends(require_admin),
) -> dict[str, str]:
    extension = Path(file.filename or "").suffix.lower()
    if file.content_type != "application/pdf" and extension != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid PDF file.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_TENDER_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tender PDF must be 25 MB or smaller.",
        )

    filename = f"{int(time.time())}-{uuid.uuid4().hex[:10]}.pdf"
    destination = TENDERS_DIR / filename
    destination.write_bytes(file_bytes)

    return {
        "url": f"/resources/tenders/{filename}",
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
    return {
        "name": filename,
        "type": "pdf",
        "url": f"/resources/policies/cybersecuritysafeguards/{quote(filename)}",
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

    target.unlink()
    return {"status": "success"}

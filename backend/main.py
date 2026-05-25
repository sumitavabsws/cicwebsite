import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
CONTENT_FILE = BASE_DIR / "content" / "site_content.json"
SEED_CONTENT_FILE = BASE_DIR / "content" / "site_content.seed.json"
TEAMS_FILE = BASE_DIR / "content" / "teams.json"
TEAMS_SEED_FILE = BASE_DIR / "content" / "teams.seed.json"
MEDIA_DIR = BASE_DIR / "content" / "images"
TEAM_IMAGES_DIR = MEDIA_DIR / "teams"
RESOURCES_DIR = BASE_DIR / "content" / "resources"
ADMIN_USERNAME = os.getenv("CIC_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("CIC_ADMIN_PASSWORD", "cic-admin123")
ADMIN_SECRET = os.getenv("CIC_ADMIN_SECRET", "cic-admin-secret-change-me")
TOKEN_TTL_SECONDS = int(os.getenv("CIC_ADMIN_TOKEN_TTL_SECONDS", "43200"))
MAX_TEAM_PHOTO_SIZE_BYTES = 1000 * 1024
ALLOWED_TEAM_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CIC_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://10.72.14.56:5173/",
    ).split(",")
    if origin.strip()
]


class LoginPayload(BaseModel):
    username: str
    password: str


class ContentSectionPayload(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list)


class SiteContentPayload(BaseModel):
    notices: list[dict[str, Any]] = Field(default_factory=list)
    events: list[dict[str, Any]] = Field(default_factory=list)
    services: list[dict[str, Any]] = Field(default_factory=list)


def ensure_content_file() -> None:
    if CONTENT_FILE.exists():
        return

    CONTENT_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SEED_CONTENT_FILE.exists():
        CONTENT_FILE.write_text(SEED_CONTENT_FILE.read_text(encoding="utf-8"), encoding="utf-8")
        return

    CONTENT_FILE.write_text(json.dumps({"notices": [], "events": [], "services": []}, indent=2), encoding="utf-8")


def ensure_teams_file() -> None:
    if TEAMS_FILE.exists():
        return

    TEAMS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if TEAMS_SEED_FILE.exists():
        TEAMS_FILE.write_text(TEAMS_SEED_FILE.read_text(encoding="utf-8"), encoding="utf-8")
        return

    TEAMS_FILE.write_text(json.dumps([], indent=2), encoding="utf-8")


def ensure_media_dirs() -> None:
    TEAM_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    RESOURCES_DIR.mkdir(parents=True, exist_ok=True)


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


def _token_signature(username: str, expires_at: int) -> str:
    payload = f"{username}:{expires_at}".encode("utf-8")
    digest = hmac.new(ADMIN_SECRET.encode("utf-8"), payload, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def create_token(username: str) -> str:
    expires_at = int(time.time()) + TOKEN_TTL_SECONDS
    signature = _token_signature(username, expires_at)
    payload = f"{username}:{expires_at}:{signature}".encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("utf-8")


def verify_token(token: str) -> str:
    try:
        decoded = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        username, expires_at_text, signature = decoded.split(":", 2)
        expires_at = int(expires_at_text)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        ) from None

    if expires_at < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token expired.",
        )

    expected_signature = _token_signature(username, expires_at)
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    return username


def require_admin(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing admin authorization token.",
        )

    token = authorization.split(" ", 1)[1].strip()
    return verify_token(token)


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


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/client-ip")
def get_client_ip(request: Request) -> dict[str, str]:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return {"ip": forwarded_for.split(",", 1)[0].strip()}

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        return {"ip": real_ip.strip()}

    return {"ip": request.client.host if request.client else ""}


@app.post("/api/auth/login")
def login(payload: LoginPayload) -> dict[str, str]:
    if payload.username.strip() != ADMIN_USERNAME or payload.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )

    username = payload.username.strip()
    return {
        "token": create_token(username),
        "username": username,
    }


@app.get("/api/auth/me")
def me(admin_username: str = Depends(require_admin)) -> dict[str, str]:
    return {"username": admin_username}


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
            detail="Team photo must be 200 KB or smaller.",
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

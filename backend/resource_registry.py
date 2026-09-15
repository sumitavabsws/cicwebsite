import hashlib
import json
import mimetypes
import os
import re
import secrets
from datetime import UTC, datetime
from pathlib import Path
from threading import RLock
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
CONTENT_DIR = BASE_DIR / "content"
REGISTRY_FILE = CONTENT_DIR / "resource_registry.json"
RESOURCE_ROOTS = {
    "resources": CONTENT_DIR / "resources",
    "media": CONTENT_DIR / "images",
    "videos": CONTENT_DIR / "videos",
}
REGISTRY_LOCK = RLock()


def _empty_registry() -> dict[str, Any]:
    return {"version": 1, "resources": []}


def read_registry() -> dict[str, Any]:
    if not REGISTRY_FILE.exists():
        return _empty_registry()

    with REGISTRY_FILE.open("r", encoding="utf-8") as file:
        registry = json.load(file)

    if not isinstance(registry.get("resources"), list):
        raise ValueError("Resource registry must contain a resources list.")

    return registry


def write_registry(registry: dict[str, Any]) -> None:
    REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = REGISTRY_FILE.with_suffix(".json.tmp")
    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(registry, file, indent=2, ensure_ascii=True)
        file.write("\n")
    os.replace(temporary_file, REGISTRY_FILE)


def storage_key(kind: str, relative_path: str | Path) -> str:
    normalized_path = Path(relative_path).as_posix().lstrip("/")
    return f"{kind}/{normalized_path}"


def split_storage_key(value: str) -> tuple[str, str]:
    kind, separator, relative_path = value.partition("/")
    if not separator or kind not in RESOURCE_ROOTS or not relative_path:
        raise ValueError("Invalid resource storage key.")
    return kind, relative_path


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", ".", value.casefold()).strip(".")
    return slug or "file"


def _unique_key(kind: str, relative_path: str, existing_keys: set[str]) -> str:
    path_without_suffix = str(Path(relative_path).with_suffix(""))
    base_key = f"{kind}.{_slugify(path_without_suffix)}"
    key = base_key
    suffix = 2
    while key in existing_keys:
        key = f"{base_key}.{suffix}"
        suffix += 1
    return key


def _new_public_id(existing_ids: set[str]) -> str:
    while True:
        public_id = f"r_{secrets.token_hex(12)}"
        if public_id not in existing_ids:
            return public_id


def _default_access(kind: str, relative_path: str) -> str:
    if kind == "resources" and Path(relative_path).name.casefold() == "helpdesk end user guide.pdf":
        return "iit-network"
    return "public"


def is_managed_file(file_path: Path) -> bool:
    return (
        file_path.is_file()
        and not file_path.name.startswith(".")
        and not file_path.name.casefold().startswith("readme.")
    )


def file_metadata(file_path: Path) -> dict[str, Any]:
    digest = hashlib.sha256()
    with file_path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    stat = file_path.stat()
    return {
        "size": stat.st_size,
        "sha256": digest.hexdigest(),
        "updatedAt": datetime.fromtimestamp(stat.st_mtime, UTC).isoformat(),
    }


def _record_for_file(
    kind: str,
    relative_path: str,
    existing_keys: set[str],
    existing_ids: set[str],
) -> dict[str, Any]:
    root = RESOURCE_ROOTS[kind]
    file_path = root / relative_path
    media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    return {
        "key": _unique_key(kind, relative_path, existing_keys),
        "publicId": _new_public_id(existing_ids),
        "storage": storage_key(kind, relative_path),
        "displayName": file_path.name,
        "mediaType": media_type,
        "disposition": "inline",
        "access": _default_access(kind, relative_path),
        "version": 1,
        **file_metadata(file_path),
    }


def sync_registry() -> tuple[dict[str, Any], int]:
    with REGISTRY_LOCK:
        registry = read_registry()
        records = registry["resources"]
        records_by_storage = {record["storage"]: record for record in records}
        existing_keys = {record["key"] for record in records}
        existing_ids = {record["publicId"] for record in records}
        added = 0

        for kind, root in RESOURCE_ROOTS.items():
            if not root.exists():
                continue
            for file_path in sorted(path for path in root.rglob("*") if is_managed_file(path)):
                relative_path = file_path.relative_to(root).as_posix()
                key = storage_key(kind, relative_path)
                if key in records_by_storage:
                    record = records_by_storage[key]
                    if any(field not in record for field in ("size", "sha256", "updatedAt")):
                        metadata = file_metadata(file_path)
                        for field, value in metadata.items():
                            record.setdefault(field, value)
                    continue
                record = _record_for_file(kind, relative_path, existing_keys, existing_ids)
                records.append(record)
                records_by_storage[key] = record
                existing_keys.add(record["key"])
                existing_ids.add(record["publicId"])
                added += 1

        records.sort(key=lambda record: record["key"])
        write_registry(registry)
        return registry, added


def get_record_by_public_id(public_id: str) -> dict[str, Any] | None:
    return next(
        (record for record in read_registry()["resources"] if record["publicId"] == public_id),
        None,
    )


def get_record_by_key(key: str) -> dict[str, Any] | None:
    return next(
        (record for record in read_registry()["resources"] if record["key"] == key),
        None,
    )


def get_record_by_storage(kind: str, relative_path: str | Path) -> dict[str, Any] | None:
    expected_storage = storage_key(kind, relative_path)
    return next(
        (record for record in read_registry()["resources"] if record["storage"] == expected_storage),
        None,
    )


def resolve_record_path(record: dict[str, Any]) -> Path:
    kind, relative_path = split_storage_key(record["storage"])
    root = RESOURCE_ROOTS[kind].resolve()
    resolved_path = (root / relative_path).resolve()
    if not resolved_path.is_relative_to(root):
        raise ValueError("Resource path escapes its configured storage root.")
    return resolved_path


def public_url(record: dict[str, Any]) -> str:
    return f"/api/assets/{record['publicId']}"


def public_url_for_file(kind: str, file_path: str | Path) -> str:
    root = RESOURCE_ROOTS[kind].resolve()
    resolved_path = Path(file_path).resolve()
    if not resolved_path.is_relative_to(root):
        raise ValueError("Resource path is outside its configured storage root.")

    relative_path = resolved_path.relative_to(root).as_posix()
    record = get_record_by_storage(kind, relative_path)
    if record is None:
        sync_registry()
        record = get_record_by_storage(kind, relative_path)
    if record is None:
        raise FileNotFoundError(f"Resource is not registered: {resolved_path}")
    return public_url(record)


def register_file(
    kind: str,
    file_path: str | Path,
    display_name: str | None = None,
) -> dict[str, Any]:
    root = RESOURCE_ROOTS[kind].resolve()
    resolved_path = Path(file_path).resolve()
    if not resolved_path.is_relative_to(root):
        raise ValueError("Resource path is outside its configured storage root.")

    with REGISTRY_LOCK:
        registry = read_registry()
        relative_path = resolved_path.relative_to(root).as_posix()
        expected_storage = storage_key(kind, relative_path)
        existing = next(
            (record for record in registry["resources"] if record["storage"] == expected_storage),
            None,
        )
        if existing is not None:
            existing.update(file_metadata(resolved_path))
            existing["mediaType"] = (
                mimetypes.guess_type(resolved_path.name)[0]
                or "application/octet-stream"
            )
            existing["displayName"] = display_name or existing.get(
                "displayName", resolved_path.name
            )
            existing["version"] = int(existing.get("version", 1)) + 1
            write_registry(registry)
            return existing

        existing_keys = {record["key"] for record in registry["resources"]}
        existing_ids = {record["publicId"] for record in registry["resources"]}
        record = _record_for_file(kind, relative_path, existing_keys, existing_ids)
        if display_name:
            record["displayName"] = display_name
        registry["resources"].append(record)
        registry["resources"].sort(key=lambda item: item["key"])
        write_registry(registry)
        return record


def restore_record(record: dict[str, Any]) -> None:
    """Restore an exact registry snapshot after a failed file transaction."""
    with REGISTRY_LOCK:
        registry = read_registry()
        registry["resources"] = [
            existing
            for existing in registry["resources"]
            if existing["publicId"] != record["publicId"]
            and existing["storage"] != record["storage"]
        ]
        registry["resources"].append(dict(record))
        registry["resources"].sort(key=lambda item: item["key"])
        write_registry(registry)


def unregister_file(kind: str, file_path: str | Path) -> None:
    root = RESOURCE_ROOTS[kind].resolve()
    resolved_path = Path(file_path).resolve()
    if not resolved_path.is_relative_to(root):
        raise ValueError("Resource path is outside its configured storage root.")
    expected_storage = storage_key(kind, resolved_path.relative_to(root))

    with REGISTRY_LOCK:
        registry = read_registry()
        registry["resources"] = [
            record for record in registry["resources"] if record["storage"] != expected_storage
        ]
        write_registry(registry)

import argparse
import json
import mimetypes
import os
import re
import shutil
from pathlib import Path
from urllib.parse import quote

from resource_registry import (
    REGISTRY_LOCK,
    file_metadata,
    get_record_by_key,
    public_url,
    read_registry,
    resolve_record_path,
    sync_registry,
    write_registry,
)


def command_list(search: str) -> int:
    records = read_registry()["resources"]
    normalized_search = search.casefold().strip()
    if normalized_search:
        records = [
            record
            for record in records
            if normalized_search in record["key"].casefold()
            or normalized_search in record["displayName"].casefold()
        ]

    for record in records:
        print(f"{record['key']:<72} {public_url(record):<32} {record['displayName']}")
    return 0


def command_show(key: str) -> int:
    record = get_record_by_key(key)
    if record is None:
        raise SystemExit(f"Unknown resource key: {key}")
    print(json.dumps(record, indent=2))
    return 0


def command_replace(key: str, source: Path, title: str | None) -> int:
    source = source.resolve()
    if not source.is_file():
        raise SystemExit(f"Replacement file does not exist: {source}")

    with REGISTRY_LOCK:
        registry = read_registry()
        record = next((item for item in registry["resources"] if item["key"] == key), None)
        if record is None:
            raise SystemExit(f"Unknown resource key: {key}")

        destination = resolve_record_path(record)
        if source.suffix.casefold() != destination.suffix.casefold():
            raise SystemExit(
                f"File type mismatch: expected {destination.suffix}, received {source.suffix}"
            )

        temporary_file = destination.with_name(f".{destination.name}.replacement")
        shutil.copyfile(source, temporary_file)
        os.replace(temporary_file, destination)

        record["mediaType"] = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
        record["version"] = int(record.get("version", 1)) + 1
        record.update(file_metadata(destination))
        if title:
            record["displayName"] = title
        write_registry(registry)

    print(f"Updated {key}; public URL remains {public_url(record)}")
    return 0


def command_validate() -> int:
    missing = []
    duplicate_ids = []
    duplicate_keys = []
    stale_metadata = []
    seen_ids = set()
    seen_keys = set()
    referenced_ids = set()
    legacy_references = []

    for record in read_registry()["resources"]:
        if record["publicId"] in seen_ids:
            duplicate_ids.append(record["publicId"])
        seen_ids.add(record["publicId"])
        if record["key"] in seen_keys:
            duplicate_keys.append(record["key"])
        seen_keys.add(record["key"])
        resolved_path = resolve_record_path(record)
        if not resolved_path.is_file():
            missing.append(record["key"])
        else:
            current_metadata = file_metadata(resolved_path)
            if (
                record.get("size") != current_metadata["size"]
                or record.get("sha256") != current_metadata["sha256"]
            ):
                stale_metadata.append(record["key"])

    workspace_root = Path(__file__).resolve().parent.parent
    reference_targets = [
        workspace_root / "frontend" / "index.html",
        *(
            path
            for path in (workspace_root / "frontend" / "src").rglob("*")
            if path.is_file() and path.suffix.casefold() in {".js", ".jsx", ".json", ".css"}
        ),
        *(
            path
            for path in (workspace_root / "backend" / "content").rglob("*.json")
            if path.name != "resource_registry.json"
        ),
    ]
    legacy_pattern = re.compile(r'''["'`](/(?:resources|media|videos|files|references)/[^"'`]*)''')
    asset_pattern = re.compile(r"/api/assets/(r_[A-Za-z0-9]+)")
    for target in reference_targets:
        text = target.read_text(encoding="utf-8")
        referenced_ids.update(asset_pattern.findall(text))
        legacy_references.extend(
            f"{target.relative_to(workspace_root)}: {match}"
            for match in legacy_pattern.findall(text)
        )

    unknown_referenced_ids = sorted(referenced_ids - seen_ids)

    if (
        missing
        or duplicate_ids
        or duplicate_keys
        or stale_metadata
        or unknown_referenced_ids
        or legacy_references
    ):
        if missing:
            print("Missing files:", *missing, sep="\n  ")
        if duplicate_ids:
            print("Duplicate public IDs:", *duplicate_ids, sep="\n  ")
        if duplicate_keys:
            print("Duplicate keys:", *duplicate_keys, sep="\n  ")
        if stale_metadata:
            print(
                "Files changed outside the resource replacement workflow:",
                *stale_metadata,
                sep="\n  ",
            )
        if unknown_referenced_ids:
            print("Unknown referenced public IDs:", *unknown_referenced_ids, sep="\n  ")
        if legacy_references:
            print("Legacy direct resource URLs:", *legacy_references, sep="\n  ")
        return 1

    print(
        f"Validated {len(seen_ids)} registered resources and "
        f"{len(referenced_ids)} referenced public IDs."
    )
    return 0


def command_migrate_references() -> int:
    workspace_root = Path(__file__).resolve().parent.parent
    frontend_source = workspace_root / "frontend" / "src"
    content_root = workspace_root / "backend" / "content"
    targets = [
        workspace_root / "frontend" / "index.html",
        *(
            path
            for path in frontend_source.rglob("*")
            if path.is_file() and path.suffix.casefold() in {".js", ".jsx", ".json", ".css"}
        ),
        *(
            path
            for path in content_root.rglob("*.json")
            if path.name != "resource_registry.json"
        ),
    ]

    replacements = {}
    prefix_by_kind = {
        "resources": "/resources/",
        "media": "/media/",
        "videos": "/videos/",
    }
    for record in read_registry()["resources"]:
        kind, relative_path = record["storage"].split("/", 1)
        old_url = prefix_by_kind[kind] + relative_path
        new_url = public_url(record)
        replacements[old_url] = new_url
        replacements[quote(old_url, safe="/")] = new_url

    changed_files = 0
    replacement_count = 0
    for target in targets:
        original = target.read_text(encoding="utf-8")
        migrated = original
        for old_url, new_url in replacements.items():
            occurrences = migrated.count(old_url)
            if occurrences:
                migrated = migrated.replace(old_url, new_url)
                replacement_count += occurrences
        opaque_prefix_occurrences = migrated.count("/asset/")
        if opaque_prefix_occurrences:
            migrated = migrated.replace("/asset/", "/api/assets/")
            replacement_count += opaque_prefix_occurrences
        if migrated != original:
            target.write_text(migrated, encoding="utf-8", newline="")
            changed_files += 1

    print(f"Migrated {replacement_count} references across {changed_files} files.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Manage CIC website resources.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("sync", help="Register files not yet in the registry.")
    list_parser = subparsers.add_parser("list", help="List registered resources.")
    list_parser.add_argument("search", nargs="?", default="")
    show_parser = subparsers.add_parser("show", help="Show one resource record.")
    show_parser.add_argument("key")
    replace_parser = subparsers.add_parser("replace", help="Replace a file while preserving its URL.")
    replace_parser.add_argument("key")
    replace_parser.add_argument("file", type=Path)
    replace_parser.add_argument("--title")
    subparsers.add_parser("validate", help="Validate registry integrity and file coverage.")
    subparsers.add_parser(
        "migrate-references",
        help="Replace legacy resource paths in frontend and content files with opaque URLs.",
    )

    arguments = parser.parse_args()
    if arguments.command == "sync":
        registry, added = sync_registry()
        print(f"Registered {added} new files; {len(registry['resources'])} total.")
        return 0
    if arguments.command == "list":
        return command_list(arguments.search)
    if arguments.command == "show":
        return command_show(arguments.key)
    if arguments.command == "replace":
        return command_replace(arguments.key, arguments.file, arguments.title)
    if arguments.command == "migrate-references":
        return command_migrate_references()
    return command_validate()


if __name__ == "__main__":
    raise SystemExit(main())

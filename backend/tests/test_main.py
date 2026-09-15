import unittest
import asyncio
import json
import logging
from io import BytesIO
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from urllib.request import Request as UrlRequest

from fastapi import HTTPException, Request, Response, UploadFile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main
import resource_registry


class JsonResponseStub:
    def __init__(self, payload: dict, status: int = 200):
        self.payload = payload
        self.status = status

    def read(self) -> bytes:
        return json.dumps(self.payload).encode("utf-8")

    def getcode(self) -> int:
        return self.status

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


class SiteConfigurationTests(unittest.TestCase):
    def test_site_configuration_has_an_ip_allowlist(self) -> None:
        config = main.read_site_config()
        self.assertIn("adminAllowedIps", config)
        self.assertIsInstance(config["adminAllowedIps"], list)

    def test_team_photo_limit_is_positive(self) -> None:
        self.assertGreater(main.MAX_TEAM_PHOTO_SIZE_BYTES, 0)

    def test_ipv4_mapped_ipv6_is_normalized(self) -> None:
        self.assertEqual(main.normalize_ip_address("::ffff:10.72.14.39"), "10.72.14.39")

    def test_ipv4_address_is_preserved(self) -> None:
        self.assertEqual(main.normalize_ip_address("10.72.14.39"), "10.72.14.39")

    def test_content_paths_stay_inside_backend(self) -> None:
        self.assertTrue(Path(main.CONTENT_FILE).is_relative_to(main.BASE_DIR))


class AdminAuthenticationRoutingTests(unittest.TestCase):
    def test_unique_admin_authentication_routes_are_registered(self) -> None:
        registered_paths = {route.path for route in main.app.routes}
        self.assertIn("/api/cic-admin/auth/login", registered_paths)
        self.assertIn("/api/cic-admin/auth/me", registered_paths)
        self.assertIn("/api/cic-admin/auth/logout", registered_paths)

        documented_paths = main.app.openapi()["paths"]
        self.assertIn("/api/cic-admin/auth/login", documented_paths)
        self.assertIn("/api/cic-admin/auth/me", documented_paths)
        self.assertIn("/api/cic-admin/auth/logout", documented_paths)
        self.assertNotIn("/api/auth/login", documented_paths)
        self.assertNotIn("/api/auth/me", documented_paths)
        self.assertNotIn("/api/auth/logout", documented_paths)

    def test_unique_login_route_normalizes_external_api_token(self) -> None:
        ananta_response = {
            "access_token": "session-123",
            "token_type": "bearer",
            "expires_in": 3599,
            "_login_username": "admin-user",
        }
        with patch.object(
            main, "verify_ananta_credentials", return_value=ananta_response
        ):
            response = main.login(
                main.LoginPayload(username="admin-user", password="password"),
                None,
            )

        self.assertEqual(response["token"], "session-123")
        self.assertEqual(response["username"], "admin-user")
        self.assertEqual(response["sso"]["type"], "external_api")
        self.assertEqual(response["seconds_remaining"], 3599)

    def test_unique_me_route_validates_bearer_session(self) -> None:
        session_response = {
            "valid": True,
            "username": "admin-user",
            "seconds_remaining": 3500,
            "identity": {
                "display_name": "Admin User",
                "employee_code": "12345",
            },
        }
        with patch.object(
            main, "validate_ananta_session", return_value=session_response
        ) as validate_session:
            response = main.me(
                renew=True,
                _=None,
                authorization="Bearer session-123",
            )

        validate_session.assert_called_once_with("session-123", renew=True)
        self.assertEqual(response["username"], "Admin User")
        self.assertEqual(response["employee_code"], "12345")

    def test_login_uses_documented_framework_external_api(self) -> None:
        api_response = JsonResponseStub(
            {
                "access_token": "session-123",
                "token_type": "bearer",
                "expires_in": 3599,
            }
        )
        with patch.object(
            main,
            "open_outgoing_request",
            return_value=api_response,
        ) as outgoing_request:
            response = main.verify_ananta_credentials(
                main.LoginPayload(username="admin-user", password="password")
            )

        request = outgoing_request.call_args.args[0]
        self.assertEqual(
            request.full_url,
            f"{main.ANANTA_API_BASE_URL}/api/v1/users/login/",
        )
        self.assertEqual(response["_auth_mode"], "external_api")
        self.assertEqual(response["access_token"], "session-123")

    def test_admin_session_uses_documented_profile_endpoint(self) -> None:
        profile_response = JsonResponseStub(
            {
                "user_id": "12345",
                "email": "admin-user@iitkgp.ac.in",
                "name": "Admin User",
                "expires_in": 3500,
            }
        )
        with patch.object(
            main, "open_outgoing_request", return_value=profile_response
        ) as outgoing_request:
            response = main.me(
                renew=True,
                _=None,
                authorization="Bearer session-123",
            )

        request = outgoing_request.call_args.args[0]
        self.assertEqual(
            request.full_url,
            f"{main.ANANTA_API_BASE_URL}/api/v1/users/profile/",
        )
        self.assertEqual(
            request.get_header("Authorization"), "Bearer session-123"
        )
        self.assertEqual(response["token"], "session-123")
        self.assertEqual(response["username"], "Admin User")
        self.assertEqual(response["employee_code"], "12345")
        self.assertEqual(response["sso"]["type"], "external_api")


class ActivityLoggingTests(unittest.TestCase):
    def test_activity_logger_uses_process_safe_rotation(self) -> None:
        self.assertIn(
            main.ACTIVITY_LOG_LOCATION,
            {
                "backend/log.txt",
                "backend/content/log.txt",
                "temporary/cic-website/log.txt",
            },
        )
        self.assertTrue(
            any(
                isinstance(handler, main.ProcessSafeRotatingFileHandler)
                for handler in main.ACTIVITY_LOGGER.handlers
            )
        )

    def test_worker_startup_writes_an_initial_log_record(self) -> None:
        with patch.object(main.ACTIVITY_LOGGER, "info") as log_info:
            main.log_backend_worker_startup()

        message = log_info.call_args.args[0] % log_info.call_args.args[1:]
        self.assertTrue(message.startswith("[SYSTEM "))
        self.assertIn("event=backend_worker_started", message)
        self.assertIn(f"log_file={main.ACTIVITY_LOG_LOCATION}", message)

    def test_health_reports_activity_log_status(self) -> None:
        health = main.health_check()
        self.assertEqual(health["status"], "ok")
        self.assertEqual(
            health["activityLog"]["location"], main.ACTIVITY_LOG_LOCATION
        )
        self.assertTrue(health["activityLog"]["exists"])
        self.assertIsNotNone(health["activityLog"]["lastWriteAt"])

    def test_rotation_is_coordinated_between_handler_instances(self) -> None:
        with TemporaryDirectory() as directory:
            log_path = Path(directory) / "log.txt"
            handlers = [
                main.ProcessSafeRotatingFileHandler(
                    log_path,
                    maxBytes=100,
                    backupCount=3,
                    encoding="utf-8",
                    delay=True,
                )
                for _ in range(2)
            ]
            for handler in handlers:
                handler.setFormatter(logging.Formatter("%(message)s"))

            try:
                for handler, marker in (
                    (handlers[0], "FIRST"),
                    (handlers[1], "SECOND"),
                    (handlers[0], "THIRD"),
                ):
                    handler.emit(
                        logging.LogRecord(
                            "test",
                            logging.INFO,
                            __file__,
                            1,
                            f"{marker}-" + ("x" * 70),
                            (),
                            None,
                        )
                    )
            finally:
                for handler in handlers:
                    handler.close()

            combined_logs = "\n".join(
                path.read_text(encoding="utf-8")
                for path in sorted(Path(directory).glob("log.txt*"))
                if path.name != "log.txt.lock"
            )
            self.assertIn("FIRST", combined_logs)
            self.assertIn("SECOND", combined_logs)
            self.assertIn("THIRD", combined_logs)

    def test_outgoing_url_redacts_session_credentials_and_fragment(self) -> None:
        safe_url = main.sanitize_outgoing_url(
            "https://user:password@example.test/api/session/secret-session/me/"
            "?renew=1&token=secret-token#private-fragment"
        )
        self.assertIn("/api/session/<redacted-session>/me/", safe_url)
        self.assertIn("renew=1", safe_url)
        self.assertNotIn("password", safe_url)
        self.assertNotIn("secret-session", safe_url)
        self.assertNotIn("secret-token", safe_url)
        self.assertNotIn("private-fragment", safe_url)

    def test_outgoing_call_failure_is_logged_with_request_context(self) -> None:
        request = UrlRequest("https://example.test/framework/api/session")
        context_token = main.REQUEST_ID_CONTEXT.set("request-123")
        try:
            with (
                patch.object(main, "urlopen", side_effect=URLError("unavailable")),
                patch.object(main.ACTIVITY_LOGGER, "error") as log_error,
            ):
                with self.assertRaises(URLError):
                    main.open_outgoing_request(request, timeout=1)
        finally:
            main.REQUEST_ID_CONTEXT.reset(context_token)

        message = log_error.call_args.args[0] % log_error.call_args.args[1:]
        self.assertTrue(message.startswith("[OUTGOING "))
        self.assertIn("request_id=request-123", message)
        self.assertIn("event=failed", message)
        self.assertIn("error_type=URLError", message)

    def test_outgoing_post_follows_same_host_307_and_preserves_body(self) -> None:
        original_url = "http://127.0.0.1:8000/api/v1/users/login/"
        redirect_url = "http://127.0.0.1:8000/api/v1/users/login"
        request_body = b'{"username":"admin","password":"secret"}'
        request = UrlRequest(
            original_url,
            data=request_body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        redirect = HTTPError(
            original_url,
            307,
            "Temporary Redirect",
            {"Location": redirect_url},
            None,
        )
        response = JsonResponseStub({"access_token": "session-123"})

        with patch.object(main, "urlopen", side_effect=[redirect, response]) as opener:
            result = main.open_outgoing_request(request, timeout=1)

        redirected_request = opener.call_args_list[1].args[0]
        self.assertIs(result, response)
        self.assertEqual(redirected_request.full_url, redirect_url)
        self.assertEqual(redirected_request.get_method(), "POST")
        self.assertEqual(redirected_request.data, request_body)
        self.assertEqual(
            redirected_request.get_header("Content-type"), "application/json"
        )

    def test_outgoing_redirect_rejects_a_different_host(self) -> None:
        request = UrlRequest(
            "http://127.0.0.1:8000/api/v1/users/login/",
            data=b"sensitive-body",
            method="POST",
        )

        with self.assertRaises(HTTPException) as context:
            main.redirected_outgoing_request(request, "https://attacker.example/login")

        self.assertEqual(context.exception.status_code, 502)

    def test_incoming_request_logs_start_and_completion_with_same_id(self) -> None:
        request = Request(
            {
                "type": "http",
                "http_version": "1.1",
                "method": "GET",
                "scheme": "http",
                "path": "/api/health",
                "raw_path": b"/api/health",
                "query_string": b"token=not-logged",
                "headers": [],
                "client": ("203.0.113.10", 443),
                "server": ("testserver", 80),
            }
        )

        async def call_next(_: Request) -> Response:
            return Response(status_code=200)

        with patch.object(main.ACTIVITY_LOGGER, "info") as log_info:
            response = asyncio.run(main.log_backend_activity(request, call_next))

        self.assertEqual(response.status_code, 200)
        request_id = response.headers["x-request-id"]
        messages = [call.args[0] % call.args[1:] for call in log_info.call_args_list]
        self.assertEqual(len(messages), 2)
        self.assertTrue(all(message.startswith("[INCOMING ") for message in messages))
        self.assertTrue(all(f"request_id={request_id}" in message for message in messages))
        self.assertTrue(all("pid=" in message for message in messages))
        self.assertNotIn("not-logged", "\n".join(messages))

    def test_error_response_is_logged_as_a_failed_incoming_call(self) -> None:
        request = Request(
            {
                "type": "http",
                "http_version": "1.1",
                "method": "POST",
                "scheme": "http",
                "path": "/api/admin-action",
                "raw_path": b"/api/admin-action",
                "query_string": b"",
                "headers": [],
                "client": ("203.0.113.10", 443),
                "server": ("testserver", 80),
            }
        )

        async def call_next(_: Request) -> Response:
            return Response(status_code=500)

        with patch.object(main.ACTIVITY_LOGGER, "error") as log_error:
            response = asyncio.run(main.log_backend_activity(request, call_next))

        self.assertEqual(response.status_code, 500)
        message = log_error.call_args.args[0] % log_error.call_args.args[1:]
        self.assertIn("event=failed", message)
        self.assertIn("status=500", message)


class ResourceRegistryTests(unittest.TestCase):
    def test_software_manager_upload_route_is_registered(self) -> None:
        documented_paths = main.app.openapi()["paths"]
        self.assertIn("/api/admin/resources", documented_paths)
        self.assertIn("post", documented_paths["/api/admin/resources"])

    def test_every_managed_file_is_registered(self) -> None:
        registry = main.sync_registry()[0]
        registered_storage = {record["storage"] for record in registry["resources"]}
        managed_storage = {
            f"{kind}/{path.relative_to(root).as_posix()}"
            for kind, root in main.RESOURCE_ROOTS.items()
            for path in root.rglob("*")
            if main.is_managed_file(path)
        }
        self.assertEqual(registered_storage, managed_storage)

    def test_registry_ids_and_keys_are_unique(self) -> None:
        records = main.sync_registry()[0]["resources"]
        self.assertEqual(len({record["publicId"] for record in records}), len(records))
        self.assertEqual(len({record["key"] for record in records}), len(records))
        for record in records:
            self.assertGreater(record["size"], 0)
            self.assertEqual(len(record["sha256"]), 64)
            self.assertTrue(record["updatedAt"])

    def test_opaque_asset_url_serves_registered_file(self) -> None:
        record = main.get_record_by_key("resources.logo.iitkgp.logo")
        request = Request(
            {"type": "http", "headers": [], "client": ("203.0.113.10", 443)}
        )
        response = main.get_registered_asset(record["publicId"], request)
        self.assertEqual(response.headers["x-content-type-options"], "nosniff")
        self.assertEqual(response.headers["accept-ranges"], "bytes")
        self.assertNotIn("IITKGP_LOGO.png", main.public_url(record))

    def test_unknown_asset_returns_not_found(self) -> None:
        request = Request(
            {"type": "http", "headers": [], "client": ("203.0.113.10", 443)}
        )
        with self.assertRaises(HTTPException) as context:
            main.get_registered_asset("r_doesnotexist", request)
        self.assertEqual(context.exception.status_code, 404)

    def test_unreadable_asset_logs_filesystem_diagnostics_before_response(self) -> None:
        with TemporaryDirectory() as directory:
            asset_path = Path(directory) / "unreadable.pdf"
            asset_path.write_bytes(b"%PDF-test")
            record = {
                "publicId": "r_unreadable",
                "key": "resources.test.unreadable",
                "storage": "resources/unreadable.pdf",
                "displayName": "unreadable.pdf",
                "mediaType": "application/pdf",
                "access": "public",
                "size": asset_path.stat().st_size,
            }
            request = Request(
                {"type": "http", "headers": [], "client": ("203.0.113.10", 443)}
            )
            original_open = Path.open

            def deny_asset_open(path: Path, *args, **kwargs):
                if path == asset_path:
                    raise PermissionError(13, "Permission denied", str(path))
                return original_open(path, *args, **kwargs)

            with (
                patch.object(main, "get_record_by_public_id", return_value=record),
                patch.object(main, "resolve_record_path", return_value=asset_path),
                patch.object(Path, "open", new=deny_asset_open),
                patch.object(main.ACTIVITY_LOGGER, "error") as log_error,
            ):
                with self.assertRaises(HTTPException) as context:
                    main.get_registered_asset("r_unreadable", request)

            self.assertEqual(context.exception.status_code, 500)
            logged_values = log_error.call_args.args
            self.assertIn("read_preflight_failed", logged_values)
            self.assertIn("PermissionError", logged_values)
            self.assertIn("resources.test.unreadable", logged_values)
            self.assertIn("resources/unreadable.pdf", logged_values)

    def test_iit_network_resource_is_hidden_from_external_clients(self) -> None:
        record = main.get_record_by_key("resources.helpdesk.end.user.guide")
        request = Request(
            {"type": "http", "headers": [], "client": ("203.0.113.10", 443)}
        )
        with self.assertRaises(HTTPException) as context:
            main.get_registered_asset(record["publicId"], request)
        self.assertEqual(context.exception.status_code, 404)

    def test_legacy_filesystem_routes_are_not_public(self) -> None:
        mounted_paths = {
            route.path for route in main.app.routes if route.__class__.__name__ == "Mount"
        }
        self.assertNotIn("/resources", mounted_paths)
        self.assertNotIn("/media", mounted_paths)
        self.assertNotIn("/videos", mounted_paths)

    def test_range_requests_are_supported_for_video(self) -> None:
        record = main.get_record_by_key("videos.cicvideo")
        request = Request(
            {"type": "http", "headers": [], "client": ("203.0.113.10", 443)}
        )
        response = main.get_registered_asset(record["publicId"], request)
        self.assertEqual(response.media_type, "video/mp4")
        self.assertEqual(response.headers["accept-ranges"], "bytes")

    def test_admin_replacement_preserves_public_id_and_refreshes_metadata(self) -> None:
        with TemporaryDirectory() as directory:
            content_dir = Path(directory)
            resources_dir = content_dir / "resources"
            images_dir = content_dir / "images"
            videos_dir = content_dir / "videos"
            resources_dir.mkdir()
            images_dir.mkdir()
            videos_dir.mkdir()
            registry_file = content_dir / "resource_registry.json"
            roots = {
                "resources": resources_dir,
                "media": images_dir,
                "videos": videos_dir,
            }

            with (
                patch.object(resource_registry, "RESOURCE_ROOTS", roots),
                patch.object(resource_registry, "REGISTRY_FILE", registry_file),
            ):
                path = resources_dir / "guide.pdf"
                path.write_bytes(b"%PDF-old")
                original = main.register_file("resources", path)

                updated = main.replace_managed_resource(
                    original,
                    b"%PDF-new and longer",
                    "Updated Guide.pdf",
                )

                self.assertEqual(updated["publicId"], original["publicId"])
                self.assertEqual(updated["version"], 2)
                self.assertEqual(updated["displayName"], "Updated Guide.pdf")
                self.assertEqual(path.read_bytes(), b"%PDF-new and longer")
                self.assertNotEqual(updated["sha256"], original["sha256"])

    def test_software_manager_can_create_a_managed_resource(self) -> None:
        with TemporaryDirectory() as directory:
            content_dir = Path(directory)
            resources_dir = content_dir / "resources"
            software_dir = resources_dir / "softwaresupport" / "managed"
            images_dir = content_dir / "images"
            videos_dir = content_dir / "videos"
            resources_dir.mkdir()
            images_dir.mkdir()
            videos_dir.mkdir()
            registry_file = content_dir / "resource_registry.json"
            roots = {
                "resources": resources_dir,
                "media": images_dir,
                "videos": videos_dir,
            }

            upload = UploadFile(
                filename="Installation Guide.pdf",
                file=BytesIO(b"%PDF-new software guide"),
            )
            with (
                patch.object(main, "SOFTWARE_UPLOADS_DIR", software_dir),
                patch.object(resource_registry, "RESOURCE_ROOTS", roots),
                patch.object(resource_registry, "REGISTRY_FILE", registry_file),
            ):
                created = asyncio.run(
                    main.create_admin_resource(
                        file=upload,
                        display_name="Software XYZ Installation.pdf",
                        _="admin-session",
                    )
                )

                self.assertTrue(created["url"].startswith("/api/assets/r_"))
                self.assertEqual(
                    created["displayName"], "Software XYZ Installation.pdf"
                )
                self.assertEqual(created["version"], 1)
                stored_files = list(software_dir.glob("*.pdf"))
                self.assertEqual(len(stored_files), 1)
                self.assertEqual(
                    stored_files[0].read_bytes(), b"%PDF-new software guide"
                )


class TenderDocumentTransactionTests(unittest.TestCase):
    def tender_payload(self, remove_corrigendum: bool = False) -> dict:
        return {
            "title": "Updated Tender",
            "refNo": "CIC/TEST/1",
            "startDate": "1 Sep 2026 10:00 AM",
            "endDate": "2 Sep 2026 10:00 AM",
            "bidOpeningDate": "2 Sep 2026 11:00 AM",
            "corrigendumDetails": "Revised technical schedule",
            "pdfLabel": "View Tender PDF",
            "corrigendumLabel": "View Corrigendum",
            "removeCorrigendum": remove_corrigendum,
        }

    def test_replacement_keeps_tender_public_url_and_updates_content(self) -> None:
        with TemporaryDirectory() as directory:
            content_dir = Path(directory)
            resources_dir = content_dir / "resources"
            tenders_dir = resources_dir / "tenders"
            images_dir = content_dir / "images"
            videos_dir = content_dir / "videos"
            tenders_dir.mkdir(parents=True)
            images_dir.mkdir()
            videos_dir.mkdir()
            tenders_file = content_dir / "tenders.json"
            registry_file = content_dir / "resource_registry.json"
            roots = {
                "resources": resources_dir,
                "media": images_dir,
                "videos": videos_dir,
            }

            with (
                patch.object(main, "TENDERS_DIR", tenders_dir),
                patch.object(main, "TENDERS_FILE", tenders_file),
                patch.object(resource_registry, "RESOURCE_ROOTS", roots),
                patch.object(resource_registry, "REGISTRY_FILE", registry_file),
            ):
                old_path = tenders_dir / "old-tender.pdf"
                old_path.write_bytes(b"%PDF-old tender")
                old_resource = main.register_file(
                    "resources", old_path, display_name="old-tender.pdf"
                )
                tenders_file.write_text(
                    json.dumps(
                        [
                            {
                                "id": "tender-1",
                                "title": "Old Tender",
                                "pdfUrl": main.public_url(old_resource),
                                "pdfFileName": "old-tender.pdf",
                            }
                        ]
                    ),
                    encoding="utf-8",
                )

                saved = main.save_tender_mutation(
                    "tender-1",
                    self.tender_payload(),
                    (b"%PDF-new tender", "updated-tender.pdf"),
                    (b"%PDF-corrigendum", "corrigendum.pdf"),
                )

                self.assertTrue(old_path.exists())
                self.assertEqual(old_path.read_bytes(), b"%PDF-new tender")
                self.assertEqual(saved[0]["pdfUrl"], main.public_url(old_resource))
                self.assertTrue(saved[0]["corrigendumUrl"].startswith("/api/assets/"))
                self.assertEqual(len(list(tenders_dir.glob("*.pdf"))), 2)
                records = resource_registry.read_registry()["resources"]
                self.assertEqual(len(records), 2)
                updated_resource = next(
                    record
                    for record in records
                    if record["publicId"] == old_resource["publicId"]
                )
                self.assertEqual(updated_resource["version"], 2)
                self.assertNotEqual(updated_resource["sha256"], old_resource["sha256"])

    def test_adding_corrigendum_without_tender_upload_preserves_tender(self) -> None:
        with TemporaryDirectory() as directory:
            content_dir = Path(directory)
            resources_dir = content_dir / "resources"
            tenders_dir = resources_dir / "tenders"
            images_dir = content_dir / "images"
            videos_dir = content_dir / "videos"
            tenders_dir.mkdir(parents=True)
            images_dir.mkdir()
            videos_dir.mkdir()
            tenders_file = content_dir / "tenders.json"
            registry_file = content_dir / "resource_registry.json"
            roots = {
                "resources": resources_dir,
                "media": images_dir,
                "videos": videos_dir,
            }

            with (
                patch.object(main, "TENDERS_DIR", tenders_dir),
                patch.object(main, "TENDERS_FILE", tenders_file),
                patch.object(resource_registry, "RESOURCE_ROOTS", roots),
                patch.object(resource_registry, "REGISTRY_FILE", registry_file),
            ):
                tender_path = tenders_dir / "existing-tender.pdf"
                original_content = b"%PDF-existing tender"
                tender_path.write_bytes(original_content)
                tender_resource = main.register_file("resources", tender_path)
                tender_url = main.public_url(tender_resource)
                tenders_file.write_text(
                    json.dumps(
                        [
                            {
                                "id": "tender-1",
                                "title": "Existing Tender",
                                "pdfUrl": tender_url,
                                "pdfFileName": "Existing Tender.pdf",
                            }
                        ]
                    ),
                    encoding="utf-8",
                )

                saved = main.save_tender_mutation(
                    "tender-1",
                    self.tender_payload(),
                    None,
                    (b"%PDF-new corrigendum", "corrigendum.pdf"),
                )

                self.assertTrue(tender_path.exists())
                self.assertEqual(tender_path.read_bytes(), original_content)
                self.assertEqual(saved[0]["pdfUrl"], tender_url)
                self.assertEqual(saved[0]["pdfFileName"], "Existing Tender.pdf")
                self.assertTrue(saved[0]["corrigendumUrl"].startswith("/api/assets/"))
                self.assertEqual(len(list(tenders_dir.glob("*.pdf"))), 2)

    def test_failed_save_preserves_old_pdf_and_removes_staged_replacement(self) -> None:
        with TemporaryDirectory() as directory:
            content_dir = Path(directory)
            resources_dir = content_dir / "resources"
            tenders_dir = resources_dir / "tenders"
            images_dir = content_dir / "images"
            videos_dir = content_dir / "videos"
            tenders_dir.mkdir(parents=True)
            images_dir.mkdir()
            videos_dir.mkdir()
            tenders_file = content_dir / "tenders.json"
            registry_file = content_dir / "resource_registry.json"
            roots = {
                "resources": resources_dir,
                "media": images_dir,
                "videos": videos_dir,
            }

            with (
                patch.object(main, "TENDERS_DIR", tenders_dir),
                patch.object(main, "TENDERS_FILE", tenders_file),
                patch.object(resource_registry, "RESOURCE_ROOTS", roots),
                patch.object(resource_registry, "REGISTRY_FILE", registry_file),
            ):
                old_path = tenders_dir / "old-tender.pdf"
                old_path.write_bytes(b"%PDF-old tender")
                old_resource = main.register_file("resources", old_path)
                original_tenders = [
                    {
                        "id": "tender-1",
                        "title": "Old Tender",
                        "pdfUrl": main.public_url(old_resource),
                        "pdfFileName": "old-tender.pdf",
                    }
                ]
                tenders_file.write_text(json.dumps(original_tenders), encoding="utf-8")

                with patch.object(
                    main, "persist_tenders_file", side_effect=OSError("write failed")
                ):
                    with self.assertRaises(OSError):
                        main.save_tender_mutation(
                            "tender-1",
                            self.tender_payload(),
                            (b"%PDF-new tender", "updated-tender.pdf"),
                            None,
                        )

                self.assertTrue(old_path.exists())
                self.assertEqual(json.loads(tenders_file.read_text()), original_tenders)
                self.assertEqual(list(tenders_dir.glob("*.pdf")), [old_path])
                records = resource_registry.read_registry()["resources"]
                self.assertEqual(
                    [record["publicId"] for record in records],
                    [old_resource["publicId"]],
                )


if __name__ == "__main__":
    unittest.main()

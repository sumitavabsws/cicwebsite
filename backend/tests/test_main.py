import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main


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


if __name__ == "__main__":
    unittest.main()

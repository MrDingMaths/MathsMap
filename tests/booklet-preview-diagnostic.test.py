import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

spec = importlib.util.spec_from_file_location("diagnostic", "scripts/booklet/diagnose-page-preview.py")
diagnostic = importlib.util.module_from_spec(spec)
spec.loader.exec_module(diagnostic)


class PreviewDiagnosticTest(unittest.TestCase):
    def test_pixels_single_page_and_no_acceptance(self):
        Path(".booklet-work").mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="preview-test-", dir=".booklet-work") as directory:
            root = Path(directory)
            a, b, c = (root / name for name in ("a.png", "b.png", "c.png"))
            Image.new("RGB", (30, 30), "white").save(a)
            Image.new("RGB", (30, 30), "white").save(b, compress_level=0)
            Image.new("RGB", (30, 30), "black").save(c)
            self.assertTrue(diagnostic.compare_images(a, b)["samePixels"])
            self.assertFalse(diagnostic.compare_images(a, c)["samePixels"])
            engine = diagnostic.load_pdf_engine()
            pdf = root / "fixture.pdf"
            with engine.open() as document:
                document.new_page().insert_text((20, 30), "Preview diagnostic fixture")
                document.save(pdf)
            original = diagnostic.digest(pdf)
            same = diagnostic.diagnose(a, pdf, 1, root / "same", b)
            self.assertNotIn("independentImage", same)
            changed = diagnostic.diagnose(a, pdf, 1, root / "changed", c)
            self.assertTrue(Path(changed["independentImage"]["path"]).exists())
            self.assertFalse(changed["accepted"])
            self.assertEqual(len(list((root / "changed").glob("*.png"))), 1)
            self.assertEqual(diagnostic.digest(pdf), original)
            with self.assertRaises(ValueError):
                diagnostic.diagnose(a, pdf, 2, root / "invalid")
            with self.assertRaises(ValueError):
                diagnostic.diagnose(a, pdf, 1, root / "same")


if __name__ == "__main__":
    unittest.main()

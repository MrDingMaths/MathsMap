"""Read-only preview diagnosis. At most one independent PDF page rasterization.

Requires Pillow and PyMuPDF, already used by local PDF review. This never marks
pages accepted or rewrites PDFs, source images, manifests or inspection records.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path


def digest(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def load_pdf_engine():
    try:
        import pymupdf
    except ModuleNotFoundError:
        # Local review installations are kept out of Git under the storage policy.
        local = Path(".booklet-work/python").resolve()
        if local.is_dir():
            sys.path.insert(0, str(local))
        import pymupdf
    return pymupdf


def compare_images(first, second):
    from PIL import Image, ImageChops
    if digest(first) == digest(second):
        return {"sameBytes": True, "samePixels": True}
    with Image.open(first) as a, Image.open(second) as b:
        a, b = a.convert("RGBA"), b.convert("RGBA")
        same = a.size == b.size and all(
            channel.getbbox() is None
            for channel in ImageChops.difference(a, b).split()
        )
        return {"sameBytes": False, "samePixels": same,
                "firstSize": list(a.size), "secondSize": list(b.size)}


def diagnose(first, pdf, page, out, second=None):
    fitz = load_pdf_engine()
    out = Path(out).resolve()
    root = Path(".booklet-work").resolve()
    if root not in out.parents:
        raise ValueError("Output must be a fresh directory inside .booklet-work")
    if out.exists():
        raise ValueError("Output already exists; choose a fresh directory")
    with fitz.open(pdf) as document:
        if page < 1 or page > len(document):
            raise ValueError("PDF page is out of range (use one-based numbering)")
        result = {"pdf": {"path": str(Path(pdf).resolve()), "hash": digest(pdf)},
                  "page": page, "first": {"path": str(Path(first).resolve()), "hash": digest(first)}}
        comparison = compare_images(first, second) if second else None
        result["comparison"] = comparison
        if second:
            result["second"] = {"path": str(Path(second).resolve()), "hash": digest(second)}
        out.mkdir(parents=True)
        if comparison and comparison["samePixels"]:
            result["action"] = "Existing previews have identical pixels; no additional rasterization."
        else:
            image = out / f"page-{page}-mupdf.png"
            document[page - 1].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False).save(image)
            result["independentImage"] = {"path": str(image), "hash": digest(image), "engine": "PyMuPDF", "scale": 2}
            result["action"] = "Inspect this page against the existing preview and source; no full export was run."
    result["accepted"] = False
    result["note"] = "Pixel equality does not prove PDF/source fidelity or diagnose the display mechanism. Use a different engine if the suspect preview was already produced by PyMuPDF. Actual visual review is still required."
    (out / "diagnosis.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("first", "pdf", "out"):
        parser.add_argument("--" + name, required=True)
    parser.add_argument("--second")
    parser.add_argument("--page", required=True, type=int)
    print(json.dumps(diagnose(**vars(parser.parse_args())), indent=2))

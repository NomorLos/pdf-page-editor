from __future__ import annotations

import copy
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from pypdf import PdfReader, PdfWriter


@dataclass(frozen=True)
class PdfDocument:
    id: str
    path: Path
    name: str
    pages: int
    encrypted: bool


class PdfLibrary:
    def __init__(self) -> None:
        self._docs: dict[str, PdfDocument] = {}

    def add_paths(self, paths: Iterable[str | Path]) -> list[PdfDocument]:
        docs: list[PdfDocument] = []
        for raw_path in paths:
            path = Path(raw_path)
            reader = _reader_for(path)
            doc = PdfDocument(
                id=uuid.uuid4().hex,
                path=path,
                name=path.name,
                pages=len(reader.pages),
                encrypted=reader.is_encrypted,
            )
            self._docs[doc.id] = doc
            docs.append(doc)
        return docs

    def get(self, doc_id: str) -> PdfDocument:
        return self._docs[doc_id]

    def replace_path(self, doc_id: str, path: str | Path, name: str | None = None) -> PdfDocument:
        old_doc = self._docs[doc_id]
        new_path = Path(path)
        reader = _reader_for(new_path)
        doc = PdfDocument(
            id=doc_id,
            path=new_path,
            name=name or new_path.name,
            pages=len(reader.pages),
            encrypted=reader.is_encrypted,
        )
        self._docs[old_doc.id] = doc
        return doc

    def all(self) -> list[PdfDocument]:
        return list(self._docs.values())


def describe_doc(doc: PdfDocument) -> dict:
    return {
        "id": doc.id,
        "name": doc.name,
        "path": str(doc.path),
        "pages": doc.pages,
        "encrypted": doc.encrypted,
    }


def export_pages(library: PdfLibrary, page_items: list[dict], output_path: str | Path) -> dict:
    if not page_items:
        raise ValueError("没有可导出的页面。")

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    writer = PdfWriter()
    readers: dict[str, PdfReader] = {}

    for item in page_items:
        doc_id = str(item["fileId"])
        page_index = int(item["pageIndex"])
        rotation = int(item.get("rotation", 0)) % 360
        doc = library.get(doc_id)
        reader = readers.get(doc_id)
        if reader is None:
            reader = _reader_for(doc.path)
            readers[doc_id] = reader
        if page_index < 0 or page_index >= len(reader.pages):
            raise ValueError(f"{doc.name} 的页码超出范围：{page_index + 1}")
        page = copy.copy(reader.pages[page_index])
        if rotation:
            page.rotate(rotation)
        writer.add_page(page)

    with output.open("wb") as fh:
        writer.write(fh)

    check = _reader_for(output)
    return {
        "path": str(output),
        "pages": len(check.pages),
        "pageBoxes": [_box_summary(check.pages[0])] if len(check.pages) else [],
    }


def split_ranges(library: PdfLibrary, ranges: list[dict], output_dir: str | Path) -> list[dict]:
    if not ranges:
        raise ValueError("没有拆分范围。")
    target_dir = Path(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []

    for entry in ranges:
        doc = library.get(str(entry["fileId"]))
        start = int(entry["start"])
        end = int(entry["end"])
        if start < 1 or end < start:
            raise ValueError(f"拆分范围不正确：{start}-{end}")
        reader = _reader_for(doc.path)
        if end > len(reader.pages):
            raise ValueError(f"{doc.name} 只有 {len(reader.pages)} 页，不能拆到第 {end} 页。")
        writer = PdfWriter()
        for idx in range(start - 1, end):
            writer.add_page(reader.pages[idx])
        stem = Path(doc.name).stem
        safe_name = f"{stem}_{start}-{end}.pdf"
        output = _unique_path(target_dir / safe_name)
        with output.open("wb") as fh:
            writer.write(fh)
        check = _reader_for(output)
        results.append({"path": str(output), "pages": len(check.pages), "range": f"{start}-{end}"})

    return results


def _reader_for(path: Path) -> PdfReader:
    reader = PdfReader(str(path))
    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise ValueError(f"文件已加密且无法自动打开：{path.name}") from exc
    return reader


def _box_summary(page) -> dict:
    box = page.mediabox
    return {
        "width": float(box.width),
        "height": float(box.height),
    }


def _unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    for index in range(2, 1000):
        candidate = path.with_name(f"{stem}_{index}{suffix}")
        if not candidate.exists():
            return candidate
    raise ValueError(f"无法生成不重名文件：{path}")

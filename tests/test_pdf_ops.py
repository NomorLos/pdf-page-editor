from pathlib import Path

from pypdf import PdfWriter

from pdf_ops import PdfLibrary, export_pages, split_ranges


def make_pdf(path: Path, pages: int) -> None:
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=595, height=842)
    with path.open("wb") as fh:
        writer.write(fh)


def test_export_and_split_with_chinese_paths(tmp_path):
    source_dir = tmp_path / "中文 路径"
    source_dir.mkdir()
    first = source_dir / "甲 文件.pdf"
    second = source_dir / "乙 文件.pdf"
    make_pdf(first, 3)
    make_pdf(second, 2)

    library = PdfLibrary()
    docs = library.add_paths([first, second])
    output = source_dir / "合并 输出.pdf"
    result = export_pages(
        library,
        [
            {"fileId": docs[0].id, "pageIndex": 2, "rotation": 90},
            {"fileId": docs[1].id, "pageIndex": 0, "rotation": 0},
            {"fileId": docs[0].id, "pageIndex": 0, "rotation": 0},
        ],
        output,
    )

    assert output.exists()
    assert result["pages"] == 3

    split_dir = source_dir / "拆分结果"
    split = split_ranges(library, [{"fileId": docs[0].id, "start": 1, "end": 2}], split_dir)
    assert len(split) == 1
    assert Path(split[0]["path"]).exists()
    assert split[0]["pages"] == 2


def test_replace_path_keeps_document_id_and_refreshes_page_count(tmp_path):
    source_dir = tmp_path / "中文 刷新"
    source_dir.mkdir(parents=True)
    first = source_dir / "原始.pdf"
    second = source_dir / "刷新后.pdf"
    make_pdf(first, 4)
    make_pdf(second, 2)

    library = PdfLibrary()
    doc = library.add_paths([first])[0]
    refreshed = library.replace_path(doc.id, second)

    assert refreshed.id == doc.id
    assert refreshed.path == second
    assert refreshed.pages == 2
    assert library.get(doc.id).path == second

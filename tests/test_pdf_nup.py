from pathlib import Path

from pypdf import PdfReader, PdfWriter

from pdf_nup import A4_HEIGHT, A4_WIDTH, make_nup_pdf


def make_source_pdf(path: Path, pages: int) -> None:
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=960, height=540)
    with path.open("wb") as fh:
        writer.write(fh)


def test_make_nup_pdf_outputs_a4_portrait_and_expected_page_counts(tmp_path):
    tmp_path.mkdir(parents=True, exist_ok=True)
    source = tmp_path / "演示文稿.pdf"
    make_source_pdf(source, 9)

    expected = {2: 5, 4: 3, 6: 2, 8: 2}
    for nup, pages in expected.items():
        output = tmp_path / f"{nup}合1.pdf"
        result = make_nup_pdf(source, output, nup)
        reader = PdfReader(str(output))

        assert result["pages"] == pages
        assert len(reader.pages) == pages
        first = reader.pages[0]
        assert round(float(first.mediabox.width), 1) == round(A4_WIDTH, 1)
        assert round(float(first.mediabox.height), 1) == round(A4_HEIGHT, 1)

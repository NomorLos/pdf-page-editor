from __future__ import annotations

import math
from pathlib import Path

from pypdf import PdfReader, PdfWriter, Transformation
from pypdf._page import PageObject


A4_WIDTH = 595.2756
A4_HEIGHT = 841.8898
NUP_GRIDS = {
    2: (1, 2),
    4: (2, 2),
    6: (2, 3),
    8: (2, 4),
}


def make_nup_pdf(source: str | Path, output: str | Path, per_page: int) -> dict:
    if per_page not in NUP_GRIDS:
        raise ValueError("PPT 多页合一只支持 2、4、6、8。")

    src = Path(source).resolve()
    dst = Path(output).resolve()
    reader = PdfReader(str(src))
    writer = PdfWriter()
    cols, rows = NUP_GRIDS[per_page]
    cell_w = A4_WIDTH / cols
    cell_h = A4_HEIGHT / rows
    total_pages = len(reader.pages)

    for start in range(0, total_pages, per_page):
        out_page = PageObject.create_blank_page(width=A4_WIDTH, height=A4_HEIGHT)
        for slot, page_index in enumerate(range(start, min(start + per_page, total_pages))):
            src_page = reader.pages[page_index]
            src_w = float(src_page.mediabox.width)
            src_h = float(src_page.mediabox.height)
            scale = min(cell_w / src_w, cell_h / src_h)
            drawn_w = src_w * scale
            drawn_h = src_h * scale
            col = slot % cols
            row = slot // cols
            x = col * cell_w + (cell_w - drawn_w) / 2
            y = A4_HEIGHT - (row + 1) * cell_h + (cell_h - drawn_h) / 2
            transform = Transformation().scale(scale).translate(x, y)
            out_page.merge_transformed_page(src_page, transform)
        writer.add_page(out_page)

    dst.parent.mkdir(parents=True, exist_ok=True)
    with dst.open("wb") as fh:
        writer.write(fh)

    return {
        "source": str(src),
        "path": str(dst),
        "name": dst.name,
        "nup": per_page,
        "pages": math.ceil(total_pages / per_page) if total_pages else 0,
        "sourcePages": total_pages,
    }

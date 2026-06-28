from __future__ import annotations

import tempfile
from pathlib import Path

from tests.test_office_convert import test_unique_pdf_path_uses_source_stem_and_avoids_overwrite
from tests.test_pdf_nup import test_make_nup_pdf_outputs_a4_portrait_and_expected_page_counts
from tests.test_pdf_ops import test_export_and_split_with_chinese_paths, test_replace_path_keeps_document_id_and_refreshes_page_count


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="pdf工具_") as tmp:
        root = Path(tmp)
        test_export_and_split_with_chinese_paths(root)
        test_replace_path_keeps_document_id_and_refreshes_page_count(root / "refresh")
        test_unique_pdf_path_uses_source_stem_and_avoids_overwrite(root / "office")
        test_make_nup_pdf_outputs_a4_portrait_and_expected_page_counts(root / "nup")
    print("SELF_CHECK_OK")


if __name__ == "__main__":
    main()

"""Full hybrid stack (regex + trained NER). Skipped if torch/transformers missing."""
from __future__ import annotations

import pytest

pytest.importorskip("torch")
pytest.importorskip("transformers")

from phi_detector import detect  # noqa: E402


@pytest.mark.ml
def test_hybrid_detect_includes_regex_and_runs_ml():
    """USE_ML=1: must not crash; SSN still caught by regex."""
    t = "Record for Jane Doe. SSN 123-45-6789."
    spans = detect(t)
    assert isinstance(spans, list)
    assert any(s.get("category") == "SSN" for s in spans)

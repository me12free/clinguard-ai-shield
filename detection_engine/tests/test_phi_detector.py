"""Edge-case tests for phi_detector.detect (regex path; USE_ML=0 via conftest)."""
from __future__ import annotations

import pytest

from phi_detector import detect


def test_detect_empty_string():
    assert detect("") == []


def test_detect_whitespace_only():
    assert detect("   \n\t  ") == []


def test_detect_ssn_regex():
    spans = detect("Patient SSN 123-45-6789 verified.")
    cats = {s["category"] for s in spans}
    assert "SSN" in cats
    assert any("123-45-6789" in s.get("text", "") for s in spans)


def test_detect_email_phone():
    t = "Call 555-123-4567 or email a@b.co for follow-up."
    spans = detect(t)
    cats = {s["category"] for s in spans}
    assert "EMAIL" in cats
    assert "PHONE" in cats


def test_detect_date_patterns():
    spans = detect("DOB 1990-01-15 and visit Jan 5, 2024.")
    assert any(s["category"] == "DATE" for s in spans)


def test_detect_unicode_safe_no_crash():
    spans = detect("患者 Patient 田中 123-45-6789 mixed.")
    assert isinstance(spans, list)
    assert any(s["category"] == "SSN" for s in spans)


def test_detect_very_long_text_no_crash():
    chunk = "The patient is stable. " * 200
    spans = detect(chunk + " SSN 123-45-6789.")
    assert isinstance(spans, list)
    assert any("SSN" in s.get("category", "") or "123-45-6789" in s.get("text", "") for s in spans)


def test_detect_mrn_pattern():
    spans = detect("MRN: 1234567 admission.")
    assert any(s["category"] == "MRN" for s in spans)


def test_detect_returns_sorted_mergeable_spans():
    spans = detect("a@b.co 123-45-6789")
    for s in spans:
        assert "start" in s and "end" in s and s["end"] > s["start"]
        assert "category" in s

"""
Generate synthetic PHI-labeled data for ClinGuard training.
Output: detection_engine/data/raw/synthetic_phi.jsonl
Schema: {"text": "...", "spans": [{"start", "end", "category"}, ...]}
Categories aligned with Chapter 4 and phi_detector: NAME, MRN, DATE, EMAIL, PHONE, SSN, ID_NUMBER, KENYA_NATIONAL_ID.
Includes Kenya-aligned patterns (8-digit national ID, Kenyan names).
Usage (from detection_engine/ or project root):
  python scripts/generate_synthetic_phi.py [--count 2000]
  PHI_SYNTHETIC_COUNT=500 python scripts/generate_synthetic_phi.py
"""
import argparse
import json
import random
from pathlib import Path

# Project root: script lives in detection_engine/scripts/
SCRIPT_DIR = Path(__file__).resolve().parent
DETECTION_ENGINE_ROOT = SCRIPT_DIR.parent
DEFAULT_RAW_DIR = DETECTION_ENGINE_ROOT / "data" / "raw"
DEFAULT_OUTPUT = DEFAULT_RAW_DIR / "synthetic_phi.jsonl"

# Kenya-aligned and generic name components (synthetic only; no real data)
KENYA_FIRST_NAMES = [
    "Akinyi", "Omondi", "Wanjiku", "Kipchoge", "Njeri", "Otieno", "Achieng", "Kamau",
    "Mwangi", "Wambui", "Korir", "Nyambura", "Odhiambo", "Atieno", "Kiplagat",
    "John", "Mary", "Peter", "Grace", "James", "Elizabeth", "Joseph", "Anne",
]
KENYA_LAST_NAMES = [
    "Ochieng", "Njoroge", "Mutua", "Kariuki", "Omondi", "Wambua", "Kipchumba",
    "Otieno", "Mwangi", "Kamau", "Odhiambo", "Korir", "Maina", "Kiplagat", "Koech",
]

# Clinical sentence templates with placeholders; (placeholder, category)
TEMPLATES = [
    ("Patient {name} MRN {mrn} presented with fever and cough.", ["NAME", "MRN"]),
    ("Contact: {email} or {phone} for follow-up.", ["EMAIL", "PHONE"]),
    ("DOB {date}. SSN {ssn}. Next of kin: {name}.", ["DATE", "SSN", "NAME"]),
    ("Lab results for {name} on {date}. MRN: {mrn}.", ["NAME", "DATE", "MRN"]),
    ("Prescribed amoxicillin for {name}. Phone {phone}.", ["NAME", "PHONE"]),
    ("National ID {kenya_id}. Patient {name} admitted on {date}.", ["KENYA_NATIONAL_ID", "NAME", "DATE"]),
    ("Referral: {name}, DOB {date}, ID {mrn}. Contact {email}.", ["NAME", "DATE", "MRN", "EMAIL"]),
    ("{name} (MRN {mrn}) seen on {date}. Follow-up {phone}.", ["NAME", "MRN", "DATE", "PHONE"]),
    ("Emergency contact {name} at {phone}. Patient ID {mrn}.", ["NAME", "PHONE", "MRN"]),
    ("Discharge summary: {name}, {date}. SSN {ssn}.", ["NAME", "DATE", "SSN"]),
    ("Kenya national ID {kenya_id} for {name}. Admitted {date}.", ["KENYA_NATIONAL_ID", "NAME", "DATE"]),
    ("Blood type on file for {name}. MRN {mrn}. DOB {date}.", ["NAME", "MRN", "DATE"]),
    ("Allergy list for {name}. Contact {email}. MRN {mrn}.", ["NAME", "EMAIL", "MRN"]),
    ("{name} - next appointment {date}. Phone {phone}.", ["NAME", "DATE", "PHONE"]),
    ("Patient {name} (ID {kenya_id}) transferred. Date {date}.", ["NAME", "KENYA_NATIONAL_ID", "DATE"]),
]


def _generate_kenya_id() -> str:
    """8-digit Kenya national ID format (synthetic)."""
    return "".join(str(random.randint(0, 9)) for _ in range(8))


def _generate_mrn() -> str:
    return str(random.randint(100000, 999999999))


def _generate_ssn() -> str:
    return f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"


def _generate_date() -> str:
    styles = [
        f"{random.randint(1, 12):02d}/{random.randint(1, 28):02d}/{random.randint(1980, 2010)}",
        f"{random.randint(1980, 2010)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
    ]
    return random.choice(styles)


def _generate_phone() -> str:
    styles = [
        f"{random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
        f"+254{random.randint(700000000, 799999999)}",
        f"0{random.randint(700000000, 799999999)}",
    ]
    return random.choice(styles)


def _generate_email(name: str) -> str:
    local = name.replace(" ", ".").lower() + str(random.randint(1, 99))
    domains = ["hospital.ke", "clinic.co.ke", "health.go.ke", "example.org"]
    return f"{local}@{random.choice(domains)}"


def _generate_name() -> str:
    if random.random() < 0.6:
        return f"{random.choice(KENYA_FIRST_NAMES)} {random.choice(KENYA_LAST_NAMES)}"
    return f"{random.choice(KENYA_FIRST_NAMES)} {random.choice(KENYA_LAST_NAMES)}"


def _fill_template(template: str, placeholders: dict) -> tuple[str, list[dict]]:
    """Return (filled_text, list of spans {start, end, category}). Replace right-to-left so span indices stay valid."""
    text = template
    items = []
    for key, value in placeholders.items():
        placeholder = "{" + key + "}"
        if placeholder not in text:
            continue
        start = text.index(placeholder)
        items.append((start, key, value))
    items.sort(key=lambda x: -x[0])  # descending start: replace right-to-left
    spans = []
    for start, key, value in items:
        placeholder = "{" + key + "}"
        end = start + len(value)
        text = text[:start] + value + text[start + len(placeholder) :]
        category = {
            "name": "NAME",
            "mrn": "MRN",
            "date": "DATE",
            "email": "EMAIL",
            "phone": "PHONE",
            "ssn": "SSN",
            "kenya_id": "KENYA_NATIONAL_ID",
        }.get(key, "PHI")
        spans.append({"start": start, "end": end, "category": category})
    spans.sort(key=lambda s: s["start"])
    return text, spans


def generate_one() -> dict:
    """Generate one synthetic example."""
    template_str, categories = random.choice(TEMPLATES)
    name = _generate_name()
    placeholders = {}
    if "name" in template_str:
        placeholders["name"] = name
    if "mrn" in template_str:
        placeholders["mrn"] = _generate_mrn()
    if "date" in template_str:
        placeholders["date"] = _generate_date()
    if "email" in template_str:
        placeholders["email"] = _generate_email(name)
    if "phone" in template_str:
        placeholders["phone"] = _generate_phone()
    if "ssn" in template_str:
        placeholders["ssn"] = _generate_ssn()
    if "kenya_id" in template_str:
        placeholders["kenya_id"] = _generate_kenya_id()
    text, spans = _fill_template(template_str, placeholders)
    return {"text": text, "spans": spans}


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic PHI data for ClinGuard")
    parser.add_argument("--count", type=int, default=None, help="Number of examples (default: env PHI_SYNTHETIC_COUNT or 2000)")
    parser.add_argument("--output", type=Path, default=None, help="Output path (default: data/raw/synthetic_phi.jsonl)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()
    count = args.count or int(__import__("os").environ.get("PHI_SYNTHETIC_COUNT", "2000"))
    output = args.output or DEFAULT_OUTPUT
    random.seed(args.seed)

    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        for _ in range(count):
            record = generate_one()
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(f"Wrote {count} synthetic PHI examples to {output}")


if __name__ == "__main__":
    main()

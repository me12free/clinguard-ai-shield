# Generate Diagrams and Schema on Any Platform

Ways to view and export the ClinGuard diagrams and **Logical Schema** on **Windows, macOS, or Linux** (browser, editor, or command line).

---

## 1. Logical Schema (no generation needed)

The schema is **Markdown tables** in:

- **`Logical Schema.md`** or **`LOGICAL_SCHEMA.md`**

**On any platform:**

- **Preview:** Open the file in VS Code / Cursor and use **Markdown: Open Preview** (e.g. `Ctrl+Shift+V` / `Cmd+Shift+V`), or any Markdown viewer.
- **Export to PDF/print:** Use the same preview and print to PDF, or open in a Markdown-to-PDF tool (e.g. Pandoc, or “Print” from the preview).
- **Copy into Word/Google Docs:** Select the tables and paste; formatting is preserved in most editors.

No extra software is required; any system that can open `.md` files can show the schema.

---

## 2. Use Case Diagram (PlantUML → PNG/SVG)

**Source file:** `Use Case Diagram.puml` or `use-case.puml`

### Option A: Browser (any OS)

1. Open **[https://www.plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml)**.
2. Copy the **entire contents** of `Use Case Diagram.puml` and paste into the left panel.
3. The diagram appears on the right. Use the page’s **PNG** or **SVG** link/button to download.

No install; works on any device with a browser.

### Option B: VS Code / Cursor (any OS)

1. Install the **PlantUML** extension (e.g. “PlantUML” by jebbs).
2. Open `Use Case Diagram.puml`.
3. Use the command **“PlantUML: Export Current Diagram”** (or right‑click → Export) and choose PNG or SVG.

### Option C: Command line (any OS)

**Prereq:** Java installed (PlantUML is a JAR).

1. Download `plantuml.jar` from [plantuml.com/download](https://plantuml.com/download).
2. In a terminal, go to the `docs/Diagrams` folder and run:

   **Windows (PowerShell or CMD):**
   ```bash
   java -jar path\to\plantuml.jar "Use Case Diagram.puml" -tpng
   ```

   **macOS / Linux:**
   ```bash
   java -jar /path/to/plantuml.jar "Use Case Diagram.puml" -tpng
   ```

   Replace `path\to\plantuml.jar` (or `/path/to/plantuml.jar`) with the real path. Use `-tsvg` for SVG.

---

## 3. Mermaid diagrams (ERD, Sequence, System Sequence, Activity, Class)

**Source files:** `ERD Diagram.mmd`, `Sequence Diagram.mmd`, `System Sequence Diagram.mmd`, `Activity Diagram.mmd`, `Class Diagram.mmd`

### Option A: Browser (any OS)

1. Open **[https://mermaid.live](https://mermaid.live)**.
2. Copy the **entire contents** of the `.mmd` file (including the `erDiagram` / `sequenceDiagram` / `flowchart` / `classDiagram` block).
3. Paste into the left panel. The diagram renders on the right.
4. Use **“Actions” → “Export”** (or similar) to download PNG or SVG.

Works on any platform with a browser; no install.

### Option B: VS Code / Cursor (any OS)

1. Install a **Mermaid** extension (e.g. “Mermaid” or “Markdown Preview Mermaid Support”).
2. Either:
   - Open the `.mmd` file and use the extension’s preview/export, or  
   - Open **`DIAGRAMS_PREVIEW.md`** and use **Markdown: Open Preview** (Ctrl+Shift+V / Cmd+Shift+V) to see all Mermaid diagrams in one place.
3. Use the extension’s export option if it offers PNG/SVG.

### Option C: Command line (Node.js on any OS)

**Prereq:** [Node.js](https://nodejs.org) installed (same on Windows, macOS, Linux).

1. From the **project root** (or any folder where you want to run the tool):
   ```bash
   npx -y @mermaid-js/mermaid-cli -i "docs/Diagrams/ERD Diagram.mmd" -o "docs/Diagrams/ERD Diagram.png"
   ```
2. Repeat for other `.mmd` files, e.g.:
   ```bash
   npx -y @mermaid-js/mermaid-cli -i "docs/Diagrams/Sequence Diagram.mmd" -o "docs/Diagrams/Sequence Diagram.png"
   npx -y @mermaid-js/mermaid-cli -i "docs/Diagrams/Activity Diagram.mmd" -o "docs/Diagrams/Activity Diagram.png"
   npx -y @mermaid-js/mermaid-cli -i "docs/Diagrams/Class Diagram.mmd" -o "docs/Diagrams/Class Diagram.png"
   ```

Paths work the same on Windows (PowerShell/CMD), macOS, and Linux. Use `-e png` or `-e svg` if your CLI version uses `-e` for format.

---

## 4. One-page preview of all diagrams

- Open **`DIAGRAMS_PREVIEW.md`** in VS Code/Cursor and use **Markdown: Open Preview**.
- With a Mermaid-supported preview, you see all Mermaid diagrams in one place. The Use Case is shown as PlantUML code; render that separately via [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml) or the PlantUML extension.

---

## 5. Quick reference

| What            | Easiest (any platform)     | Export to PNG/SVG              |
|-----------------|----------------------------|---------------------------------|
| Logical Schema  | Open `Logical Schema.md`   | Preview → Print to PDF / copy  |
| Use Case        | [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml) | Use site’s PNG/SVG export      |
| ERD, Sequence, Activity, Class | [mermaid.live](https://mermaid.live) or `DIAGRAMS_PREVIEW.md` | Mermaid Live or extension export |

All of these work on **Windows, macOS, and Linux**; the only variable is whether you use browser, editor, or CLI.

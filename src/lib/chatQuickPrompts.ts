/**
 * Quick prompts for Clinical AI and PHI scan.
 * Three real clinical questions with demo identifiers so you can test redaction + RAG together.
 * Align topics with detection_engine/rag_engine.py DEFAULT_DOCS (hypertension, diabetes, anticoag/NSAID).
 */

export type BuiltinPromptItem = {
  id: string;
  /** Short chip label */
  label: string;
  fullText: string;
};

/** Ambulatory HTN follow-up: should retrieve hypertension / BP target snippets after redaction. */
const PROMPT_HTN: BuiltinPromptItem = {
  id: "clinical-htn-followup",
  label: "BP follow-up (office)",
  fullText: `Office follow-up for Alex Rivera, MRN 7722011, DOB 03/08/1968. Home BP log shows 148-155 systolic on lisinopril 10 mg daily; no edema or orthostasis today.

In 4-6 sentences, summarize guideline-consistent next steps for BP management and when to add or titrate medication for this ambulatory adult. Mention typical BP targets and first-line classes we discuss in primary care.`,
};

/** T2DM intensification: should retrieve diabetes / metformin / SGLT2 / GLP-1 snippets. */
const PROMPT_DM: BuiltinPromptItem = {
  id: "clinical-dm-a1c",
  label: "Type 2 diabetes (A1c above goal)",
  fullText: `Case discussion: Sam Patel, MRN 9081122, age 58, type 2 diabetes. A1c 8.1% on metformin 1000 mg BID; eGFR stable, no hypoglycemia.

Briefly outline evidence-informed add-on options with focus on cardiovascular and renal benefit classes (not patient-specific prescribing). Use bullet points suitable for an internal teaching note.`,
};

/** Anticoag + NSAID: should retrieve bleeding / NSAID / anticoagulant interaction snippets. */
const PROMPT_AC_NS: BuiltinPromptItem = {
  id: "clinical-ac-nsaid",
  label: "Anticoagulant + NSAID question",
  fullText: `Patient Denise Moore, MRN 4450091, on apixaban 5 mg BID for atrial fibrillation. She wants ibuprofen 400 mg for knee pain after weekend gardening.

Summarize bleeding risk considerations and safer alternatives to oral NSAIDs I can document in the visit note. Keep it concise for the medical record.`,
};

export const CLINICAL_AI_PHI_QUICK_PROMPTS: BuiltinPromptItem[] = [PROMPT_HTN, PROMPT_DM, PROMPT_AC_NS];

/** Same three for PHI scan (load text, then Run scan). */
export const PHI_SCAN_QUICK_PROMPTS: BuiltinPromptItem[] = CLINICAL_AI_PHI_QUICK_PROMPTS;

export type CustomQuickPrompt = {
  id: string;
  label: string;
  text: string;
};

const STORAGE_KEY = "clinguard_custom_quick_prompts_v1";
const MAX_CUSTOM = 40;

export function loadCustomQuickPrompts(): CustomQuickPrompt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is CustomQuickPrompt =>
          x != null &&
          typeof x === "object" &&
          typeof (x as CustomQuickPrompt).id === "string" &&
          typeof (x as CustomQuickPrompt).label === "string" &&
          typeof (x as CustomQuickPrompt).text === "string"
      )
      .slice(0, MAX_CUSTOM);
  } catch {
    return [];
  }
}

export function saveCustomQuickPrompts(prompts: CustomQuickPrompt[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts.slice(0, MAX_CUSTOM)));
  } catch {
    /* ignore quota */
  }
}

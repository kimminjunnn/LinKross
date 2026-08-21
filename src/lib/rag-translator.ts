import glossaryData from "@/data/rag-glossary.json";

export type MilestoneInput = {
  id: string;
  code: string;
  title: string;
  period: string;
  amount: string;
  dods: string[];
  verificationDesigns?: import("@/lib/backend/contracts").DodVerificationDesign[];
};

export type EnglishSOWResult = {
  version: string;
  header: { projectName: string; client: string; vendor: string; effectiveDate: string };
  overview: { background: string; objective: string };
  scopeOfWork: { inScope: string[]; outOfScope: string[] };
  timelineAndMilestones: Array<{ code: string; titleEn: string; period: string; amount: string; dodsEn: string[] }>;
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  rolesAndResponsibilities: { client: string; vendor: string };
  retrievedTerms: Array<{ kr: string; en: string }>;
  unmappedContent: string[];
};

const GLOSSARY = glossaryData.map((item) => ({ pattern: new RegExp(item.pattern, "i"), english: item.english }));

export function retrieveGlossaryTerms(text: string): Array<{ kr: string; en: string }> {
  const unique = new Map<string, { kr: string; en: string }>();
  for (const item of GLOSSARY) {
    const match = text.match(item.pattern);
    if (match && !unique.has(item.english)) unique.set(item.english, { kr: match[0], en: item.english });
  }
  return [...unique.values()];
}

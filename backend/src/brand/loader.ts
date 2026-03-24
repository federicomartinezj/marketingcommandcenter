import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type BusinessLine = "OPL" | "AAS" | "MH" | "Volta";

const BRAND_DIR = join(__dirname, "../../brand-knowledge");

const LINE_FILE_MAP: Record<BusinessLine, string> = {
  OPL: "opl-guidelines",
  AAS: "aas-guidelines",
  MH: "multihousing-guidelines",
  Volta: "volta-guidelines",
};

export async function loadBrandKnowledge(name: string): Promise<string> {
  const filePath = join(BRAND_DIR, `${name}.md`);
  return readFile(filePath, "utf-8");
}

export async function loadLineGuidelines(line: BusinessLine): Promise<string> {
  const fileName = LINE_FILE_MAP[line];
  return loadBrandKnowledge(fileName);
}

export async function loadAllBrandContext(line: BusinessLine): Promise<string> {
  const [core, lineGuide, tone, values] = await Promise.all([
    loadBrandKnowledge("brand-core"),
    loadLineGuidelines(line),
    loadBrandKnowledge("tone-examples"),
    loadBrandKnowledge("values"),
  ]);
  return [core, lineGuide, tone, values].join("\n\n---\n\n");
}

import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type BusinessLine = "OPL" | "AAS" | "MH" | "Volta";
type AgentRole = "orchestrator" | "copywriter" | "designer" | "ux-strategist" | "business-analyst" | "seo-specialist" | "social-media-manager" | "brand-guardian" | "data-analyst" | "competitive-intel";

const BRAND_DIR = join(__dirname, "../../brand-knowledge");

const LINE_FILE_MAP: Record<BusinessLine, string> = {
  OPL: "opl-guidelines",
  AAS: "aas-guidelines",
  MH: "multihousing-guidelines",
  Volta: "volta-guidelines",
};

// Cache: file contents never change at runtime
const fileCache = new Map<string, string>();

async function loadFile(name: string): Promise<string> {
  if (fileCache.has(name)) return fileCache.get(name)!;
  const content = await readFile(join(BRAND_DIR, `${name}.md`), "utf-8");
  fileCache.set(name, content);
  return content;
}

// Which brand files each agent role actually needs
const ROLE_CONTEXT: Record<AgentRole, string[]> = {
  designer:              ["brand-core", "LINE"],                           // visual rules are in system prompt already
  copywriter:            ["brand-core", "LINE", "tone-examples", "values"],
  "social-media-manager": ["brand-core", "LINE", "tone-examples"],
  "seo-specialist":      ["brand-core", "LINE"],                           // only needs keywords/domain context
  "brand-guardian":      ["brand-core", "LINE", "values"],
  "ux-strategist":       ["brand-core", "LINE", "values"],
  orchestrator:          ["brand-core", "LINE", "tone-examples", "values"],
  "business-analyst":    ["brand-core", "LINE"],
  "data-analyst":        ["brand-core"],                                   // just needs company context
  "competitive-intel":   ["brand-core", "LINE"],
};

export async function loadBrandKnowledge(name: string): Promise<string> {
  return loadFile(name);
}

export async function loadLineGuidelines(line: BusinessLine): Promise<string> {
  return loadFile(LINE_FILE_MAP[line]);
}

// Legacy: loads everything (used by old code paths)
export async function loadAllBrandContext(line: BusinessLine): Promise<string> {
  const [core, lineGuide, tone, values] = await Promise.all([
    loadFile("brand-core"),
    loadFile(LINE_FILE_MAP[line]),
    loadFile("tone-examples"),
    loadFile("values"),
  ]);
  return [core, lineGuide, tone, values].join("\n\n---\n\n");
}

// New: loads only what the agent role needs
export async function loadBrandContextForRole(line: BusinessLine, role: AgentRole): Promise<string> {
  const fileNames = ROLE_CONTEXT[role] || ROLE_CONTEXT.orchestrator;
  const resolved = fileNames.map((f) => f === "LINE" ? LINE_FILE_MAP[line] : f);
  const parts = await Promise.all(resolved.map(loadFile));
  return parts.join("\n\n---\n\n");
}

import archiver from "archiver";
import type { Response } from "express";
import type { Campaign } from "../../shared/types.js";

export interface ExportFile {
  path: string;
  content: string;
}

export function buildExportFiles(campaign: Campaign): ExportFile[] {
  const files: ExportFile[] = [];

  // README
  files.push({
    path: "README.md",
    content: `# ${campaign.name}\n\n**Concepto:** ${campaign.concept}\n**Línea:** ${campaign.line}\n**Audiencia:** ${campaign.audience}\n**Objetivo:** ${campaign.objective}\n\n## Embudo\n${campaign.funnel.map((f) => `- **${f.stage}**: ${f.description} (${f.channels.join(", ")})`).join("\n")}\n`,
  });

  // Channel files organized by funnel stage
  for (const channel of campaign.channels) {
    const selected = channel.variants.find((v) => v.selected) || channel.variants[0];
    if (!selected) continue;
    const dir = `${channel.funnelStage}/${channel.channel}`;
    files.push({ path: `${dir}/copy.md`, content: selected.content });
    if (channel.designHtml) {
      files.push({ path: `${dir}/asset.html`, content: channel.designHtml });
    }
    if (channel.seoOptimization) {
      const seo = channel.seoOptimization;
      files.push({
        path: `${dir}/seo-brief.md`,
        content: `# SEO Brief\n\n**Título optimizado:** ${seo.optimizedTitle}\n**Meta description:** ${seo.metaDescription}\n**Score:** ${seo.score}/100\n\n## Keywords\n${seo.keywords.map((k) => `- ${k}`).join("\n")}\n\n## Sugerencias\n${seo.suggestions.map((s) => `- ${s}`).join("\n")}\n`,
      });
    }
  }

  // Brand review consolidated
  const reviewLines = campaign.channels
    .filter((ch) => ch.brandReview)
    .map((ch) => `### ${ch.channel} (${ch.funnelStage})\n- Score: ${ch.brandReview!.score}/100\n- Approved: ${ch.brandReview!.approved ? "Yes" : "No"}\n${ch.brandReview!.checks.map((c) => `- [${c.passed ? "x" : " "}] ${c.name}: ${c.detail}`).join("\n")}`);

  files.push({ path: "brand-review.md", content: `# Brand Review\n\n${reviewLines.join("\n\n")}` });

  return files;
}

export function streamZip(campaign: Campaign, res: Response): void {
  const files = buildExportFiles(campaign);
  const slug = campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${slug}.zip"`);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);
  for (const file of files) {
    archive.append(file.content, { name: file.path });
  }
  archive.finalize();
}

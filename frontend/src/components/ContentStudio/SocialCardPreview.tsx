interface SocialCardPreviewProps {
  line: string;
  platform: string;
  title: string;
  subtitle?: string;
}

export function SocialCardPreview({ line, platform, title, subtitle }: SocialCardPreviewProps) {
  // Background and accent colors per business line
  const lineStyles: Record<string, { bg: string; accent: string; text: string }> = {
    OPL: { bg: "bg-near-black", accent: "text-electric-blue", text: "text-white" },
    AAS: { bg: "bg-near-black", accent: "text-coral", text: "text-white" },
    MH: { bg: "bg-mh-blue", accent: "text-mh-green", text: "text-white" },
    Volta: { bg: "bg-lime-green", accent: "text-near-black", text: "text-near-black" },
  };

  const style = lineStyles[line] || lineStyles.OPL;

  // Dimensions label per platform
  const platformInfo: Record<string, { label: string; aspect: string }> = {
    "linkedin-post": { label: "LinkedIn", aspect: "aspect-[1200/628]" },
    "instagram-post": { label: "Instagram", aspect: "aspect-square" },
    "social-card": { label: "Social", aspect: "aspect-[1200/628]" },
  };

  const info = platformInfo[platform] || platformInfo["linkedin-post"];

  // Truncate title if too long
  const displayTitle = title.length > 80 ? title.substring(0, 80) + "..." : title;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Vista previa — {info.label}
        </span>
      </div>

      <div className={`${style.bg} ${info.aspect} rounded-xl overflow-hidden relative flex flex-col justify-between p-8 max-w-md`}>
        {/* Top: Platform badge */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-widest ${style.accent} opacity-70`}>
            {info.label}
          </span>
          <span className={`text-xs ${style.text} opacity-50`}>
            {line}
          </span>
        </div>

        {/* Center: Content */}
        <div className="flex-1 flex flex-col justify-center py-4">
          <h3 className={`text-xl font-bold ${style.text} leading-tight mb-2`}>
            {displayTitle}
          </h3>
          {subtitle && (
            <p className={`text-sm ${style.accent} font-semibold`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Bottom: Lavanti branding */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold tracking-tight ${style.text} opacity-80`}>
            LAVANTI
          </span>
          <span className={`text-xs ${style.text} opacity-40`}>
            lavanti.com
          </span>
        </div>
      </div>
    </div>
  );
}

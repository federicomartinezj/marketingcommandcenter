interface CalendarItemProps {
  title: string;
  line: string;
  channel: string;
}

const LINE_COLORS: Record<string, string> = {
  OPL: "bg-electric-blue",
  AAS: "bg-coral",
  MH: "bg-mh-blue",
  Volta: "bg-lime-green",
};

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: "in",
  instagram: "ig",
  facebook: "fb",
  blog: "\u{1F4DD}",
  email: "\u{1F4E7}",
};

export function CalendarItemChip({ title, line, channel }: CalendarItemProps) {
  const color = LINE_COLORS[line] || "bg-gray-400";
  const icon = CHANNEL_ICONS[channel] || "\u2022";

  return (
    <div className={`${color} text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate leading-tight`} title={title}>
      <span className="opacity-70 mr-0.5">{icon}</span> {title}
    </div>
  );
}

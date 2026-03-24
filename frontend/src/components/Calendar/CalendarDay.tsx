import { CalendarItemChip } from "./CalendarItem";
import type { CalendarItem } from "../../store/calendar";

interface CalendarDayProps {
  date: number | null;
  isToday: boolean;
  items: CalendarItem[];
}

export function CalendarDay({ date, isToday, items }: CalendarDayProps) {
  if (date === null) {
    return <div className="min-h-[100px] bg-gray-50 rounded-lg" />;
  }

  return (
    <div className={`min-h-[100px] bg-white rounded-lg p-2 border ${isToday ? "border-electric-blue ring-1 ring-electric-blue" : "border-light-gray"}`}>
      <span className={`text-xs font-bold ${isToday ? "text-electric-blue" : "text-gray-500"}`}>
        {date}
      </span>
      <div className="mt-1 space-y-0.5">
        {items.slice(0, 3).map((item) => (
          <CalendarItemChip key={item.id} title={item.title} line={item.line} channel={item.channel} />
        ))}
        {items.length > 3 && (
          <span className="text-[10px] text-gray-400">+{items.length - 3} m&aacute;s</span>
        )}
      </div>
    </div>
  );
}

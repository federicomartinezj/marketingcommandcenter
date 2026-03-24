import { useEffect } from "react";
import { useCalendarStore } from "../../store/calendar";
import { CalendarDay } from "./CalendarDay";

const WEEKDAYS = ["Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b", "Dom"];

// Helper: get days in month grid (with empty cells for offset)
function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Adjust for Monday start (0=Mon, 6=Sun)
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const grid: (number | null)[] = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  // Fill remaining cells to complete the last row
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[m - 1]} ${y}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarView() {
  const { items, currentMonth, setMonth, fetchItems } = useCalendarStore();

  useEffect(() => {
    fetchItems(currentMonth);
  }, [currentMonth, fetchItems]);

  const [year, month] = currentMonth.split("-").map(Number);
  const grid = getMonthGrid(year, month - 1);
  const today = new Date();
  const todayDate = today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : -1;

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setMonth(shiftMonth(currentMonth, -1))}
          className="px-3 py-1.5 bg-near-black text-white rounded-lg text-sm hover:bg-electric-blue transition-colors">
          &larr; Anterior
        </button>
        <h2 className="text-xl font-bold text-near-black">{formatMonth(currentMonth)}</h2>
        <button onClick={() => setMonth(shiftMonth(currentMonth, 1))}
          className="px-3 py-1.5 bg-near-black text-white rounded-lg text-sm hover:bg-electric-blue transition-colors">
          Siguiente &rarr;
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((date, i) => {
          const dateStr = date ? `${currentMonth}-${String(date).padStart(2, "0")}` : "";
          const dayItems = date ? items.filter((item) => item.date === dateStr) : [];
          return (
            <CalendarDay key={i} date={date} isToday={date === todayDate} items={dayItems} />
          );
        })}
      </div>
    </div>
  );
}

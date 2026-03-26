import type { ReactNode } from "react";

export type ViewType = "dashboard" | "calendar" | "content" | "campaigns" | "intel";

interface LayoutProps {
  children: ReactNode;
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

const NAV_ITEMS: { view: ViewType; label: string }[] = [
  { view: "dashboard", label: "Dashboard" },
  { view: "calendar", label: "Calendario" },
  { view: "content", label: "Contenido" },
  { view: "campaigns", label: "Campañas" },
  { view: "intel", label: "Inteligencia" },
];

export function Layout({ children, currentView = "dashboard", onViewChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-off-white font-sans">
      <header className="bg-near-black text-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lavanti-logo.png" alt="Lavanti" className="h-8" />
            <span className="text-electric-blue font-semibold text-sm">MARKETING COMMAND CENTER</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Directora: Laura Sanín</span>
            <div className="w-8 h-8 rounded-full bg-electric-blue flex items-center justify-center text-sm font-bold">L</div>
          </div>
        </div>
        {/* Navigation Tabs */}
        {onViewChange && (
          <nav className="px-6 flex gap-1">
            {NAV_ITEMS.map(({ view, label }) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  currentView === view
                    ? "bg-off-white text-near-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

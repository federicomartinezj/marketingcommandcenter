import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-off-white font-sans">
      <header className="bg-near-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">LAVANTI</span>
          <span className="text-electric-blue font-semibold text-sm">MARKETING COMMAND CENTER</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Directora: Ana</span>
          <div className="w-8 h-8 rounded-full bg-electric-blue flex items-center justify-center text-sm font-bold">A</div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

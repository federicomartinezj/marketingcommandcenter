import { useState } from "react";
import { Layout } from "./components/Layout";
import type { ViewType } from "./components/Layout";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { CalendarView } from "./components/Calendar/CalendarView";
import { CreateContentModal } from "./components/ContentStudio/CreateContentModal";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [createContentType, setCreateContentType] = useState<string | undefined>();
  const showCreateContent = createContentType !== undefined;

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === "dashboard" && (
        <Dashboard onCreateContent={(type) => setCreateContentType(type || "blog-post")} />
      )}
      {currentView === "calendar" && <CalendarView />}
      {currentView === "content" && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-lg">Vista de contenido — pr&oacute;ximamente</p>
        </div>
      )}
      {showCreateContent && (
        <CreateContentModal initialType={createContentType} onClose={() => setCreateContentType(undefined)} />
      )}
    </Layout>
  );
}

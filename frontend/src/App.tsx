import { useState } from "react";
import { Layout } from "./components/Layout";
import type { ViewType } from "./components/Layout";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { CalendarView } from "./components/Calendar/CalendarView";
import { CreateContentModal } from "./components/ContentStudio/CreateContentModal";
import { ContentList } from "./components/ContentStudio/ContentList";

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
      {currentView === "content" && <ContentList />}
      {showCreateContent && (
        <CreateContentModal initialType={createContentType} onClose={() => setCreateContentType(undefined)} />
      )}
    </Layout>
  );
}

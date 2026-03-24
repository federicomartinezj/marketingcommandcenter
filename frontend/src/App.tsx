import { useState } from "react";
import { Layout } from "./components/Layout";
import type { ViewType } from "./components/Layout";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { CalendarView } from "./components/Calendar/CalendarView";
import { CreateContentModal } from "./components/ContentStudio/CreateContentModal";
import { ContentList } from "./components/ContentStudio/ContentList";
import { CampaignWizard } from "./components/Campaigns/CampaignWizard";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [createContentType, setCreateContentType] = useState<string | undefined>();
  const showCreateContent = createContentType !== undefined;
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === "dashboard" && (
        <Dashboard
          onCreateContent={(type) => setCreateContentType(type || "blog-post")}
          onCreateCampaign={() => setShowCampaignWizard(true)}
        />
      )}
      {currentView === "calendar" && <CalendarView />}
      {currentView === "content" && <ContentList />}
      {currentView === "campaigns" && (
        <div className="text-center py-12 text-gray-500">Lista de campañas — próximamente</div>
      )}
      {showCreateContent && (
        <CreateContentModal initialType={createContentType} onClose={() => setCreateContentType(undefined)} />
      )}
      {showCampaignWizard && <CampaignWizard onClose={() => setShowCampaignWizard(false)} />}
    </Layout>
  );
}

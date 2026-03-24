import { StatCard } from "./StatCard";
import { QuickActions } from "./QuickActions";
import { AgentPanel } from "./AgentPanel";
import { ActivityFeed } from "./ActivityFeed";
import { CampaignCards } from "./CampaignCards";

interface DashboardProps {
  onCreateContent?: (type?: string) => void;
  onCreateCampaign?: () => void;
}

export function Dashboard({ onCreateContent, onCreateCampaign }: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Campañas Activas" value={4} icon="📣" />
        <StatCard label="Contenido Este Mes" value="23/30" icon="📝" />
        <StatCard label="Pipeline Leads" value={156} icon="📈" />
        <StatCard label="Brand Score" value="94/100" icon="🛡️" />
      </div>

      {/* Campaign Cards */}
      <CampaignCards />

      {/* Quick Actions */}
      <QuickActions onCreateContent={onCreateContent} onCreateCampaign={onCreateCampaign} />

      {/* Agents */}
      <AgentPanel />

      {/* Activity */}
      <ActivityFeed />
    </div>
  );
}

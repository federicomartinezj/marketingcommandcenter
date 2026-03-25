import { DashboardStats } from "./DashboardStats";
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
      {/* Stats Row — real data from APIs */}
      <DashboardStats />

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

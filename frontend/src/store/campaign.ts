import { create } from "zustand";
import { campaignApi } from "../lib/campaign-api";
import type { Campaign } from "../lib/campaign-api";
import { useActivityStore } from "./activity";

type WizardStep = "brief" | "plan" | "generating" | "review";

interface CampaignStore {
  campaigns: Campaign[];
  current: Campaign | null;
  wizardStep: WizardStep;
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  createCampaign: (brief: string, line: string, audience: string, objective: string) => Promise<void>;
  generateContent: () => Promise<void>;
  selectVariant: (channelId: string, variantId: string) => Promise<void>;
  regenerateChannel: (channelId: string) => Promise<void>;
  approveCampaign: () => Promise<void>;
  refreshCurrent: () => Promise<void>;
  setWizardStep: (step: WizardStep) => void;
  clearCurrent: () => void;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  current: null,
  wizardStep: "brief",
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    const campaigns = await campaignApi.list();
    set({ campaigns });
  },

  createCampaign: async (brief, line, audience, objective) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    try {
      const campaign = await campaignApi.create({ brief, line, audience, objective });
      set({ current: campaign, isLoading: false });
      addActivity("working", `Nueva campaña creada para ${line}`);
      // Immediately analyze
      set({ isLoading: true });
      const analyzed = await campaignApi.analyze(campaign.id);
      set({ current: analyzed, wizardStep: "plan", isLoading: false });
      addActivity("success", `Concepto generado: "${analyzed.concept}"`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
      addActivity("error", `Error creando campaña: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  generateContent: async () => {
    const { current } = get();
    if (!current) return;
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null, wizardStep: "generating" });
    addActivity("working", `Generando contenido para ${current.channels.length} canales...`);
    try {
      const updated = await campaignApi.generate(current.id);
      set({ current: updated, wizardStep: "review", isLoading: false });
      const readyCount = updated.channels.filter((c) => c.status === "ready").length;
      addActivity("success", `${readyCount} canales generados para "${updated.concept}"`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false, wizardStep: "plan" });
      addActivity("error", `Error generando campaña: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  selectVariant: async (channelId, variantId) => {
    const { current } = get();
    if (!current) return;
    const updated = await campaignApi.selectVariant(current.id, channelId, variantId);
    set({ current: updated });
  },

  regenerateChannel: async (channelId) => {
    const { current } = get();
    if (!current) return;
    set({ isLoading: true });
    try {
      const updated = await campaignApi.regenerateChannel(current.id, channelId);
      set({ current: updated, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  approveCampaign: async () => {
    const { current } = get();
    if (!current) return;
    const addActivity = useActivityStore.getState().addActivity;
    const updated = await campaignApi.approve(current.id);
    set((state) => ({
      current: updated,
      campaigns: [updated, ...state.campaigns.filter((c) => c.id !== updated.id)],
    }));
    addActivity("success", `Campaña "${updated.name}" aprobada`);
  },

  refreshCurrent: async () => {
    const { current } = get();
    if (!current) return;
    const updated = await campaignApi.get(current.id);
    set({ current: updated });
  },

  setWizardStep: (step) => set({ wizardStep: step }),
  clearCurrent: () => set({ current: null, wizardStep: "brief", error: null }),
}));

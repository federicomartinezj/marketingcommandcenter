import { create } from "zustand";
import { intelApi } from "../lib/intel-api";
import type { IntelReport } from "../lib/intel-api";
import { useActivityStore } from "./activity";

interface IntelStore {
  reports: IntelReport[];
  isLoading: boolean;
  error: string | null;
  fetchReports: (filters?: { type?: string; line?: string; status?: string }) => Promise<void>;
  runResearch: (query: string, line?: string) => Promise<IntelReport | null>;
  runInternalAnalysis: (systemData: Record<string, unknown>) => Promise<IntelReport | null>;
  createCampaignFromOpportunity: (reportId: string, opportunityId: string) => Promise<void>;
  archiveReport: (id: string) => Promise<void>;
  runMonthly: (systemData?: Record<string, unknown>) => Promise<void>;
}

export const useIntelStore = create<IntelStore>((set, get) => ({
  reports: [],
  isLoading: false,
  error: null,

  fetchReports: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const reports = await intelApi.listReports(filters);
      set({ reports, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  runResearch: async (query, line) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    addActivity("working", `Investigando: "${query}"${line ? ` (${line})` : ""}...`);
    try {
      const report = await intelApi.research({ query, line });
      set((state) => ({
        reports: [report, ...state.reports],
        isLoading: false,
      }));
      addActivity("success", `Reporte listo: "${report.title}"`);
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, isLoading: false });
      addActivity("error", `Error en investigación: ${message}`);
      return null;
    }
  },

  runInternalAnalysis: async (systemData) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    addActivity("working", "Ejecutando análisis interno del Command Center...");
    try {
      const report = await intelApi.internalAnalysis(systemData);
      set((state) => ({
        reports: [report, ...state.reports],
        isLoading: false,
      }));
      addActivity("success", `Análisis interno listo: "${report.title}"`);
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, isLoading: false });
      addActivity("error", `Error en análisis interno: ${message}`);
      return null;
    }
  },

  createCampaignFromOpportunity: async (reportId, opportunityId) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    addActivity("working", "Creando campaña desde oportunidad detectada...");
    try {
      const result = await intelApi.createCampaign(reportId, opportunityId);
      // Update the report in store with linked campaignId
      set((state) => ({
        reports: state.reports.map((r) => (r.id === reportId ? result.report : r)),
        isLoading: false,
      }));
      addActivity("success", "Campaña creada y vinculada a la oportunidad");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, isLoading: false });
      addActivity("error", `Error creando campaña: ${message}`);
    }
  },

  archiveReport: async (id) => {
    const addActivity = useActivityStore.getState().addActivity;
    try {
      const archived = await intelApi.archiveReport(id);
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? archived : r)),
      }));
      addActivity("success", `Reporte archivado: "${archived.title}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
      addActivity("error", `Error archivando reporte: ${message}`);
    }
  },

  runMonthly: async (systemData) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    addActivity("working", "Ejecutando inteligencia mensual para todas las líneas...");
    try {
      const result = await intelApi.monthly(systemData);
      set((state) => {
        const existingIds = new Set(state.reports.map((r) => r.id));
        const newReports = result.reports.filter((r) => !existingIds.has(r.id));
        return {
          reports: [...newReports, ...state.reports],
          isLoading: false,
        };
      });
      const readyCount = result.reports.filter((r) => r.status === "ready").length;
      addActivity("success", `Inteligencia mensual lista: ${readyCount}/${result.count} reportes generados`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message, isLoading: false });
      addActivity("error", `Error en inteligencia mensual: ${message}`);
    }
  },
}));

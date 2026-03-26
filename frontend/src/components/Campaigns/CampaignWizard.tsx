import { useCampaignStore } from "../../store/campaign";
import { BriefScreen } from "./BriefScreen";
import { PlanScreen } from "./PlanScreen";
import { MoodboardScreen } from "./MoodboardScreen";
import { GenerationScreen } from "./GenerationScreen";
import { ReviewScreen } from "./ReviewScreen";

interface CampaignWizardProps {
  onClose: () => void;
}

const STEPS = ["brief", "plan", "moodboard", "generating", "review"] as const;

export function CampaignWizard({ onClose }: CampaignWizardProps) {
  const { wizardStep, current, isLoading, error, createCampaign, generateContent, generateMoodboard, approveMoodboard, moodboard, selectVariant, regenerateChannel, approveCampaign, clearCurrent } = useCampaignStore();

  const handleClose = () => { clearCurrent(); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === wizardStep ? "bg-electric-blue text-white" :
                  STEPS.indexOf(wizardStep) > i ? "bg-green-500 text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>{i + 1}</div>
                {i < 4 && <div className="w-8 h-px bg-gray-300" />}
              </div>
            ))}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="p-6">
          {wizardStep === "brief" && <BriefScreen onSubmit={createCampaign} isLoading={isLoading} />}
          {wizardStep === "plan" && current && <PlanScreen campaign={current} onApprove={generateMoodboard} onSkipMoodboard={generateContent} isLoading={isLoading} hasError={!!error} />}
          {wizardStep === "moodboard" && moodboard && (
            <MoodboardScreen
              moodboard={moodboard as any}
              onApprove={async () => { await approveMoodboard(); await generateContent(); }}
              onRegenerate={generateMoodboard}
              isLoading={isLoading}
            />
          )}
          {wizardStep === "generating" && current && <GenerationScreen campaign={current} />}
          {wizardStep === "review" && current && (
            <ReviewScreen campaign={current} onSelectVariant={selectVariant}
              onRegenerate={regenerateChannel} onApprove={approveCampaign} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

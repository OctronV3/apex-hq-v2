import { PipelineBoard } from "@/components/newsletter/pipeline-board";
import { IntegrationGrid } from "@/components/integrations/integration-grid";

export default function NewsletterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Newsletter Pipeline</h2>
        <p className="text-[#888888]">Ideas, drafts, scheduled sends, and published issues.</p>
      </div>
      <PipelineBoard />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Newsletter integrations</h3>
        <IntegrationGrid type="newsletter" />
      </div>
    </div>
  );
}

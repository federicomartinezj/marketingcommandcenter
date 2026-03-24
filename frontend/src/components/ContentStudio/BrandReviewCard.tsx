interface BrandReview {
  approved: boolean;
  score: number;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
    severity: "info" | "warning" | "error";
  }>;
  reviewedAt: string;
}

interface BrandReviewCardProps {
  review: BrandReview;
}

export function BrandReviewCard({ review }: BrandReviewCardProps) {
  return (
    <div className={`rounded-xl p-6 border ${review.approved ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{review.approved ? "✅" : "⚠️"}</span>
          <span className="font-bold text-near-black">Brand Guardian</span>
        </div>
        <div className={`text-2xl font-bold ${review.score >= 80 ? "text-green-600" : "text-amber-600"}`}>
          {review.score}/100
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-2">
        {review.checks.map((check, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5">{check.passed ? "✓" : "✗"}</span>
            <div>
              <span className={`font-medium ${check.passed ? "text-green-700" : check.severity === "error" ? "text-red-700" : "text-amber-700"}`}>
                {check.name}
              </span>
              <span className="text-gray-500 ml-1">— {check.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

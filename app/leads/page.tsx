import { Suspense } from "react";
import { AllLeadsPage } from "@/components/AllLeadsPage";

export default function LeadsRoutePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500">Loading leads…</p>
      }
    >
      <AllLeadsPage />
    </Suspense>
  );
}

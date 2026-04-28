import { Suspense } from "react";

import { VerifyEmailWorkspace } from "@/components/features/auth/verify-email-workspace";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailWorkspace />
    </Suspense>
  );
}

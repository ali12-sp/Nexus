import { Suspense } from "react";

import { ResetPasswordWorkspace } from "@/components/features/auth/reset-password-workspace";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordWorkspace />
    </Suspense>
  );
}

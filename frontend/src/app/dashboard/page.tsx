"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    router.replace(
      user.role === "INVESTOR" ? "/dashboard/investor" : "/dashboard/entrepreneur",
    );
  }, [isLoading, router, user]);

  return null;
}

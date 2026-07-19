"use Client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../lib/auth/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        setAuthorized(true);
      } catch {
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  if (!authorized) {
    return null;
  }

  return children;
}

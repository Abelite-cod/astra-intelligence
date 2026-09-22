"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Waits for Supabase to fire INITIAL_SESSION before rendering children.
 * This prevents all dashboard data-hooks from running before the client
 * session is restored, which would cause empty-state flickers on first load.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // getSession() resolves as soon as the session is read from storage.
    // We use this instead of onAuthStateChange so we don't have to wait
    // for a network round-trip on every page load.
    supabase.auth.getSession().then(() => {
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

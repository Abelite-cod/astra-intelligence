import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

// Import Sidebar with no SSR to prevent hydration mismatch
const Sidebar = dynamic(
  () => import("@/components/dashboard/sidebar").then((m) => ({ default: m.Sidebar })),
  { ssr: false }
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} />
      {/* pt-14 on mobile offsets the fixed top bar; md:pt-0 removes it on desktop */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0" suppressHydrationWarning>
        {children}
      </main>
    </div>
  );
}

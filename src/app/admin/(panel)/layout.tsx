import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { requireUser } from "@/lib/auth";
import { newApplicationsCount } from "@/lib/services";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const total = (await newApplicationsCount()) ?? 0;
  return (
    <div className="min-h-dvh bg-[#faf7f8] md:flex">
      <Sidebar user={user} newApplications={total} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

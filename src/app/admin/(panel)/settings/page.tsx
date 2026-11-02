import { saveSettings } from "@/admin/actions";
import { SETTINGS_FIELDS } from "@/admin/resources";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { requireAdmin } from "@/lib/auth";
import { getSiteConfig } from "@/lib/content";

export const metadata = { title: "Настройки" };

export default async function SettingsPage() {
  await requireAdmin();
  const config = await getSiteConfig();
  return (
    <>
      <h1 className="mb-6 text-3xl text-burgundy-950">Настройки сайта</h1>
      <div className="border border-line bg-white p-4 md:p-6">
        <ResourceForm fields={SETTINGS_FIELDS} values={config} relations={{}} action={saveSettings} />
      </div>
    </>
  );
}

import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Crest } from "@/components/site/Logo";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Вход" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-burgundy-950 p-4">
      <div className="w-full max-w-sm bg-white p-8 shadow-lift">
        <Crest className="mx-auto h-16 w-14" />
        <h1 className="mt-4 text-center text-2xl text-burgundy-950">Управление сайтом</h1>
        <LoginForm />
      </div>
    </main>
  );
}

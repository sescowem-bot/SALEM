import type { Metadata } from "next";
import Link from "next/link";
import { SalemLogo } from "@/components/salem/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Staff Sign In | Salem Medical Laboratories",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo =
    params.redirectTo && params.redirectTo.startsWith("/admin") && !params.redirectTo.startsWith("/admin/login")
      ? params.redirectTo
      : "/admin";

  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-5">
      <div className="surface-card w-full max-w-sm p-8">
        <Link href="/" className="mx-auto flex w-fit">
          <SalemLogo />
        </Link>

        <h1 className="mt-6 text-lg font-semibold text-navy-deep">Staff sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Authorized laboratory staff only.</p>

        <div className="mt-6">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}

import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { getAuthBrandStats } from "@/features/auth/lib/get-auth-brand-stats";

import "@/features/auth/styles/auth-shell.css";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const stats = await getAuthBrandStats();

  return (
    <main className="auth-shell relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-2">
      <div className="auth-accent-bar absolute inset-x-0 top-0 z-30" aria-hidden />

      <AuthBrandPanel stats={stats} />

      <div className="relative flex min-h-screen flex-col">
        <div
          className="auth-orb pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-(--auth-orb-red) blur-3xl"
          aria-hidden
        />
        <div
          className="auth-orb-delayed pointer-events-none absolute bottom-0 -left-20 size-80 rounded-full bg-(--auth-orb-gold) blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-(--auth-orb-red) to-transparent lg:hidden"
          aria-hidden
        />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
          <div className="auth-fade-up w-full max-w-[420px]">{children}</div>
        </div>

        <footer className="relative z-10 px-4 pb-6 text-center text-xs text-muted-foreground sm:px-6 lg:hidden">
          PASS College · e-Advising System
        </footer>
      </div>
    </main>
  );
};

export default AuthLayout;

import { Suspense } from "react";
import { hasAnyUsers } from "@/data/system";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { redirect } from "next/dist/client/components/navigation";

const LoginPage = async () => {

  const usersExist = await hasAnyUsers();

  if (!usersExist) {
    redirect("/auth/setup");
  }

  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;

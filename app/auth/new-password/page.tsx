import { Suspense } from "react";

import { NewPasswordForm } from "@/features/auth/components/new-password-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";

const NewPasswordPage = () => {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <NewPasswordForm />
    </Suspense>
  );
};

export default NewPasswordPage;

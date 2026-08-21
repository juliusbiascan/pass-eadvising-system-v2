import { Suspense } from "react";

import { NewVerificationForm } from "@/features/auth/components/new-verification-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";

const NewVerificationPage = () => {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <NewVerificationForm />
    </Suspense>
  );
};

export default NewVerificationPage;

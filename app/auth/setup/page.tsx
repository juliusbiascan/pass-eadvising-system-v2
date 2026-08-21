import { Suspense } from "react";
import { redirect } from "next/navigation";

import { hasAnyUsers } from "@/data/system";
import { SetupForm } from "@/features/auth/components/setup-form";

const SetupPage = async () => {
  const usersExist = await hasAnyUsers();

  if (usersExist) {
    redirect("/auth/login");
  }

  return (
    <Suspense fallback={null}>
      <SetupForm />
    </Suspense>
  );
};

export default SetupPage;

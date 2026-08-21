import { signOut } from "@/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await signOut({ redirect: false });
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/auth/login'
    }
  });
}

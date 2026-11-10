"use server";

import { redirect } from "next/navigation";

import { forgetCredentials } from "@/lib/cloud/service";
import { clearSession, getSession } from "@/lib/session";

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    forgetCredentials({
      username: session.username,
      password: session.password,
    });
  }
  await clearSession();
  redirect("/login");
}

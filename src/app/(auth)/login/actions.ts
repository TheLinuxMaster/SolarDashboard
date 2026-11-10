"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { CloudAuthError, validateLogin } from "@/lib/cloud/service";
import { AuthConfigError, setSession } from "@/lib/session";

export type LoginState = { error: string } | null;

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Enter your CloudInverter username.")
    .max(200),
  password: z.string().min(1, "Enter your password.").max(200),
});

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Check your email and password and try again.",
    };
  }

  try {
    await validateLogin(parsed.data);
    await setSession(parsed.data);
  } catch (error) {
    if (error instanceof CloudAuthError) {
      return {
        error:
          "CloudInverter rejected that username and password. Check the same login in the SolarTouch app, then try again.",
      };
    }
    if (error instanceof AuthConfigError) {
      return {
        error:
          "This server is missing AUTH_SECRET. Add it to the environment, restart, and try again.",
      };
    }
    console.error(
      "[onyx] login failed:",
      error instanceof Error ? error.message : error,
    );
    return {
      error:
        "Could not reach CloudInverter right now. Check the connection and try again.",
    };
  }

  redirect("/");
}

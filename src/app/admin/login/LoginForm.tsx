"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type SignInState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Signing in\u2026" : "Sign in"}
    </button>
  );
}

const initialState: SignInState = {};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div>
        <label htmlFor="email" className="text-sm font-medium text-navy-deep">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-navy-deep outline-none focus:border-cyan"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-navy-deep">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-navy-deep outline-none focus:border-cyan"
        />
      </div>

      {state.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}

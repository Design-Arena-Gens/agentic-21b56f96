'use client';

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/use-app-store";
import { hashPassword } from "@/utils/crypto";
import { useTheme } from "next-themes";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const signIn = useAppStore((state) => state.signIn);
  const users = useAppStore((state) => state.users);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignInForm) => {
    startTransition(async () => {
      try {
        setError(null);
        const passwordHash = await hashPassword(values.password);
        const user = signIn({
          email: values.email,
          passwordHash,
        });

        setTheme(user.settings.darkMode ? "dark" : "light");
        if (!user.settings.notifications) {
          updateSettings(user.id, { notifications: false });
        }

        const next = params.get("next") ?? "/dashboard";
        router.replace(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-background)] px-4 py-10">
      <div className="glass card-shadow flex w-full max-w-md flex-col gap-8 rounded-[var(--radius-lg)] border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] p-10">
        <div className="flex flex-col gap-3 text-left">
          <span className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--color-brand)]">
            Aurora Finance
          </span>
          <h1 className="text-3xl font-semibold text-[color:var(--color-foreground)]">
            Sign in to your account
          </h1>
          <p className="text-sm text-[color:var(--color-muted)]">
            Track your spending, budgets, and financial health anywhere.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            autoComplete="email"
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            autoComplete="current-password"
            {...register("password")}
          />

          {error ? (
            <div className="rounded-2xl border border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
              {error}
            </div>
          ) : null}

          <Button type="submit" isLoading={isPending}>
            Continue
          </Button>
        </form>

        <div className="flex justify-between text-sm text-[color:var(--color-muted)]">
          <Link
            href="/reset-password"
            className="font-medium text-[color:var(--color-brand)] hover:underline"
          >
            Forgot password?
          </Link>
          <Link
            href="/sign-up"
            className="font-medium text-[color:var(--color-brand)] hover:underline"
          >
            Create an account
          </Link>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl bg-[rgba(37,99,235,0.08)] px-4 py-3 text-sm text-[color:var(--color-brand-strong)]">
            Tip: Create an account first to start tracking your finances.
          </div>
        ) : null}
      </div>
    </div>
  );
}

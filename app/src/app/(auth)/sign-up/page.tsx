'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTransition, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, defaultCategories } from "@/store/use-app-store";
import { hashPassword } from "@/utils/crypto";
import { useTheme } from "next-themes";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const signUp = useAppStore((state) => state.signUp);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: SignUpForm) => {
    startTransition(async () => {
      try {
        setError(null);
        const hashed = await hashPassword(values.password);
        signUp({
          name: values.name,
          email: values.email,
          passwordHash: hashed,
        });
        setTheme("light");
        router.replace("/dashboard");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to create account.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-background)] px-4 py-10">
      <div className="glass card-shadow flex w-full max-w-2xl flex-col gap-10 rounded-[var(--radius-lg)] border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] p-10 md:grid md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--color-brand)]">
            Aurora Finance
          </span>
          <h1 className="text-3xl font-semibold text-[color:var(--color-foreground)]">
            Create your account
          </h1>
          <p className="text-sm text-[color:var(--color-muted)]">
            Start with essential categories like {defaultCategories.slice(0, 3).join(", ")} and
            upgrade any time for automation, custom budgets, and detailed reports.
          </p>
          <div className="rounded-3xl border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] px-4 py-3 text-xs text-[color:var(--color-brand-strong)]">
            Premium benefits include bank imports, custom budgeting rules, PDF reports, and priority
            support.
          </div>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full name" placeholder="Alex Morgan" error={errors.name?.message} {...register("name")} />
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
            placeholder="Create a strong password"
            error={errors.password?.message}
            autoComplete="new-password"
            {...register("password")}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />

          {error ? (
            <div className="rounded-2xl border border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
              {error}
            </div>
          ) : null}

          <Button type="submit" isLoading={isPending}>
            Create account
          </Button>
          <p className="text-sm text-[color:var(--color-muted)]">
            Already a member?{" "}
            <Link href="/sign-in" className="font-medium text-[color:var(--color-brand)] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

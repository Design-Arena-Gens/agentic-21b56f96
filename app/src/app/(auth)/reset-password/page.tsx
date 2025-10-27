'use client';

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/use-app-store";
import { hashPassword } from "@/utils/crypto";

const resetSchema = z
  .object({
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

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const resetPassword = useAppStore((state) => state.resetPassword);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: ResetForm) => {
    startTransition(async () => {
      try {
        const hashed = await hashPassword(values.password);
        resetPassword({
          email: values.email,
          newPasswordHash: hashed,
        });
        setStatus("success");
        setFeedback("Password updated successfully. You can sign in with your new password.");
      } catch (cause) {
        setStatus("error");
        setFeedback(cause instanceof Error ? cause.message : "Unable to reset password.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-background)] px-4 py-10">
      <div className="glass card-shadow flex w-full max-w-lg flex-col gap-8 rounded-[var(--radius-lg)] border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] p-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--color-brand)]">
            Reset access
          </span>
          <h1 className="text-3xl font-semibold text-[color:var(--color-foreground)]">
            Choose a secure password
          </h1>
          <p className="text-sm text-[color:var(--color-muted)]">
            Enter your account email and a new password. We&apos;ll update it instantly so you can
            continue managing your finances safely.
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
            label="New password"
            type="password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            autoComplete="new-password"
            {...register("password")}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />

          {feedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                status === "success"
                  ? "border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.12)] text-[color:var(--color-accent)]"
                  : "border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.08)] text-[color:var(--color-danger)]"
              }`}
            >
              {feedback}
            </div>
          ) : null}

          <Button type="submit" isLoading={isPending}>
            Update password
          </Button>
        </form>

        <div className="text-sm text-[color:var(--color-muted)]">
          Remembered it?{" "}
          <Link href="/sign-in" className="font-medium text-[color:var(--color-brand)] hover:underline">
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

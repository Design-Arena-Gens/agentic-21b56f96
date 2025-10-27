'use client';

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { useAppStore } from "@/store/use-app-store";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/utils/format";

const budgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, "Choose a category."),
  limit: z
    .string()
    .refine((value) => Number(value) > 0, "Budget must be greater than zero."),
  alertThreshold: z
    .string()
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => (value ? value > 0 && value <= 100 : true), {
      message: "Alert threshold must be between 1 and 100%.",
    })
    .optional(),
  rollover: z.boolean().optional(),
});

type BudgetForm = z.input<typeof budgetSchema>;
type BudgetValues = z.infer<typeof budgetSchema>;

export default function BudgetingPage() {
  const { user } = useAuth();
  const upsertBudget = useAppStore((state) => state.upsertBudget);
  const removeBudget = useAppStore((state) => state.removeBudget);
  const addCustomCategory = useAppStore((state) => state.addCustomCategory);
  const transactions = useAppStore((state) => state.transactions);
  const budgets = useAppStore((state) => state.budgets);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [customCategory, setCustomCategory] = useState("");
  const [premiumMessage, setPremiumMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
  } = useForm<BudgetForm, undefined, BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: user?.categories.at(0) ?? "",
      limit: "",
      alertThreshold: "",
      rollover: true,
    },
  });

  const currency = user?.settings.currency ?? "USD";
  const rolloverValue = useWatch({
    control,
    name: "rollover",
  });

  const userBudgets = useMemo(
    () => budgets.filter((budget) => budget.userId === user?.id),
    [budgets, user?.id],
  );

  const userTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.userId === user?.id),
    [transactions, user?.id],
  );

  const calculateSpent = (category: string) =>
    userTransactions
      .filter((transaction) => transaction.category === category && transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

  const onSubmit = (values: BudgetValues) => {
    if (!user) return;

    const payload = {
      id: values.id,
      userId: user.id,
      category: values.category,
      limit: Number(values.limit),
      rollover: values.rollover,
      alertThreshold: values.alertThreshold,
    } as const;

    upsertBudget(payload);
    reset({
      category: user.categories.at(0) ?? "",
      limit: "",
      alertThreshold: "",
      rollover: true,
    });
    setEditingId(undefined);
  };

  const handleEdit = (budgetId: string) => {
    const budget = userBudgets.find((item) => item.id === budgetId);
    if (!budget) return;
    setEditingId(budgetId);
    setValue("id", budget.id);
    setValue("category", budget.category);
    setValue("limit", String(budget.limit));
    setValue("alertThreshold", budget.alertThreshold ? String(budget.alertThreshold) : "");
    setValue("rollover", budget.rollover ?? true);
  };

  const handleAddCategory = () => {
    if (!user || user.subscription.tier !== "premium") {
      setPremiumMessage("Upgrade to Premium to create personalized budget categories and rules.");
      return;
    }
    if (!customCategory.trim()) return;
    addCustomCategory(user.id, customCategory.trim());
    setPremiumMessage(`Added ${customCategory.trim()} to your categories.`);
    setCustomCategory("");
  };

  const premiumLocked = user?.subscription.tier !== "premium";

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-[var(--radius-lg)]">
        <div className="grid gap-6 sm:grid-cols-[1fr,1fr]">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold text-[color:var(--color-foreground)]">
              Monthly budgeting
            </h2>
            <p className="text-sm text-[color:var(--color-muted)]">
              Stay aligned with your goals by assigning limits per category. Premium members can set
              rollover rules and advanced alerts.
            </p>
            {premiumMessage ? (
              <div className="rounded-2xl border border-[rgba(37,99,235,0.22)] bg-[rgba(37,99,235,0.08)] px-4 py-3 text-xs text-[color:var(--color-brand-strong)]">
                {premiumMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-[rgba(148,163,184,0.32)] bg-[color:var(--color-surface-muted)] p-4">
              <h3 className="text-sm font-semibold text-[color:var(--color-foreground)]">
                Add a custom category (Premium)
              </h3>
              <Input
                placeholder="e.g. Wellness Retreat"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                disabled={premiumLocked}
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleAddCategory}
                disabled={!customCategory.trim()}
              >
                Save category
              </Button>
              {premiumLocked ? (
                <p className="text-xs text-[color:var(--color-muted)]">
                  Custom categories, advanced alerts, and PDF budgeting insights are exclusive to
                  Premium.
                </p>
              ) : null}
            </div>
          </div>

          <form
            className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.2)] bg-[color:var(--color-surface-muted)] p-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[color:var(--color-muted)]">
                Category
              </label>
              <select
                className="h-12 w-full rounded-2xl border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] px-4 text-sm text-[color:var(--color-foreground)] focus:border-[color:var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.18)]"
                {...register("category")}
              >
                <option value="" disabled>
                  Select category
                </option>
                {user?.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <span className="text-xs text-[color:var(--color-danger)]">{errors.category.message}</span>
              ) : null}
            </div>

            <Input
              label="Monthly limit"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              error={errors.limit?.message}
              {...register("limit")}
            />

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[color:var(--color-muted)]">
                Alert me when spending reaches (% of budget)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="e.g. 80"
                disabled={premiumLocked}
                error={errors.alertThreshold?.message}
                {...register("alertThreshold")}
              />
              {premiumLocked ? (
                <p className="text-xs text-[color:var(--color-muted)]">
                  Upgrade to unlock proactive email alerts for approaching limits.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Toggle
                pressed={Boolean(rolloverValue)}
                onClick={() => setValue("rollover", !rolloverValue)}
                label="Carry over unused budget to next month"
                disabled={premiumLocked}
                className={premiumLocked ? "opacity-60" : ""}
              />
              {premiumLocked ? (
                <p className="text-xs text-[color:var(--color-muted)]">
                  Premium members can carry over remaining amounts automatically.
                </p>
              ) : null}
            </div>

            <Button type="submit" className="mt-2">
              {editingId ? "Update budget" : "Create budget"}
            </Button>
          </form>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {userBudgets.length === 0 ? (
          <div className="col-span-full flex h-40 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[rgba(148,163,184,0.3)] text-sm text-[color:var(--color-muted)]">
            You haven&apos;t created any budgets yet. Use the form above to get started.
          </div>
        ) : (
          userBudgets.map((budget) => {
            const spent = calculateSpent(budget.category);
            const progress = Math.min(spent / budget.limit, 1);
            const remaining = Math.max(budget.limit - spent, 0);
            const tone: "danger" | "warning" | "success" =
              progress >= 1 ? "danger" : progress >= 0.8 ? "warning" : "success";

            const alertReached = budget.alertThreshold
              ? spent >= (budget.alertThreshold / 100) * budget.limit
              : false;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.22)] bg-[color:var(--color-surface)] p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
                        {budget.category}
                      </h3>
                      <p className="text-xs text-[color:var(--color-muted)]">
                        Limit {formatCurrency(budget.limit, currency)} · Created {format(new Date(budget.createdAt), "MMM d")}
                      </p>
                    </div>
                    <Badge tone={tone}>{alertReached ? "Alert" : `${Math.round(progress * 100)}% used`}</Badge>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-[rgba(148,163,184,0.2)]">
                    <div
                      className={`h-full rounded-full ${
                        tone === "danger"
                          ? "bg-[rgba(239,68,68,0.9)]"
                          : tone === "warning"
                            ? "bg-[rgba(245,158,11,0.9)]"
                            : "bg-[rgba(34,197,94,0.9)]"
                      }`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-[color:var(--color-muted)]">
                    <span>Spent {formatCurrency(spent, currency)}</span>
                    <span>Remaining {formatCurrency(remaining, currency)}</span>
                  </div>

                  {budget.rollover ? (
                    <div className="rounded-2xl bg-[rgba(34,197,94,0.12)] px-4 py-2 text-xs text-[color:var(--color-accent)]">
                      Unused budget will roll into next month.
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 flex-1 rounded-2xl border-[rgba(37,99,235,0.28)]"
                      onClick={() => handleEdit(budget.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 flex-1 rounded-2xl border border-[rgba(239,68,68,0.24)] text-[color:var(--color-danger)]"
                      onClick={() => removeBudget(budget.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

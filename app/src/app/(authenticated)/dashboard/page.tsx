'use client';

import { useMemo, useState, useTransition } from "react";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
  subDays,
  subMonths,
} from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/use-app-store";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate } from "@/utils/format";
import { generateFinancialReport } from "@/utils/reporting";

const TIMEFRAMES = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
] as const;

type Timeframe = (typeof TIMEFRAMES)[number]["value"];

type FlowDatum = {
  label: string;
  description: string;
  income: number;
  expenses: number;
};

type CategoryDatum = {
  category: string;
  amount: number;
};

type CategoryTooltipProps = {
  active?: boolean;
  payload?: {
    payload?: CategoryDatum;
  }[];
};

type MetricTone = "neutral" | "success" | "warning" | "danger" | "info";

type SummaryMetric = {
  label: string;
  value: number;
  tone: MetricTone;
  description: string;
  badge: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: {
    payload?: FlowDatum;
  }[];
};

const ChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload as FlowDatum | undefined;
  if (!datum) return null;
  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[color:var(--color-surface)] px-4 py-3 text-xs shadow-lg">
      <div className="font-semibold text-[color:var(--color-foreground)]">{datum.label}</div>
      <div className="mt-1 text-[color:var(--color-muted)]">{datum.description}</div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const transactions = useAppStore((state) => state.transactions);
  const budgets = useAppStore((state) => state.budgets);
  const [isExporting, startTransition] = useTransition();

  const userTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.userId === user?.id),
    [transactions, user?.id],
  );

  const userBudgets = useMemo(
    () => budgets.filter((budget) => budget.userId === user?.id),
    [budgets, user?.id],
  );

  const currency = user?.settings.currency ?? "USD";

  const filteredTransactions = useMemo(() => {
    const reference = new Date();
    return userTransactions.filter((transaction) => {
      const date = parseISO(transaction.date);
      if (timeframe === "daily") return isSameDay(date, reference);
      if (timeframe === "monthly") return isSameMonth(date, reference);
      return isSameYear(date, reference);
    });
  }, [timeframe, userTransactions]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const trend = income === 0 ? 0 : ((income - expenses) / income) * 100;

    return {
      income,
      expenses,
      net: income - expenses,
      trend,
    };
  }, [filteredTransactions]);

  const trendLabel = totals.trend >= 0 ? "Positive cash flow" : "Watch your spending";

  const summaryMetrics: SummaryMetric[] = useMemo(
    () => [
      {
        label: "Income",
        value: totals.income,
        tone: "success",
        description: "Total incoming funds",
        badge: totals.income > 0 ? "On track" : "Add income",
      },
      {
        label: "Expenses",
        value: totals.expenses,
        tone: "danger",
        description: "Tracked spending",
        badge: totals.expenses > totals.income ? "Over budget" : "Manage wisely",
      },
      {
        label: "Net",
        value: totals.net,
        tone: totals.net >= 0 ? "success" : "danger",
        description: "Income minus expenses",
        badge: totals.net >= 0 ? "Healthy liquidity" : "Review spending",
      },
      {
        label: "Trend",
        value: totals.trend,
        tone: totals.trend >= 0 ? "info" : "warning",
        description: "Cash flow delta",
        badge: trendLabel,
      },
    ],
    [totals, trendLabel],
  );

  const rangeData: FlowDatum[] = useMemo(() => {
    const reference = new Date();
    if (timeframe === "daily") {
      const days = eachDayOfInterval({ start: subDays(reference, 6), end: reference });
      return days.map((day) => {
        const dayTransactions = userTransactions.filter((transaction) =>
          isSameDay(parseISO(transaction.date), day),
        );
        const income = dayTransactions
          .filter((transaction) => transaction.type === "income")
          .reduce((total, transaction) => total + transaction.amount, 0);
        const expenses = dayTransactions
          .filter((transaction) => transaction.type === "expense")
          .reduce((total, transaction) => total + transaction.amount, 0);

        return {
          label: format(day, "EEE"),
          description: `${formatCurrency(income, currency)} income · ${formatCurrency(expenses, currency)} expenses`,
          income,
          expenses,
        };
      });
    }

    if (timeframe === "monthly") {
      const days = eachDayOfInterval({ start: subDays(reference, 29), end: reference });
      const dailyMap: Record<string, { income: number; expenses: number }> = {};

      days.forEach((day) => {
        const key = format(day, "MMM d");
        dailyMap[key] = { income: 0, expenses: 0 };
      });

      userTransactions.forEach((transaction) => {
        if (!isSameMonth(parseISO(transaction.date), reference)) return;
        const key = format(parseISO(transaction.date), "MMM d");
        if (!dailyMap[key]) {
          dailyMap[key] = { income: 0, expenses: 0 };
        }
        dailyMap[key][transaction.type === "income" ? "income" : "expenses"] +=
          transaction.amount;
      });

      return Object.entries(dailyMap).map(([label, values]) => ({
        label,
        description: `${formatCurrency(values.income, currency)} income · ${formatCurrency(values.expenses, currency)} expenses`,
        income: Number(values.income.toFixed(2)),
        expenses: Number(values.expenses.toFixed(2)),
      }));
    }

    const months = eachMonthOfInterval({ start: subMonths(reference, 11), end: reference });
    return months.map((month) => {
      const monthlyTransactions = userTransactions.filter((transaction) =>
        isSameMonth(parseISO(transaction.date), month) && isSameYear(parseISO(transaction.date), month),
      );
      const income = monthlyTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);
      const expenses = monthlyTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        label: format(month, "MMM"),
        description: `${formatCurrency(income, currency)} income · ${formatCurrency(expenses, currency)} expenses`,
        income,
        expenses,
      };
    });
  }, [timeframe, userTransactions, currency]);

  const spendingByCategory: CategoryDatum[] = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        map.set(transaction.category, (map.get(transaction.category) ?? 0) + transaction.amount);
      });

    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const handleExport = () => {
    if (!user) return;
    startTransition(() => {
      generateFinancialReport({
        user,
        transactions: filteredTransactions,
        budgets: userBudgets,
        currency,
        timeframe,
      });
    });
  };

  const upcomingRenewal = user?.subscription.renewalDate
    ? formatDate(user.subscription.renewalDate, "PPP")
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-[var(--radius-lg)] bg-[color:var(--color-surface)] p-6 shadow-sm shadow-black/5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[color:var(--color-foreground)]">Financial overview</h2>
          <p className="text-sm text-[color:var(--color-muted)]">
            Visualize your cash flow across daily, monthly, and yearly views. Stay aligned with your budgets and goals.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <SegmentedControl
            options={TIMEFRAMES}
            value={timeframe}
            onChange={(value: Timeframe) => setTimeframe(value)}
          />
          {user?.subscription.tier === "premium" ? (
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-[rgba(37,99,235,0.28)] bg-[color:var(--color-surface)]"
              onClick={handleExport}
              isLoading={isExporting}
            >
              Export PDF report
            </Button>
          ) : (
            <Badge tone="warning" className="uppercase">
              Upgrade for PDF reports
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="h-full rounded-[var(--radius-lg)]">
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-[color:var(--color-muted)]">
                  {metric.label}
                </span>
                <span className="text-2xl font-semibold text-[color:var(--color-foreground)]">
                  {metric.label === "Trend"
                    ? `${metric.value >= 0 ? "+" : ""}${metric.value.toFixed(1)}%`
                    : formatCurrency(metric.value, currency)}
                </span>
                <p className="text-xs text-[color:var(--color-muted)]">{metric.description}</p>
                <Badge tone={metric.tone}>{metric.badge}</Badge>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-[var(--radius-lg)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
                Cash flow trends
              </h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Income versus expenses across the selected timeframe.
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <AreaChart data={rangeData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(37,99,235,0.8)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="rgba(37,99,235,0.1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(239,68,68,0.8)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="rgba(239,68,68,0.1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" stroke="rgba(148,163,184,0.7)" tickLine={false} />
                <YAxis stroke="rgba(148,163,184,0.7)" tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(37,99,235,0.12)" }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="rgba(37,99,235,1)"
                  fill="url(#incomeGradient)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="rgba(239,68,68,1)"
                  fill="url(#expenseGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[var(--radius-lg)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">Top spending</h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Categories with the highest expenses this {timeframe}.
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={spendingByCategory} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="category" stroke="rgba(148,163,184,0.7)" tickLine={false} />
                <YAxis stroke="rgba(148,163,184,0.7)" tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }: CategoryTooltipProps) => {
                    if (!active || !payload?.length) return null;
                    const datum = payload[0]?.payload;
                    if (!datum) return null;
                    return (
                      <div className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[color:var(--color-surface)] px-4 py-3 text-xs shadow-lg">
                        <div className="font-semibold text-[color:var(--color-foreground)]">
                          {datum.category}
                        </div>
                        <div className="mt-1 text-[color:var(--color-muted)]">
                          {formatCurrency(datum.amount, currency)} spent
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[24, 24, 10, 10]}
                  fill="rgba(37,99,235,0.75)"
                  className="origin-bottom"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {userBudgets.length > 0 ? (
        <Card className="rounded-[var(--radius-lg)]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">Budget progress</h3>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Compare your monthly spending to the budgets you set.
                </p>
              </div>
              {user?.subscription.tier === "premium" && upcomingRenewal ? (
                <Badge tone="info">Renewal {upcomingRenewal}</Badge>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {userBudgets.map((budget) => {
                const spent = filteredTransactions
                  .filter((transaction) => transaction.category === budget.category && transaction.type === "expense")
                  .reduce((total, transaction) => total + transaction.amount, 0);
                const progress = Math.min(spent / budget.limit, 1);
                const remaining = Math.max(budget.limit - spent, 0);
                const tone: "danger" | "warning" | "success" =
                  progress >= 1 ? "danger" : progress >= 0.75 ? "warning" : "success";

                return (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <div className="rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.16)] bg-[color:var(--color-surface-muted)] p-5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-[color:var(--color-foreground)]">
                            {budget.category}
                          </h4>
                          <p className="text-xs text-[color:var(--color-muted)]">
                            Limit {formatCurrency(budget.limit, currency)}
                          </p>
                        </div>
                        <Badge tone={tone}>
                          {Math.round(progress * 100)}% used
                        </Badge>
                      </div>
                      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[rgba(148,163,184,0.22)]">
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
                      <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--color-muted)]">
                        <span>Spent {formatCurrency(spent, currency)}</span>
                        <span>Remaining {formatCurrency(remaining, currency)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

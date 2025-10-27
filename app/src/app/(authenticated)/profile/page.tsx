'use client';

import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Sun, Moon, Star, MailCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { useAppStore } from "@/store/use-app-store";

const currencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "INR"];

export default function ProfilePage() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const upgrade = useAppStore((state) => state.upgradeToPremium);
  const downgrade = useAppStore((state) => state.downgradeToFree);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const sendAnalyticsEmail = useAppStore((state) => state.sendAnalyticsEmail);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<"success" | "error" | "warning" | null>(null);

  if (!user) return null;

  const handleThemeToggle = () => {
    const nextMode = user.settings.darkMode ? "light" : "dark";
    updateSettings(user.id, { darkMode: !user.settings.darkMode });
    setTheme(nextMode);
  };

  const handleCurrencyChange = (value: string) => {
    updateSettings(user.id, { currency: value });
    setFeedback(`Currency updated to ${value}.`);
    setStatus("success");
  };

  const handleUpgrade = () => {
    if (user.subscription.tier === "premium") return;
    upgrade(user.id);
    setFeedback("Welcome to Aurora Premium! Automated imports and advanced budgeting unlocked.");
    setStatus("success");
  };

  const handleDowngrade = () => {
    downgrade(user.id);
    setFeedback("You are back on the free plan. Premium automations are disabled.");
    setStatus("warning");
  };

  const handleAnalyticsEmail = async (period: "weekly" | "monthly") => {
    try {
      sendAnalyticsEmail(user.id, period);
      await fetch("/api/email/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          period,
          summary: `${period} income ${user.settings.currency}`,
        }),
      });
      setFeedback(`Scheduled your ${period} insights email.`);
      setStatus("success");
    } catch {
      setFeedback("Unable to schedule email analytics right now.");
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-[var(--radius-lg)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-[color:var(--color-foreground)]">Your profile</h2>
              <p className="text-sm text-[color:var(--color-muted)]">
                Manage account preferences, theme, notifications, and subscription.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.24)] bg-[color:var(--color-surface-muted)] p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Email
                </span>
                <p className="mt-1 text-base font-semibold text-[color:var(--color-foreground)]">
                  {user.email}
                </p>
                <span className="text-xs text-[color:var(--color-muted)]">
                  Member since {format(new Date(user.createdAt), "PP")}
                </span>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.24)] bg-[color:var(--color-surface)] p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Plan
                </span>
                <div className="mt-2 flex items-center justify-between">
                  <Badge tone={user.subscription.tier === "premium" ? "success" : "neutral"}>
                    {user.subscription.tier === "premium" ? "Premium" : "Free"}
                  </Badge>
                  {user.subscription.renewalDate ? (
                    <span className="text-xs text-[color:var(--color-muted)]">
                      Renews {format(new Date(user.subscription.renewalDate), "PPP")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.18)] bg-[color:var(--color-surface)] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--color-foreground)]">
                    Appearance
                  </span>
                  <Badge tone="info">New</Badge>
                </div>
                <p className="text-xs text-[color:var(--color-muted)]">
                  Toggle light and dark themes to match iOS or Android preferences.
                </p>
                <Button
                  variant="outline"
                  className="h-10 rounded-2xl border-[rgba(37,99,235,0.24)]"
                  onClick={handleThemeToggle}
                >
                  {user.settings.darkMode ? (
                    <>
                      <Sun className="mr-2 size-4" /> Switch to light
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 size-4" /> Switch to dark
                    </>
                  )}
                </Button>
                <Toggle
                  pressed={user.settings.haptics}
                  onClick={() => updateSettings(user.id, { haptics: !user.settings.haptics })}
                  label="Enable haptic feedback"
                />
              </div>

              <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.18)] bg-[color:var(--color-surface)] p-5">
                <span className="text-sm font-semibold text-[color:var(--color-foreground)]">
                  Preferred currency
                </span>
                <p className="text-xs text-[color:var(--color-muted)]">
                  Used for dashboards, budgets, and email reports.
                </p>
                <div className="grid gap-2">
                  <select
                    className="h-12 w-full rounded-2xl border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] px-4 text-sm text-[color:var(--color-foreground)] focus:border-[color:var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.18)]"
                    value={user.settings.currency}
                    onChange={(event) => handleCurrencyChange(event.target.value)}
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
                <Toggle
                  pressed={user.settings.notifications}
                  onClick={() => updateSettings(user.id, { notifications: !user.settings.notifications })}
                  label="Email notifications"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 rounded-[var(--radius-lg)]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">Subscription</h3>
              <p className="text-xs text-[color:var(--color-muted)]">
                Unlock automation, custom budgeting, PDF reports, and priority support.
              </p>
            </div>
            <Star className="size-5 text-[color:var(--color-brand)]" />
          </div>
          <ul className="grid gap-3 text-sm text-[color:var(--color-muted)]">
            <li>• Automated transaction imports via Plaid</li>
            <li>• Custom categories, rules, and alerts</li>
            <li>• Detailed PDF financial reports</li>
            <li>• Weekly and monthly email insights</li>
            <li>• Priority customer support</li>
          </ul>
          {user.subscription.tier === "premium" ? (
            <Button
              variant="outline"
              className="mt-auto h-12 rounded-2xl border-[rgba(239,68,68,0.24)] text-[color:var(--color-danger)]"
              onClick={handleDowngrade}
            >
              Downgrade to free
            </Button>
          ) : (
            <Button className="mt-auto h-12 rounded-2xl" onClick={handleUpgrade}>
              Upgrade to Premium
            </Button>
          )}
        </Card>
      </div>

      <Card className="rounded-[var(--radius-lg)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
                Analytics email digest
              </h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Premium members receive weekly and monthly performance summaries in their inbox.
              </p>
            </div>
            <MailCheck className="size-5 text-[color:var(--color-brand)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              className="h-12 rounded-2xl"
              onClick={() => handleAnalyticsEmail("weekly")}
              disabled={user.subscription.tier !== "premium"}
            >
              Send weekly snapshot
            </Button>
            <Button
              variant="secondary"
              className="h-12 rounded-2xl"
              onClick={() => handleAnalyticsEmail("monthly")}
              disabled={user.subscription.tier !== "premium"}
            >
              Send monthly report
            </Button>
          </div>
          {user.subscription.tier !== "premium" ? (
            <p className="text-xs text-[color:var(--color-muted)]">
              Upgrade to schedule automated summaries with categorized insights and PDF attachments.
            </p>
          ) : null}
        </div>
      </Card>

      {feedback ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
            status === "error"
              ? "border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.08)] text-[color:var(--color-danger)]"
              : status === "warning"
                ? "border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.08)] text-[color:var(--color-warning)]"
                : "border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.08)] text-[color:var(--color-accent)]"
          }`}
        >
          {feedback}
        </motion.div>
      ) : null}

      <Card className="rounded-[var(--radius-lg)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
                Security and support
              </h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Bank-grade encryption and two-factor authentication keep your finances secure.
              </p>
            </div>
            <ShieldCheck className="size-5 text-[color:var(--color-brand)]" />
          </div>
          <div className="grid gap-4 text-sm text-[color:var(--color-muted)] sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.2)] bg-[color:var(--color-surface-muted)] p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                Support channel
              </span>
              <p className="mt-1 font-semibold text-[color:var(--color-foreground)]">
                {user.subscription.tier === "premium" ? "Priority concierge" : "Standard email"}
              </p>
              <span className="text-xs text-[color:var(--color-muted)]">
                {user.subscription.tier === "premium"
                  ? "24-hour response window with financial coaching tips."
                  : "Responses within 2 business days."}
              </span>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.2)] bg-[color:var(--color-surface-muted)] p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                Data protection
              </span>
              <p className="mt-1 font-semibold text-[color:var(--color-foreground)]">SOC 2 Type II</p>
              <span className="text-xs text-[color:var(--color-muted)]">
                Financial data is encrypted at rest and in transit with granular access controls.
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

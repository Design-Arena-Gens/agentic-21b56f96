'use client';

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAppStore } from "@/store/use-app-store";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate } from "@/utils/format";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Select a category."),
  amount: z
    .string()
    .refine((value) => Number(value) > 0, "Amount must be greater than zero."),
  date: z.string(),
  notes: z.string().optional(),
  receipt: z
    .instanceof(File)
    .optional()
    .or(z.any().transform(() => undefined)),
});

type TransactionForm = z.infer<typeof transactionSchema>;

type FilterOption = "all" | "income" | "expense";

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expenses", value: "expense" },
] as const;

export default function TransactionsPage() {
  const { user } = useAuth();
  const addTransaction = useAppStore((state) => state.addTransaction);
  const removeTransaction = useAppStore((state) => state.removeTransaction);
  const addReceipt = useAppStore((state) => state.addReceipt);
  const importTransactions = useAppStore((state) => state.importTransactions);
  const transactions = useAppStore((state) => state.transactions);
  const receipts = useAppStore((state) => state.receipts);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const haptic = useHapticFeedback(Boolean(user?.settings.haptics));

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch,
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      category: user?.categories.at(0) ?? "Food",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const currency = user?.settings.currency ?? "USD";

  const userTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.userId === user?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, user?.id],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return userTransactions;
    return userTransactions.filter((transaction) => transaction.type === filter);
  }, [filter, userTransactions]);

  const receiptPreview = watch("receipt");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (receiptPreview instanceof File) {
      const url = URL.createObjectURL(receiptPreview);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [receiptPreview]);

  const onSubmit = async (values: TransactionForm) => {
    if (!user) return;
    let receiptId: string | undefined;

    if (values.receipt instanceof File) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to process receipt."));
        reader.readAsDataURL(values.receipt as File);
      });

      const savedReceipt = addReceipt({
        fileName: values.receipt.name,
        dataUrl: base64,
      });
      receiptId = savedReceipt.id;
    }

    addTransaction({
      userId: user.id,
      type: values.type,
      category: values.category,
      amount: Number(values.amount),
      date: values.date,
      notes: values.notes,
      receiptId,
    });

    haptic();
    reset({
      type: values.type,
      category: values.category,
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      receipt: undefined,
    });
  };

  const handleImport = async () => {
    if (!user || user.subscription.tier !== "premium") return;
    setIsImporting(true);
    try {
      const imported = importTransactions(user.id);
      setImportSummary(`Imported ${imported.length} transactions from linked accounts.`);
      haptic();
    } catch (error) {
      setImportSummary(error instanceof Error ? error.message : "Unable to import transactions.");
    } finally {
      setIsImporting(false);
    }
  };

  const getReceiptImage = (receiptId?: string) =>
    receiptId ? receipts.find((receipt) => receipt.id === receiptId)?.dataUrl : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[var(--radius-lg)] bg-[color:var(--color-surface)] p-6 shadow-sm shadow-black/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--color-foreground)]">
              Record a transaction
            </h2>
            <p className="text-sm text-[color:var(--color-muted)]">
              Manually log income or expenses and attach receipts for your records.
            </p>
          </div>
          <SegmentedControl
            options={filterOptions}
            value={filter}
            onChange={(value: FilterOption) => setFilter(value)}
          />
        </div>

        <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <label className="text-sm font-medium text-[color:var(--color-muted)]">Type</label>
            <div className="flex gap-3">
              {(["income", "expense"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={watch("type") === type}
                  className={`flex h-12 flex-1 items-center justify-center rounded-2xl border text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)] ${
                    watch("type") === type
                      ? "border-[rgba(37,99,235,0.4)] bg-[rgba(37,99,235,0.12)] text-[color:var(--color-brand-strong)]"
                      : "border-[rgba(148,163,184,0.24)] bg-[color:var(--color-surface)]"
                  }`}
                  onClick={() => {
                    haptic();
                    setValue("type", type);
                  }}
                >
                  {type === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>
            {errors.type ? (
              <span className="text-xs text-[color:var(--color-danger)]">{errors.type.message}</span>
            ) : null}

            <Input
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register("amount")}
            />

            <div className="grid gap-2">
              <label className="text-sm font-medium text-[color:var(--color-muted)]">Category</label>
              <select
                className="h-12 w-full rounded-2xl border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] px-4 text-sm text-[color:var(--color-foreground)] focus:border-[color:var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.18)]"
                {...register("category")}
              >
                {user?.categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <span className="text-xs text-[color:var(--color-danger)]">{errors.category.message}</span>
              ) : null}
            </div>

            <Input
              label="Date"
              type="date"
              error={errors.date?.message}
              {...register("date")}
            />
          </div>

          <div className="grid gap-4">
            <Textarea
              label="Notes"
              placeholder="Add context such as merchant, purpose, or tags"
              rows={5}
              {...register("notes")}
            />
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[color:var(--color-muted)]">
                Receipt (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="block w-full rounded-2xl border border-dashed border-[rgba(148,163,184,0.4)] bg-[rgba(148,163,184,0.08)] px-4 py-3 text-sm text-[color:var(--color-muted)] file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-[color:var(--color-brand)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                {...register("receipt")}
              />
              {previewUrl ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.18)]">
                  <Image
                    src={previewUrl}
                    alt="Receipt preview"
                    width={600}
                    height={320}
                    className="h-40 w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
            </div>

            <Button type="submit" className="w-full">
              Save transaction
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[color:var(--color-surface)] p-6 shadow-sm shadow-black/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
              Activity feed
            </h3>
            <p className="text-sm text-[color:var(--color-muted)]">
              Recent transactions across your manual entries and automated imports.
            </p>
          </div>
          {user?.subscription.tier === "premium" ? (
            <Button
              variant="outline"
              className="h-12 min-w-[200px] rounded-2xl border-[rgba(37,99,235,0.28)]"
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? "Syncing…" : "Import from bank"}
            </Button>
          ) : (
            <Badge tone="warning" className="uppercase">
              Premium unlocks bank imports
            </Badge>
          )}
        </div>

        {importSummary ? (
          <div className="rounded-2xl border border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.1)] px-4 py-3 text-xs text-[color:var(--color-accent)]">
            {importSummary}
          </div>
        ) : null}

        <div className="grid gap-4">
          {filteredTransactions.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[rgba(148,163,184,0.32)] text-sm text-[color:var(--color-muted)]">
              No transactions yet. Add one above to get started.
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const receiptSrc = getReceiptImage(transaction.receiptId);
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[rgba(148,163,184,0.18)] bg-[color:var(--color-surface-muted)] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div
                        className={`flex size-12 items-center justify-center rounded-2xl text-sm font-semibold ${
                          transaction.type === "income"
                            ? "bg-[rgba(34,197,94,0.16)] text-[color:var(--color-accent)]"
                            : "bg-[rgba(239,68,68,0.16)] text-[color:var(--color-danger)]"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-[color:var(--color-foreground)]">
                          {transaction.category}
                        </span>
                        <span className="text-xs text-[color:var(--color-muted)]">
                          {formatDate(transaction.date)} · {transaction.source === "imported" ? "Imported" : "Manual"}
                        </span>
                        {transaction.notes ? (
                          <span className="mt-1 text-sm text-[color:var(--color-muted)]">
                            {transaction.notes}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 md:w-48">
                      <span className="text-lg font-semibold text-[color:var(--color-foreground)]">
                        {transaction.type === "income" ? "" : "-"}
                        {formatCurrency(transaction.amount, currency)}
                      </span>
                      <div className="flex gap-2">
                        {receiptSrc ? (
                          <a
                            href={receiptSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-2xl border border-[rgba(148,163,184,0.28)] px-3 py-2 text-xs font-semibold text-[color:var(--color-brand)]"
                          >
                            View receipt
                          </a>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 rounded-2xl border border-[rgba(239,68,68,0.2)] px-3 text-xs text-[color:var(--color-danger)]"
                          onClick={() => removeTransaction(transaction.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

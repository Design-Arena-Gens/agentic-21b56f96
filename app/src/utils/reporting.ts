import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatCurrency } from "@/utils/format";
import type { Budget, Transaction, User } from "@/store/use-app-store";

export type ReportTimeframe = "daily" | "monthly" | "yearly";

type ReportOptions = {
  user: User;
  transactions: Transaction[];
  budgets: Budget[];
  currency: string;
  timeframe: ReportTimeframe;
};

export function generateFinancialReport({
  user,
  transactions,
  budgets,
  currency,
  timeframe,
}: ReportOptions) {
  const doc = new jsPDF();
  const title = `Aurora Finance Report (${timeframe.toUpperCase()})`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Prepared for ${user.name} (${user.email})`, 14, 28);
  doc.text(`Generated on ${formatDate(new Date(), "PPPpp")}`, 14, 34);

  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const net = incomeTotal - expenseTotal;

  doc.text(
    `Summary: Income ${formatCurrency(incomeTotal, currency)} | Expenses ${formatCurrency(
      expenseTotal,
      currency,
    )} | Net ${formatCurrency(net, currency)}`,
    14,
    44,
  );

  autoTable(doc, {
    startY: 52,
    head: [["Date", "Category", "Type", "Amount", "Notes"]],
    body: transactions.map((transaction) => [
      formatDate(transaction.date),
      transaction.category,
      transaction.type,
      formatCurrency(transaction.amount, currency),
      transaction.notes ?? "—",
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      1: { cellWidth: 30 },
      4: { cellWidth: 50 },
    },
    headStyles: {
      fillColor: [37, 99, 235],
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 255],
    },
  });

  if (budgets.length > 0) {
    const docWithTable = doc as jsPDF & {
      lastAutoTable?: {
        finalY: number;
      };
    };
    const nextY = (docWithTable.lastAutoTable?.finalY ?? 62) + 10;

    autoTable(doc, {
      startY: nextY,
      head: [["Category", "Limit", "Status"]],
      body: budgets.map((budget) => {
        const spent = transactions
          .filter(
            (transaction) => transaction.category === budget.category && transaction.type === "expense",
          )
          .reduce((total, transaction) => total + transaction.amount, 0);

        const progress = spent / budget.limit;
        const status =
          progress >= 1
            ? "Exceeded"
            : `${Math.round(progress * 100)}% used`;

        return [
          budget.category,
          formatCurrency(budget.limit, currency),
          status,
        ];
      }),
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
  }

  doc.save(`aurora-finance-${timeframe}-report.pdf`);
}


"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Transaction = {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  payerEmail: string | null;
  description: string | null;
  category: string;
  categoryReason: string | null;
  createdAt: string;
};

type SpendingInsights = {
  source: string;
  summary: {
    totalTransactions: number;
    totalSpending: number;
    averageTransaction: number;
    currency: string;
    categoryBreakdown: {
      category: string;
      amount: number;
    }[];
  };
  analysis: {
    summary: string;
    observations: string[];
    recommendations: string[];
    unusualPatterns: string[];
  };
};

type AnomalyAlert = {
  transactionId: string;
  amount: number;
  currency: string;
  type: string;
  severity: string;
  explanation: string;
};

type AnomalyData = {
  totalAnalyzed: number;
  averageTransaction: number;
  alertCount: number;
  alerts: AnomalyAlert[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const CHART_COLORS = [
  "#635bff",
  "#16a085",
  "#f59e0b",
  "#0ea5e9",
  "#e879a9",
  "#8b5cf6",
  "#f97316",
];

const SUGGESTED_QUESTIONS = [
  "How much revenue have I generated?",
  "Which category has the highest spending?",
  "Show my latest transactions.",
  "Summarize my financial performance.",
  "How can I improve my business?",
];

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm";

const navItems = [
  { label: "Overview", href: "#overview", icon: "⌂" },
  { label: "Transactions", href: "#transactions", icon: "⇄" },
  { label: "Insights", href: "#insights", icon: "◈" },
  { label: "Monitoring", href: "#monitoring", icon: "◎" },
  { label: "AI Assistant", href: "#assistant", icon: "✧" },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetching, setFetching] = useState(true);

  const [categorizingId, setCategorizingId] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState("");

  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your PayPilot AI Financial Assistant. I can help you understand your revenue, transactions, categories and business performance. What would you like to know?",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function loadTransactions() {
    try {
      setFetching(true);

      const response = await fetch("/api/transactions", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load transactions");
      }

      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setFetching(false);
    }
  }

  async function loadInsights() {
    try {
      setInsightsLoading(true);
      setInsightsError("");

      const response = await fetch("/api/ai-insights", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load insights");
      }

      const summary = data.summary || data.statistics;

      if (!summary || !data.analysis) {
        throw new Error("Invalid spending insights response.");
      }

      setInsights({
        source: data.source || "Basic Analysis",
        summary: {
          totalTransactions: summary.totalTransactions ?? 0,
          totalSpending: summary.totalSpending ?? 0,
          averageTransaction: summary.averageTransaction ?? 0,
          currency: summary.currency || "USD",
          categoryBreakdown: summary.categoryBreakdown || [],
        },
        analysis: {
          summary: data.analysis.summary || "No summary available.",
          observations: data.analysis.observations || [],
          recommendations: data.analysis.recommendations || [],
          unusualPatterns: data.analysis.unusualPatterns || [],
        },
      });
    } catch (error) {
      setInsightsError(
        error instanceof Error
          ? error.message
          : "Could not load spending insights."
      );
    } finally {
      setInsightsLoading(false);
    }
  }

  async function loadAnomalies() {
    try {
      setAnomalyLoading(true);
      setAnomalyError("");

      const response = await fetch("/api/anomaly-detection", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load anomaly detection");
      }

      setAnomalyData(data);
    } catch (error) {
      setAnomalyError(
        error instanceof Error
          ? error.message
          : "Could not load anomaly detection."
      );
    } finally {
      setAnomalyLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
    loadInsights();
    loadAnomalies();
  }, []);

  async function handlePayment() {
    try {
      setLoading(true);
      setMessage("Connecting to PayPal...");

      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment initialization failed");
      }

      const approvalLink = data.links?.find(
        (link: { rel: string; href: string }) =>
          link.rel === "approve" || link.rel === "payer-action"
      );

      if (!approvalLink) {
        throw new Error("PayPal approval link not found");
      }

      window.location.href = approvalLink.href;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
      setLoading(false);
    }
  }

  async function handleCategorize(orderId: string) {
    const description = window.prompt(
      "Enter merchant name or transaction description:"
    );

    if (!description?.trim()) return;

    try {
      setCategorizingId(orderId);
      setCategoryMessage("Analyzing transaction...");

      const response = await fetch("/api/ai-categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "AI categorization failed");
      }

      setCategoryMessage(
        `${data.source || "AI"} categorized this transaction as ${data.category} with ${data.confidence ?? "unknown"}% confidence.`
      );

      await loadTransactions();
      await loadInsights();
      await loadAnomalies();
    } catch (error) {
      setCategoryMessage(
        error instanceof Error
          ? error.message
          : "AI categorization failed"
      );
    } finally {
      setCategorizingId(null);
    }
  }

  async function handleChatSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const question = chatInput.trim();

    if (!question || chatLoading) return;

    setChatMessages((previous) => [
      ...previous,
      { role: "user", content: question },
    ]);

    setChatInput("");
    setChatLoading(true);
    setChatError("");

    try {
      const response = await fetch("/api/financial-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          conversationHistory: chatMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to get an answer.");
      }

      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer || "I couldn't generate an answer.",
        },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setChatLoading(false);
    }
  }

  function askSuggestedQuestion(question: string) {
    if (chatLoading) return;
    setChatInput(question);
  }

  function clearChat() {
    if (chatLoading) return;

    setChatMessages([
      {
        role: "assistant",
        content:
          "Hello again! I'm ready to help you understand your business finances. What would you like to know?",
      },
    ]);

    setChatError("");
    setChatInput("");
  }

  const completedTransactions = transactions.filter(
    (transaction) => transaction.status === "COMPLETED"
  );

  const totalVolumeUSD = completedTransactions
    .filter((transaction) => transaction.currency === "USD")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};

    transactions
      .filter(
        (transaction) =>
          transaction.status === "COMPLETED" &&
          transaction.currency === "USD"
      )
      .forEach((transaction) => {
        const date = new Date(transaction.createdAt);

        const month = date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });

        months[month] = (months[month] || 0) + transaction.amount;
      });

    return Object.entries(months).map(([month, amount]) => ({
      month,
      amount: Number(amount.toFixed(2)),
    }));
  }, [transactions]);

  function formatMoney(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
      }).format(amount);
    } catch {
      return `${currency || "USD"} ${amount.toFixed(2)}`;
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  const currency = insights?.summary.currency || "USD";

  const successfulRate =
    transactions.length > 0
      ? Math.round((completedTransactions.length / transactions.length) * 100)
      : 0;

  const sectionHeading =
    "text-lg font-bold tracking-tight text-slate-900";

  const smallLabel =
    "text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400";

  const buttonClass =
    "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
        <a href="#overview" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#635bff] text-lg font-bold text-white">
            P
          </div>
          <span className="text-lg font-bold tracking-tight">
            PayPilot <span className="text-[#635bff]">AI</span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? "Close" : "☰"}
        </button>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } fixed inset-x-0 top-[65px] z-30 max-h-[calc(100vh-65px)] overflow-y-auto border-b border-slate-200 bg-white p-5 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[250px] lg:shrink-0 lg:border-b-0 lg:border-r lg:p-6`}
        >
          <a href="#overview" className="hidden items-center gap-3 lg:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff] text-xl font-bold text-white shadow-sm">
              P
            </div>
            <span className="text-xl font-bold tracking-tight">
              PayPilot <span className="text-[#635bff]">AI</span>
            </span>
          </a>

          <div className="mt-8">
            <p className={smallLabel}>Workspace</p>

            <nav className="mt-3 space-y-1">
              {navItems.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                    index === 0
                      ? "bg-[#635bff]/[0.08] text-[#635bff]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center text-lg">
                    {item.icon}
                  </span>
                  {item.label}
                  {index === 4 && (
                    <span className="ml-auto rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      AI
                    </span>
                  )}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-9">
            <p className={smallLabel}>Payment platform</p>
            <div className="mt-3 rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700">
                  P
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">PayPal</p>
                  <p className="text-xs text-slate-400">Sandbox connection</p>
                </div>
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">Environment</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  SANDBOX
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-[#17172b] p-4 text-white">
            <div className="flex items-center gap-2">
              <span className="text-[#a5a0ff]">✦</span>
              <p className="text-sm font-bold">PayPilot Intelligence</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Turn payment activity into useful business insights.
            </p>
            <a
              href="#assistant"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 inline-flex text-xs font-bold text-[#b6b1ff] hover:text-white"
            >
              Ask your AI assistant →
            </a>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                A
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">
                  PayPilot Admin
                </p>
                <p className="text-xs text-slate-400">Business workspace</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main dashboard */}
        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="hidden h-[73px] items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex xl:px-10">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Business dashboard
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Your payment activity at a glance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Sandbox Mode
              </span>

              <button
                onClick={() => {
                  loadTransactions();
                  loadInsights();
                  loadAnomalies();
                }}
                className={buttonClass}
              >
                ↻ Refresh data
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            {/* Page heading */}
            <section
              id="overview"
              className="scroll-mt-24 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
            >
              <div>
                <p className={smallLabel}>Overview</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-[34px]">
                  Good to see you.
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                  Here's what's happening with your business payments.
                  Monitor transactions, explore insights and make informed
                  decisions.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-600">
                  Dashboard connected
                </span>
              </div>
            </section>

            {/* KPI cards */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={`${cardClass} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Total transactions
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-lg text-[#635bff]">
                    ⇄
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {fetching ? "..." : transactions.length}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  All recorded payment attempts
                </p>
              </div>

              <div className={`${cardClass} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Payment volume
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
                    $
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {fetching ? "..." : formatMoney(totalVolumeUSD, "USD")}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Completed USD payments
                </p>
              </div>

              <div className={`${cardClass} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Successful payments
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                    ✓
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {fetching ? "..." : completedTransactions.length}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Completed transactions
                </p>
              </div>

              <div className={`${cardClass} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Success rate
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-600">
                    %
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {fetching ? "..." : `${successfulRate}%`}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Based on recorded transactions
                </p>
              </div>
            </section>

            {/* Payment action */}
            <section className="mt-6 overflow-hidden rounded-2xl bg-[#17172b] shadow-sm">
              <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#c5c1ff]">
                      PayPal integration
                    </span>
                    <span className="text-xs text-slate-400">
                      Sandbox checkout
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
                    Test a payment
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                    Create a $5.00 USD PayPal Sandbox order and test the
                    checkout flow. No real money will be charged.
                  </p>

                  {message && (
                    <p className="mt-3 text-sm text-amber-300">{message}</p>
                  )}
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="rounded-xl bg-[#635bff] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:bg-[#766fff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Connecting..." : "Pay $5.00 with PayPal →"}
                </button>
              </div>
            </section>

            {/* Insights */}
            <section
              id="insights"
              className={`${cardClass} mt-8 scroll-mt-24 p-5 sm:p-7`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className={smallLabel}>Financial intelligence</p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                    AI financial insights
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Understand your payment activity and category performance.
                  </p>
                </div>

                <button
                  onClick={loadInsights}
                  disabled={insightsLoading}
                  className={buttonClass}
                >
                  {insightsLoading ? "Analyzing..." : "↻ Refresh insights"}
                </button>
              </div>

              {insightsLoading && !insights && (
                <p className="mt-7 text-sm text-violet-600">
                  Loading financial insights...
                </p>
              )}

              {insightsError && (
                <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {insightsError}
                </p>
              )}

              {insights && (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                      Source: {insights.source}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {currency}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-xs font-medium text-slate-500">
                        Total payment volume
                      </p>
                      <p className="mt-3 text-xl font-bold text-slate-900">
                        {formatMoney(
                          insights.summary.totalSpending,
                          currency
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-xs font-medium text-slate-500">
                        Average payment
                      </p>
                      <p className="mt-3 text-xl font-bold text-slate-900">
                        {formatMoney(
                          insights.summary.averageTransaction,
                          currency
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-xs font-medium text-slate-500">
                        Transactions analyzed
                      </p>
                      <p className="mt-3 text-xl font-bold text-slate-900">
                        {insights.summary.totalTransactions}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 p-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-violet-600">✦</span>
                      <h3 className="text-sm font-bold text-violet-900">
                        AI financial summary
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                      {insights.analysis.summary}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-5 xl:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-5">
                      <h3 className={sectionHeading}>
                        Category breakdown
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Payment volume by category
                      </p>

                      {insights.summary.categoryBreakdown.length === 0 ? (
                        <p className="mt-7 text-sm text-slate-400">
                          No category data available.
                        </p>
                      ) : (
                        <div className="mt-4 h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={insights.summary.categoryBreakdown}
                                dataKey="amount"
                                nameKey="category"
                                cx="50%"
                                cy="48%"
                                outerRadius={85}
                                innerRadius={48}
                                paddingAngle={3}
                              >
                                {insights.summary.categoryBreakdown.map(
                                  (item, index) => (
                                    <Cell
                                      key={item.category}
                                      fill={
                                        CHART_COLORS[
                                          index % CHART_COLORS.length
                                        ]
                                      }
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip
                                formatter={(value) =>
                                  formatMoney(Number(value ?? 0), currency)
                                }
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5">
                      <h3 className={sectionHeading}>
                        Monthly payment volume
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Completed USD transactions over time
                      </p>

                      {monthlyData.length === 0 ? (
                        <p className="mt-7 text-sm text-slate-400">
                          No completed USD transactions available.
                        </p>
                      ) : (
                        <div className="mt-4 h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyData}
                              margin={{
                                top: 10,
                                right: 5,
                                left: -15,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#edf0f4"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="month"
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                                fontSize={11}
                              />
                              <YAxis
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                                fontSize={11}
                              />
                              <Tooltip
                                formatter={(value) =>
                                  formatMoney(Number(value ?? 0), "USD")
                                }
                              />
                              <Bar
                                dataKey="amount"
                                fill="#635bff"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={48}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 p-5">
                    <h3 className={sectionHeading}>Category performance</h3>

                    {insights.summary.categoryBreakdown.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-400">
                        No category data available.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-5">
                        {insights.summary.categoryBreakdown.map((item) => {
                          const percentage =
                            insights.summary.totalSpending > 0
                              ? (item.amount /
                                  insights.summary.totalSpending) *
                                100
                              : 0;

                          return (
                            <div key={item.category}>
                              <div className="mb-2 flex justify-between gap-4 text-sm">
                                <span className="font-semibold text-slate-700">
                                  {item.category}
                                </span>
                                <span className="text-slate-500">
                                  {formatMoney(item.amount, currency)} ·{" "}
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#635bff]"
                                  style={{
                                    width: `${Math.min(percentage, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-5">
                      <h3 className="font-bold text-slate-900">
                        Key observations
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {insights.analysis.observations.length === 0 ? (
                          <li className="text-sm text-slate-400">
                            No observations available.
                          </li>
                        ) : (
                          insights.analysis.observations.map((item, index) => (
                            <li
                              key={index}
                              className="flex gap-3 text-sm leading-relaxed text-slate-600"
                            >
                              <span className="font-bold text-[#635bff]">
                                •
                              </span>
                              {item}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5">
                      <h3 className="font-bold text-slate-900">
                        Business recommendations
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {insights.analysis.recommendations.length === 0 ? (
                          <li className="text-sm text-slate-400">
                            No recommendations available.
                          </li>
                        ) : (
                          insights.analysis.recommendations.map(
                            (item, index) => (
                              <li
                                key={index}
                                className="flex gap-3 text-sm leading-relaxed text-slate-600"
                              >
                                <span className="font-bold text-emerald-600">
                                  ✓
                                </span>
                                {item}
                              </li>
                            )
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
                    <h3 className="font-bold text-amber-900">
                      Unusual payment patterns
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {insights.analysis.unusualPatterns.length === 0 ? (
                        <li className="text-sm text-slate-600">
                          No unusual patterns reported.
                        </li>
                      ) : (
                        insights.analysis.unusualPatterns.map(
                          (item, index) => (
                            <li
                              key={index}
                              className="flex gap-3 text-sm leading-relaxed text-slate-700"
                            >
                              <span className="font-bold text-amber-600">
                                !
                              </span>
                              {item}
                            </li>
                          )
                        )
                      )}
                    </ul>
                  </div>
                </>
              )}
            </section>

            {/* Monitoring */}
            <section
              id="monitoring"
              className={`${cardClass} mt-8 scroll-mt-24 p-5 sm:p-7`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className={smallLabel}>Transaction security</p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight">
                    Anomaly monitoring
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Review unusual patterns in recorded payment activity.
                  </p>
                </div>

                <button
                  onClick={loadAnomalies}
                  disabled={anomalyLoading}
                  className={buttonClass}
                >
                  {anomalyLoading ? "Checking..." : "↻ Refresh monitoring"}
                </button>
              </div>

              {anomalyLoading && !anomalyData && (
                <p className="mt-6 text-sm text-amber-700">
                  Analyzing transaction activity...
                </p>
              )}

              {anomalyError && (
                <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {anomalyError}
                </p>
              )}

              {anomalyData && (
                <>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-xs text-slate-500">
                        Transactions analyzed
                      </p>
                      <p className="mt-3 text-2xl font-bold">
                        {anomalyData.totalAnalyzed}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-xs text-slate-500">
                        Average transaction
                      </p>
                      <p className="mt-3 text-2xl font-bold">
                        {formatMoney(anomalyData.averageTransaction, currency)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-xs text-slate-500">
                        Alerts detected
                      </p>
                      <p
                        className={`mt-3 text-2xl font-bold ${
                          anomalyData.alertCount > 0
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {anomalyData.alertCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 p-5">
                    <h3 className={sectionHeading}>Monitoring results</h3>

                    {anomalyData.alerts.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="font-semibold text-emerald-800">
                          ✓ No unusual transaction patterns detected.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                          {anomalyData.totalAnalyzed < 3
                            ? "More completed transactions are needed before reliable unusual-payment comparisons can be made."
                            : "No transactions currently match the configured anomaly detection rules."}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {anomalyData.alerts.map((alert, index) => (
                          <div
                            key={`${alert.transactionId}-${index}`}
                            className="rounded-xl border border-amber-200 bg-amber-50/70 p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="font-bold text-slate-900">
                                {alert.type}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  alert.severity.toLowerCase() === "high"
                                    ? "bg-red-100 text-red-700"
                                    : alert.severity.toLowerCase() === "medium"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {alert.severity} severity
                              </span>
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-slate-700">
                              {alert.explanation}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                              <span>
                                Transaction:{" "}
                                <span className="font-mono text-slate-700">
                                  {alert.transactionId}
                                </span>
                              </span>
                              <span>
                                Amount:{" "}
                                {formatMoney(alert.amount, alert.currency)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-400">
                    These are rule-based monitoring alerts, not definitive
                    fraud detection. Review flagged transactions before taking
                    action.
                  </p>
                </>
              )}
            </section>

            {/* Financial assistant */}
            <section
              id="assistant"
              className={`${cardClass} mt-8 scroll-mt-24 overflow-hidden`}
            >
              <div className="border-b border-slate-200 bg-gradient-to-r from-[#f0efff] via-white to-cyan-50 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className={smallLabel}>PayPilot intelligence</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight">
                      Financial assistant
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Ask questions about your business payment activity.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearChat}
                    disabled={chatLoading}
                    className={buttonClass}
                  >
                    Clear chat
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div
                  className="max-h-[460px] min-h-[230px] space-y-5 overflow-y-auto rounded-xl bg-slate-50 p-4 sm:p-5"
                  aria-live="polite"
                >
                  {chatMessages.map((chat, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        chat.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="max-w-[90%] sm:max-w-[80%]">
                        <p
                          className={`mb-2 text-xs font-bold ${
                            chat.role === "user"
                              ? "text-right text-[#635bff]"
                              : "text-slate-500"
                          }`}
                        >
                          {chat.role === "user" ? "You" : "PayPilot AI"}
                        </p>

                        <div
                          className={`whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                            chat.role === "user"
                              ? "rounded-tr-sm bg-[#635bff] text-white"
                              : "rounded-tl-sm border border-slate-200 bg-white text-slate-700 shadow-sm"
                          }`}
                        >
                          {chat.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        Analyzing your financial data...
                      </div>
                    </div>
                  )}
                </div>

                {chatError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {chatError}
                  </div>
                )}

                <div className="mt-5">
                  <p className={smallLabel}>Suggested questions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => askSuggestedQuestion(question)}
                        disabled={chatLoading}
                        className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-[#635bff]/40 hover:bg-violet-50 hover:text-[#635bff] disabled:opacity-40"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleChatSubmit}
                  className="mt-5 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your business finances..."
                    maxLength={1000}
                    disabled={chatLoading}
                    aria-label="Ask PayPilot AI a financial question"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="rounded-xl bg-[#635bff] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#5148e5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {chatLoading ? "Thinking..." : "Ask AI →"}
                  </button>
                </form>

                <p className="mt-4 text-xs leading-relaxed text-slate-400">
                  Financial analysis is based on available transaction records.
                  Payment volume is not the same as profit. Do not treat AI
                  responses as audited financial statements.
                </p>
              </div>
            </section>

            {/* Transactions */}
            <section
              id="transactions"
              className={`${cardClass} mt-8 scroll-mt-24 p-5 sm:p-7`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className={smallLabel}>Payment activity</p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight">
                    Recent transactions
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Review payments and categorize completed transactions.
                  </p>
                </div>

                <button
                  onClick={loadTransactions}
                  disabled={fetching}
                  className={buttonClass}
                >
                  {fetching ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              {categoryMessage && (
                <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                  {categoryMessage}
                </p>
              )}

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.13em] text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-bold">Order ID</th>
                      <th className="px-4 py-4 font-bold">Amount</th>
                      <th className="px-4 py-4 font-bold">Method</th>
                      <th className="px-4 py-4 font-bold">Category</th>
                      <th className="px-4 py-4 font-bold">Status</th>
                      <th className="px-4 py-4 font-bold">Date</th>
                      <th className="px-4 py-4 font-bold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4 font-mono text-xs text-slate-500">
                          {transaction.orderId}
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-900">
                          {formatMoney(
                            transaction.amount,
                            transaction.currency
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {transaction.paymentMethod || "PayPal"}
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-700">
                            {transaction.category}
                          </span>
                          {transaction.categoryReason && (
                            <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-400">
                              {transaction.categoryReason}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold ${
                              transaction.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-500">
                          {formatDate(transaction.createdAt)}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              handleCategorize(transaction.orderId)
                            }
                            disabled={
                              transaction.status !== "COMPLETED" ||
                              categorizingId !== null
                            }
                            className="whitespace-nowrap rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-[#635bff] transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {categorizingId === transaction.orderId
                              ? "Analyzing..."
                              : "AI Categorize"}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!fetching && transactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-sm text-slate-400"
                        >
                          No transactions found yet.
                        </td>
                      </tr>
                    )}

                    {fetching && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-sm text-slate-500"
                        >
                          Loading transactions...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row sm:items-center">
              <p>
                © 2026 PayPilot AI. Intelligent payment analytics for
                businesses.
              </p>
              <p>Built with Next.js · Prisma · PayPal · AI</p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

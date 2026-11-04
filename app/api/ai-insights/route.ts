
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../../lib/prisma";

// Cache Gemini results in server memory
let cachedAnalysis: {
    key: string;
    analysis: {
        summary: string;
        observations: string[];
        recommendations: string[];
        unusualPatterns: string[];
    };
    expiresAt: number;
} | null = null;

// Prevent repeated Gemini calls after rate-limit/server errors
let geminiRetryAfter = 0;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RETRY_DELAY = 30 * 1000; // 30 seconds

export async function GET() {
    try {
        // Get completed transactions
        const transactions = await prisma.transaction.findMany({
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "desc" },
        });

        // Calculate total spending
        const totalSpending = transactions.reduce(
            (sum, t) => sum + t.amount,
            0
        );

        // Calculate category totals
        const categoryTotals: Record<string, number> = {};

        for (const transaction of transactions) {
            const category = transaction.category || "Other";

            categoryTotals[category] =
                (categoryTotals[category] || 0) + transaction.amount;
        }

        // Prepare category breakdown
        const categoryBreakdown = Object.entries(categoryTotals)
            .map(([category, amount]) => ({
                category,
                amount: Number(amount.toFixed(2)),
            }))
            .sort((a, b) => b.amount - a.amount);

        // Prepare statistics
        const statistics = {
            totalTransactions: transactions.length,
            totalSpending: Number(totalSpending.toFixed(2)),
            averageTransaction:
                transactions.length > 0
                    ? Number(
                        (totalSpending / transactions.length).toFixed(2)
                    )
                    : 0,
            currency: transactions[0]?.currency || "USD",
            categoryBreakdown,
        };

        // Basic analysis without Gemini
        const fallbackAnalysis = {
            summary: `You have ${statistics.totalTransactions} completed transaction(s), totaling ${statistics.currency} ${statistics.totalSpending.toFixed(2)}.`,
            observations:
                categoryBreakdown.length > 0
                    ?[
    `Your highest payment-volume category is ${categoryBreakdown[0].category}.`,
    `Your average transaction amount is ${statistics.currency} ${statistics.averageTransaction.toFixed(2)}.`,
]
                    : ["No completed spending data is available yet."],
            recommendations: [
    "Continue recording transactions to build a reliable picture of your payment activity.",
    "Review your category breakdown regularly to understand how payment volume is distributed across categories.",
],
            unusualPatterns: [
                "There is not enough transaction history to reliably identify unusual spending patterns.",
            ],
        };

        // Create a cache key from current statistics
        const cacheKey = JSON.stringify(statistics);

        // Return cached Gemini analysis if still valid
        if (
            cachedAnalysis &&
            cachedAnalysis.key === cacheKey &&
            cachedAnalysis.expiresAt > Date.now()
        ) {
            return NextResponse.json({
                success: true,
                source: "Gemini AI (Cached)",
                statistics,
                summary: statistics,
                analysis: cachedAnalysis.analysis,
            });
        }

        // Respect retry delay after Gemini errors
        if (Date.now() < geminiRetryAfter) {
            return NextResponse.json({
                success: true,
                source: "Basic Analysis Fallback",
                statistics,
                summary: statistics,
                analysis: fallbackAnalysis,
            });
        }

        // Try Gemini while preserving fallback functionality
        try {
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("Gemini API key is not configured.");
            }

            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: `
You are PayPilot AI, a financial insights assistant.

Analyze these payment statistics:
${JSON.stringify(statistics)}

Return:
1. A short spending summary.
2. Important observations.
3. Practical saving recommendations.
4. Potential unusual spending patterns, if supported by the data.

Rules:
- Use only supplied statistics.
- Never invent transactions.
- Clearly mention when there is insufficient data.
- Do not claim fraud based only on category or amount.
- Keep the analysis concise.
`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            summary: { type: "STRING" },
                            observations: {
                                type: "ARRAY",
                                items: { type: "STRING" },
                            },
                            recommendations: {
                                type: "ARRAY",
                                items: { type: "STRING" },
                            },
                            unusualPatterns: {
                                type: "ARRAY",
                                items: { type: "STRING" },
                            },
                        },
                        required: [
                            "summary",
                            "observations",
                            "recommendations",
                            "unusualPatterns",
                        ],
                    },
                },
            });

            if (!response.text) {
                throw new Error("Gemini returned an empty response.");
            }

            const analysis = JSON.parse(response.text);

            // Validate Gemini response
            if (
                typeof analysis.summary !== "string" ||
                !Array.isArray(analysis.observations) ||
                !Array.isArray(analysis.recommendations) ||
                !Array.isArray(analysis.unusualPatterns) ||
                !analysis.observations.every(
                    (item: unknown) => typeof item === "string"
                ) ||
                !analysis.recommendations.every(
                    (item: unknown) => typeof item === "string"
                ) ||
                !analysis.unusualPatterns.every(
                    (item: unknown) => typeof item === "string"
                )
            ) {
                throw new Error("Invalid Gemini response format.");
            }

            // Save successful result in cache
            cachedAnalysis = {
                key: cacheKey,
                analysis,
                expiresAt: Date.now() + CACHE_DURATION,
            };

            // Clear retry delay after success
            geminiRetryAfter = 0;

            return NextResponse.json({
                success: true,
                source: "Gemini AI",
                statistics,
                summary: statistics,
                analysis,
            });

        } catch (aiError) {
            // Avoid repeatedly calling Gemini after errors
            geminiRetryAfter = Date.now() + RETRY_DELAY;

            console.warn(
                "Gemini temporarily unavailable. Using basic insights."
            );

            return NextResponse.json({
                success: true,
                source: "Basic Analysis Fallback",
                statistics,
                summary: statistics,
                analysis: fallbackAnalysis,
            });
        }

    } catch (error) {
        console.error("AI Insights API Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Could not generate spending insights.",
            },
            { status: 500 }
        );
    }
}

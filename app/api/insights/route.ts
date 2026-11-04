
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                status: "COMPLETED",
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const totalTransactions = transactions.length;

        const totalSpending = transactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            0
        );

        const averageTransaction =
            totalTransactions > 0
                ? totalSpending / totalTransactions
                : 0;

        const categoryTotals: Record<string, number> = {};

        for (const transaction of transactions) {
            const category = transaction.category || "Other";

            categoryTotals[category] =
                (categoryTotals[category] || 0) + transaction.amount;
        }

        const categoryBreakdown = Object.entries(categoryTotals)
            .map(([category, amount]) => ({
                category,
                amount: Number(amount.toFixed(2)),
            }))
            .sort((a, b) => b.amount - a.amount);

        const topCategory =
            categoryBreakdown.length > 0
                ? categoryBreakdown[0]
                : null;

        return NextResponse.json({
            success: true,
            currency: transactions[0]?.currency || "USD",
            summary: {
                totalTransactions,
                totalSpending: Number(totalSpending.toFixed(2)),
                averageTransaction: Number(
                    averageTransaction.toFixed(2)
                ),
                topCategory,
            },
            categoryBreakdown,
            transactions,
        });
    } catch (error) {
        console.error("Spending Insights Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Could not generate spending insights.",
            },
            { status: 500 }
        );
    }
}

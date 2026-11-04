import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

        const alerts = [];

        if (transactions.length === 0) {
            return NextResponse.json({
                success: true,
                totalAnalyzed: 0,
                alerts: [],
                message: "No completed transactions available for analysis.",
            });
        }

        // Calculate average transaction amount
        const amounts = transactions.map((t) => t.amount);
        const average =
            amounts.reduce((sum, amount) => sum + amount, 0) /
            amounts.length;

        // Detect unusually large transactions
        for (const transaction of transactions) {
            if (
                transactions.length >= 3 &&
                transaction.amount > average * 2
            ) {
                alerts.push({
                    transactionId: transaction.orderId,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    type: "UNUSUALLY_LARGE_PAYMENT",
                    severity: "HIGH",
                    explanation:
                        "This payment is more than twice your average transaction amount.",
                });
            }
        }

        // Detect repeated payments with the same amount
        const amountCounts = new Map<number, number>();

        for (const transaction of transactions) {
            amountCounts.set(
                transaction.amount,
                (amountCounts.get(transaction.amount) || 0) + 1
            );
        }

        for (const transaction of transactions) {
            if (
                amountCounts.get(transaction.amount)! >= 3 &&
                !alerts.some(
                    (alert) =>
                        alert.transactionId === transaction.orderId
                )
            ) {
                alerts.push({
                    transactionId: transaction.orderId,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    type: "REPEATED_PAYMENT_AMOUNT",
                    severity: "MEDIUM",
                    explanation:
                        "Three or more completed transactions have the same amount. Review them to ensure they are expected.",
                });
            }
        }

        return NextResponse.json({
            success: true,
            totalAnalyzed: transactions.length,
            averageTransaction: Number(average.toFixed(2)),
            alertCount: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error("Anomaly detection error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to analyze transactions.",
            },
            { status: 500 }
        );
    }
}
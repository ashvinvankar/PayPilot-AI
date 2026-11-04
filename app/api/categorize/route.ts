
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

function categorizeTransaction(description: string, amount: number) {
    const text = description.toLowerCase();

    if (/restaurant|food|grocery|cafe|pizza|burger|swiggy|zomato/.test(text)) {
        return {
            category: "Food",
            reason: "Transaction description matches food or grocery-related keywords.",
        };
    }

    if (/amazon|shopping|clothing|fashion|flipkart|store|purchase/.test(text)) {
        return {
            category: "Shopping",
            reason: "Transaction description matches shopping-related keywords.",
        };
    }

    if (/course|education|school|college|university|book|tuition/.test(text)) {
        return {
            category: "Education",
            reason: "Transaction description matches education-related keywords.",
        };
    }

    if (/flight|hotel|travel|train|uber|ola|taxi/.test(text)) {
        return {
            category: "Travel",
            reason: "Transaction description matches travel-related keywords.",
        };
    }

    if (/movie|music|netflix|spotify|game|entertainment/.test(text)) {
        return {
            category: "Entertainment",
            reason: "Transaction description matches entertainment-related keywords.",
        };
    }

    if (amount >= 1000) {
        return {
            category: "Large Expense",
            reason: "Transaction amount is at least 1000.",
        };
    }

    return {
        category: "Other",
        reason: "No specific category matched the transaction description.",
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const orderId = body.orderId;

        if (!orderId || typeof orderId !== "string") {
            return NextResponse.json(
                { success: false, message: "A valid orderId is required." },
                { status: 400 }
            );
        }

        const transaction = await prisma.transaction.findUnique({
            where: { orderId },
        });

        if (!transaction) {
            return NextResponse.json(
                { success: false, message: "Transaction not found." },
                { status: 404 }
            );
        }

        if (transaction.status !== "COMPLETED") {
            return NextResponse.json(
                { success: false, message: "Only completed transactions can be categorized." },
                { status: 400 }
            );
        }

        const description =
            transaction.description || transaction.paymentMethod || "Unknown payment";

        const result = categorizeTransaction(description, transaction.amount);

        const updatedTransaction = await prisma.transaction.update({
            where: { orderId },
            data: {
                category: result.category,
                categoryReason: result.reason,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Transaction categorized successfully.",
            transaction: updatedTransaction,
        });
    } catch (error) {
        console.error("Categorization Error:", error);

        return NextResponse.json(
            { success: false, message: "Could not categorize transaction." },
            { status: 500 }
        );
    }
}

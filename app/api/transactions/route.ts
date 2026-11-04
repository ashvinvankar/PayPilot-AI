
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        return NextResponse.json({
            success: true,
            count: transactions.length,
            transactions,
        });
    } catch (error) {
        console.error("Transaction Fetch Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Could not fetch transactions",
            },
            { status: 500 }
        );
    }
}

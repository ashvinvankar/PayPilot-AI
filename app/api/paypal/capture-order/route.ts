
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
    try {
        const { orderID } = await request.json();

        if (!orderID) {
            return NextResponse.json(
                { success: false, message: "Order ID is required" },
                { status: 400 }
            );
        }

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const baseUrl = process.env.PAYPAL_BASE_URL;

        if (!clientId || !clientSecret || !baseUrl) {
            throw new Error("PayPal credentials are missing");
        }

        // Step 1: Get PayPal access token
        const auth = Buffer.from(
            `${clientId}:${clientSecret}`
        ).toString("base64");

        const tokenResponse = await fetch(
            `${baseUrl}/v1/oauth2/token`,
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "grant_type=client_credentials",
                cache: "no-store",
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error("PayPal authentication failed");
        }

        const headers = {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
        };

        // Step 2: Check the existing PayPal order
        const orderResponse = await fetch(
            `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderID)}`,
            {
                method: "GET",
                headers,
                cache: "no-store",
            }
        );

        let paymentData = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(
                paymentData.message || "Could not retrieve PayPal order"
            );
        }

        // Step 3: Capture only if not already completed
        if (paymentData.status !== "COMPLETED") {
            if (paymentData.status !== "APPROVED") {
                return NextResponse.json({
                    success: false,
                    status: paymentData.status,
                    message: "PayPal order is not approved yet.",
                }, { status: 400 });
            }

            const captureResponse = await fetch(
                `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({}),
                    cache: "no-store",
                }
            );

            paymentData = await captureResponse.json();

            if (!captureResponse.ok) {
                console.error("PayPal Capture Details:", paymentData);

                throw new Error(
                    paymentData.details?.[0]?.description ||
                    paymentData.message ||
                    "Payment capture failed"
                );
            }
        }

        // Step 4: Verify completed payment
        if (paymentData.status !== "COMPLETED") {
            return NextResponse.json({
                success: false,
                status: paymentData.status,
                message: "Payment is not completed.",
            }, { status: 400 });
        }

        const purchaseUnit = paymentData.purchase_units?.[0];
        const paymentCapture = purchaseUnit?.payments?.captures?.[0];

        const amountValue =
            paymentCapture?.amount?.value ??
            purchaseUnit?.amount?.value;

        const currency =
            paymentCapture?.amount?.currency_code ??
            purchaseUnit?.amount?.currency_code ??
            "USD";

        if (!amountValue) {
            throw new Error("Payment amount not found");
        }

        // Step 5: Save transaction in SQLite
        const transaction = await prisma.transaction.upsert({
            where: { orderId: orderID },
            update: {
                status: "COMPLETED",
                amount: Number(amountValue),
                currency,
            },
            create: {
                orderId: orderID,
                amount: Number(amountValue),
                currency,
                status: "COMPLETED",
                paymentMethod: "PayPal",
                payerEmail: paymentData.payer?.email_address ?? null,
            },
        });

        return NextResponse.json({
            success: true,
            status: "COMPLETED",
            message: "Payment successfully saved.",
            transaction,
        });

    } catch (error) {
        console.error("PayPal Capture Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Payment processing failed",
            },
            { status: 500 }
        );
    }
}

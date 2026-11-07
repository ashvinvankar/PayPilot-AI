
import { NextResponse } from "next/server";

export async function POST() {
    try {
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
            console.error("PayPal Authentication Error:", tokenData);
            throw new Error("PayPal authentication failed");
        }

        // Step 2: Create PayPal order
        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://paypiloter.netlify.app";

        const orderResponse = await fetch(
            `${baseUrl}/v2/checkout/orders`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    intent: "CAPTURE",

                    purchase_units: [
                        {
                            amount: {
                                currency_code: "USD",
                                value: "5.00",
                            },
                        },
                    ],

                    payment_source: {
                        paypal: {
                            experience_context: {
                                brand_name: "PayPilot AI",
                                user_action: "PAY_NOW",
                                return_url: `${appUrl}/payment/success`,
                                cancel_url: `${appUrl}/payment/cancel`,
                            },
                        },
                    },
                }),
                cache: "no-store",
            }
        );

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            console.error("PayPal API Details:", orderData);

            throw new Error(
                orderData.details?.[0]?.description ||
                orderData.message ||
                "Could not create PayPal order"
            );
        }

        return NextResponse.json({
            success: true,
            orderId: orderData.id,
            links: orderData.links,
        });

    } catch (error) {
        console.error("PayPal Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Payment order creation failed",
            },
            { status: 500 }
        );
    }
}

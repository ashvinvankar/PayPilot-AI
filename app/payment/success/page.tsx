
"use client";

import { useEffect, useRef, useState } from "react";

export default function PaymentSuccess() {
    const [message, setMessage] = useState("Verifying your payment...");
    const [status, setStatus] = useState("PROCESSING");
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        async function capturePayment() {
            try {
                const orderID = new URLSearchParams(
                    window.location.search
                ).get("token");

                if (!orderID) {
                    throw new Error("PayPal order ID is missing");
                }

                const response = await fetch(
                    "/api/paypal/capture-order",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ orderID }),
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Payment capture failed"
                    );
                }

                setStatus(data.status);
                setMessage(
                    data.status === "COMPLETED"
                        ? "Your payment was successful!"
                        : `Payment status: ${data.status}`
                );
            } catch (error) {
                setStatus("FAILED");
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Something went wrong"
                );
            }
        }

        capturePayment();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                <h1 className="text-3xl font-bold">
                    PayPilot <span className="text-blue-400">AI</span>
                </h1>

                <h2 className="mt-8 text-2xl font-semibold">
                    {status === "COMPLETED"
                        ? "Payment Successful!"
                        : status === "FAILED"
                        ? "Payment Not Completed"
                        : "Processing Payment..."}
                </h2>

                <p className="mt-4 text-slate-300">{message}</p>

                <p className="mt-6 text-sm text-slate-500">
                    Payment status: {status}
                </p>

                <a
                    href="/"
                    className="inline-block mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                >
                    Back to Dashboard
                </a>
            </div>
        </main>
    );
}

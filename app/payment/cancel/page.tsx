
export default function PaymentCancel() {
    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                <h1 className="text-3xl font-bold">
                    PayPilot <span className="text-blue-400">AI</span>
                </h1>

                <h2 className="mt-8 text-2xl font-semibold">
                    Payment Cancelled
                </h2>

                <p className="mt-4 text-slate-400">
                    Your payment was cancelled. No payment has been confirmed.
                </p>

                <a
                    href="/"
                    className="inline-block mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                >
                    Return to Dashboard
                </a>
            </div>
        </main>
    );
}

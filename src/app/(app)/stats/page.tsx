export default function StatsPage() {
    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-2xl font-bold text-white mb-6">Stats</h1>

                <div className="grid gap-4">
                    {/* Placeholder stat cards */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">Avg Time-to-Start</h3>
                        <p className="text-3xl font-bold text-white">--</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">Completion Rate (7d)</h3>
                        <p className="text-3xl font-bold text-white">--</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">Overrun Rate</h3>
                        <p className="text-3xl font-bold text-white">--</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">Best Execution Hour</h3>
                        <p className="text-3xl font-bold text-white">--</p>
                    </div>
                </div>

                <a
                    href="/now"
                    className="mt-6 inline-block rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                >
                    ← Back to Now
                </a>
            </div>
        </div>
    )
}

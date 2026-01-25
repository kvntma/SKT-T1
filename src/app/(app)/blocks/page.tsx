export default function BlocksPage() {
    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-2xl font-bold text-white mb-6">Blocks</h1>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <p className="text-zinc-400 text-center">
                        Block management coming soon.
                    </p>
                    <p className="text-zinc-500 text-sm text-center mt-2">
                        For now, blocks will sync from your calendar.
                    </p>
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

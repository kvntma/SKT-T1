'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ResolveModalProps {
    onDone: () => void
    onSkipped: () => void
    onCancel: () => void
}

export function ResolveModal({ onDone, onSkipped, onCancel }: ResolveModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-sm mx-4 border-zinc-700 bg-zinc-900">
                <CardHeader>
                    <CardTitle className="text-lg">Resolve Block</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <Button className="w-full bg-emerald-600" onClick={onDone}>
                        I completed it
                    </Button>
                    <Button variant="outline" className="w-full" onClick={onSkipped}>
                        I skipped it
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={onCancel}>
                        Cancel
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

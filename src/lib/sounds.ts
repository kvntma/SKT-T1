/**
 * Play a gentle bell/chime notification sound using Web Audio API.
 * No external audio files needed.
 */
export function playBellSound(volume: number = 0.5) {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

        // Create a pleasant two-tone bell chime
        const playTone = (frequency: number, startTime: number, duration: number) => {
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(frequency, startTime)

            // Bell-like envelope: quick attack, gradual decay
            gainNode.gain.setValueAtTime(0, startTime)
            gainNode.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.02)
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

            oscillator.start(startTime)
            oscillator.stop(startTime + duration)
        }

        const now = ctx.currentTime

        // Two-note chime (E5 → G5) — pleasant and non-jarring
        playTone(659.25, now, 0.4)       // E5
        playTone(783.99, now + 0.15, 0.5) // G5

        // Add a subtle harmonic overtone for richness
        playTone(1318.5, now, 0.2)       // E6 (octave above, quieter)

        // Clean up context after sounds finish
        setTimeout(() => ctx.close(), 1500)
    } catch {
        // Silently fail if audio is not available
        console.warn('Could not play notification sound')
    }
}

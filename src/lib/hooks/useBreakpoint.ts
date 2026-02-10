'use client'

import { useState, useEffect } from 'react'

export function useBreakpoint() {
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [isDesktop, setIsDesktop] = useState<boolean>(true)

    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 767px)')
        
        const handleResize = () => {
            setIsMobile(mobileQuery.matches)
            setIsDesktop(!mobileQuery.matches)
        }

        // Set initial value
        handleResize()

        // Listen for changes
        mobileQuery.addEventListener('change', handleResize)
        
        return () => mobileQuery.removeEventListener('change', handleResize)
    }, [])

    return { isMobile, isDesktop }
}

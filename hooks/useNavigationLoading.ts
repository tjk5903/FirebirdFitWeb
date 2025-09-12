import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { loadingManager } from '@/lib/loadingManager'

// Hook to manage navigation loading states
export function useNavigationLoading() {
  const pathname = usePathname()

  useEffect(() => {
    // Set navigation loading when pathname changes
    loadingManager.setNavigationLoading(true)
    
    // Clear navigation loading after a short delay
    const timer = setTimeout(() => {
      loadingManager.setNavigationLoading(false)
    }, 100) // Very short delay to prevent flash

    return () => clearTimeout(timer)
  }, [pathname])

  return {
    isNavigationLoading: loadingManager.isNavigationLoading()
  }
}

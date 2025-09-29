// Global loading state manager to prevent stuck loading screens
class LoadingManager {
  private loadingStates = new Set<string>()
  private timeouts = new Map<string, NodeJS.Timeout>()
  private navigationLoading = false
  private subscribers = new Set<(key: string, isLoading: boolean) => void>()

  // Start loading with automatic timeout
  startLoading(key: string, timeoutMs: number = 10000) {
    this.loadingStates.add(key)
    
    // Clear any existing timeout for this key
    const existingTimeout = this.timeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      console.warn(`Loading timeout for ${key} - forcing stop`)
      this.stopLoading(key)
    }, timeoutMs)
    
    this.timeouts.set(key, timeout)
    
    // Notify subscribers
    this.notifySubscribers(key, true)
  }

  // Stop loading
  stopLoading(key: string) {
    this.loadingStates.delete(key)
    
    const timeout = this.timeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(key)
    }
    
    // Notify subscribers
    this.notifySubscribers(key, false)
  }

  // Check if loading
  isLoading(key: string): boolean {
    return this.loadingStates.has(key)
  }

  // Navigation loading state
  setNavigationLoading(loading: boolean) {
    this.navigationLoading = loading
  }

  isNavigationLoading(): boolean {
    return this.navigationLoading
  }

  // Get all loading states
  getAllLoadingStates(): string[] {
    return Array.from(this.loadingStates)
  }

  // Clear all loading states
  clearAll() {
    this.loadingStates.clear()
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()
    this.navigationLoading = false
  }

  // Subscribe to loading state changes
  subscribe(callback: (key: string, isLoading: boolean) => void) {
    this.subscribers.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  // Unsubscribe from loading state changes
  unsubscribe(callback: (key: string, isLoading: boolean) => void) {
    this.subscribers.delete(callback)
  }

  // Notify all subscribers
  private notifySubscribers(key: string, isLoading: boolean) {
    this.subscribers.forEach(callback => {
      try {
        callback(key, isLoading)
      } catch (error) {
        console.error('Error in loading state subscriber:', error)
      }
    })
  }
}

export const loadingManager = new LoadingManager()

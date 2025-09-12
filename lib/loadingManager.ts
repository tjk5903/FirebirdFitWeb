// Global loading state manager to prevent stuck loading screens
class LoadingManager {
  private loadingStates = new Set<string>()
  private timeouts = new Map<string, NodeJS.Timeout>()

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
  }

  // Stop loading
  stopLoading(key: string) {
    this.loadingStates.delete(key)
    
    const timeout = this.timeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(key)
    }
  }

  // Check if loading
  isLoading(key: string): boolean {
    return this.loadingStates.has(key)
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
  }
}

export const loadingManager = new LoadingManager()

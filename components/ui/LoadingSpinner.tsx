export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-white" data-testid="loading-spinner">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-blue"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
} 
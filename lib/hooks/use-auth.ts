import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface User {
  id: string
  email: string
  name: string
}

interface AuthResponse {
  user: User | null
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          // If the request fails, return null user instead of throwing
          return { user: null }
        }
        return response.json()
      } catch (error) {
        // On any error, return null user
        console.error("Auth check error:", error)
        return { user: null }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error
    refetchOnWindowFocus: false,
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (!response.ok) {
        throw new Error("Failed to logout")
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch auth query
      queryClient.setQueryData(["auth", "me"], { user: null })
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })

  return {
    user: data?.user ?? null,
    isLoading,
    error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}

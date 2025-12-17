import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Admin check hook (already exists, but let's ensure it uses React Query)
export function useAdminCheck() {
  return useQuery<{ isAdmin: boolean }>({
    queryKey: ["admin", "check"],
    queryFn: async () => {
      const response = await fetch("/api/admin/check")
      if (!response.ok) {
        throw new Error("Failed to check admin status")
      }
      return response.json()
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Wrapper hook for backward compatibility
export function useAdmin() {
  const { data, isLoading } = useAdminCheck()
  return {
    isAdmin: data?.isAdmin ?? false,
    isLoading,
  }
}

// Compatibility Types hooks
export function useCompatibilityTypes() {
  return useQuery<Array<{ id: number; name: string; description: string }>>({
    queryKey: ["admin", "compatibility-types"],
    queryFn: async () => {
      const response = await fetch("/api/admin/compatibility-types")
      if (!response.ok) {
        throw new Error("Failed to fetch compatibility types")
      }
      const data = await response.json()
      // API returns { types: [...] }, so extract the types array
      return data.types || []
    },
  })
}

export function useCreateCompatibilityType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch("/api/admin/compatibility-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create compatibility type")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "compatibility-types"] })
    },
  })
}

export function useUpdateCompatibilityType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, description }: { id: number; name: string; description: string }) => {
      const response = await fetch("/api/admin/compatibility-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, name, description }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update compatibility type")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "compatibility-types"] })
    },
  })
}

export function useDeleteCompatibilityType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/compatibility-types?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete compatibility type")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "compatibility-types"] })
    },
  })
}

// Compatibility Data hooks
export function useCompatibilityData(typeId?: number) {
  return useQuery<Array<any>>({
    queryKey: ["admin", "compatibility-data", typeId],
    queryFn: async () => {
      const url = typeId
        ? `/api/admin/compatibility-data?compatibilityType=${typeId}`
        : "/api/admin/compatibility-data"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch compatibility data")
      }
      const data = await response.json()
      // API returns { data: [...], grouped: {...} }, so extract the data array
      return data.data || []
    },
  })
}

export function useCreateCompatibilityData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/compatibility-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create compatibility data")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "compatibility-data"] })
    },
  })
}

export function useUpdateCompatibilityData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const response = await fetch("/api/admin/compatibility-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update compatibility data")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "compatibility-data"] })
    },
  })
}

export function useDeleteCompatibilityData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/compatibility-data?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete compatibility data")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "compatibility-data"] })
    },
  })
}

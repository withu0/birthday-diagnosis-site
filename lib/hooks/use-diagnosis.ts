import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface DiagnosisResult {
  essential: string
  essential_lb: string
  attractive: string
  attractive_lb: string
  valuable: string
  valuable_lb: string
  problem: string
  problem_lb: string
  [key: string]: any // For additional fields
}

export interface DiagnosisLogEntry {
  id: string
  name: string
  birthDate: string
  createdAt: string
}

// Hook for fetching basic diagnosis
export function useBasicDiagnosis(birthDate: string | null, enabled: boolean = false) {
  return useQuery<DiagnosisResult>({
    queryKey: ["diagnosis", "basic", birthDate],
    queryFn: async () => {
      if (!birthDate) throw new Error("Birth date is required")
      
      const response = await fetch("/api/judge/basic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ birthDate }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Basic API request failed: ${response.status}`)
      }

      const data = await response.json()

      // Validate basic data
      if (!data.essential || !data.attractive || !data.valuable || !data.problem) {
        throw new Error("Invalid basic data from API")
      }

      return data
    },
    enabled: enabled && !!birthDate,
    retry: 1,
  })
}

// Hook for fetching talent diagnosis
export function useTalentDiagnosis(
  basicData: Partial<DiagnosisResult> | null,
  enabled: boolean = false
) {
  return useQuery<DiagnosisResult>({
    queryKey: ["diagnosis", "talent", basicData?.essential_lb, basicData?.valuable_lb, basicData?.attractive_lb, basicData?.problem_lb],
    queryFn: async () => {
      if (!basicData?.essential_lb || !basicData?.valuable_lb || !basicData?.attractive_lb || !basicData?.problem_lb) {
        throw new Error("Basic data is required")
      }

      const response = await fetch("/api/judge/talent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          essential_lb: basicData.essential_lb,
          valuable_lb: basicData.valuable_lb,
          attractive_lb: basicData.attractive_lb,
          problem_lb: basicData.problem_lb,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Talent API request failed: ${response.status}`)
      }

      return response.json()
    },
    enabled: enabled && !!basicData?.essential_lb && !!basicData?.valuable_lb && !!basicData?.attractive_lb && !!basicData?.problem_lb,
    retry: 1,
  })
}

// Hook for fetching diagnosis list
export function useDiagnosisList() {
  return useQuery<{ results: DiagnosisLogEntry[] }>({
    queryKey: ["diagnosis", "list"],
    queryFn: async () => {
      const response = await fetch("/api/diagnosis/list")
      if (!response.ok) {
        throw new Error("Failed to fetch diagnosis list")
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Hook for saving diagnosis result
export function useSaveDiagnosis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      birthDate,
      resultData,
    }: {
      name: string
      birthDate: string
      resultData: Partial<DiagnosisResult>
    }) => {
      const response = await fetch("/api/diagnosis/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          birthDate,
          resultData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save diagnosis result")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch diagnosis list
      queryClient.invalidateQueries({ queryKey: ["diagnosis", "list"] })
    },
  })
}

// Hook for fetching a single diagnosis by ID
export function useDiagnosisById(id: string | null) {
  return useQuery<{
    name: string
    birthDate: string
    resultData: DiagnosisResult
    createdAt: string
  }>({
    queryKey: ["diagnosis", id],
    queryFn: async () => {
      if (!id) throw new Error("Diagnosis ID is required")

      const response = await fetch(`/api/diagnosis/${id}`)
      if (!response.ok) {
        throw new Error("診断結果の取得に失敗しました")
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
  })
}


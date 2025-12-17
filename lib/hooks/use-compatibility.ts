import { useMutation } from "@tanstack/react-query"

export interface CompatibilityResult {
  personA: {
    name: string
    birthDate: string
    valuable: string
    problem: string
    valuable_lb: string
    problem_lb: string
  }
  personB: {
    name: string
    birthDate: string
    valuable: string
    problem: string
    valuable_lb: string
    problem_lb: string
  }
  results: Array<{
    compatibilityType: number
    name: string
    description: string
    sheetName: string
    count: number
    records: Array<{
      aPeach: string | null
      aHard: string | null
      bPeach: string | null
      bHard: string | null
    }>
  }>
  totalMatches: number
}

// Hook for compatibility diagnosis
export function useCompatibilityDiagnosis() {
  return useMutation<CompatibilityResult, Error, {
    personA: { name: string; birthDate: string }
    personB: { name: string; birthDate: string }
  }>({
    mutationFn: async ({ personA, personB }) => {
      const response = await fetch("/api/compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personA,
          personB,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "相性診断の取得に失敗しました")
      }

      return response.json()
    },
  })
}


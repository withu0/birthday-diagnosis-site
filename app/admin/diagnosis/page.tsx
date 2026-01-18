"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AdminRoute } from "@/components/auth/admin-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Pagination } from "@/components/ui/pagination"

interface DiagnosisLog {
  id: string
  name: string
  birthDate: string
  resultData: any
  createdAt: string
}

export default function AdminDiagnosisPage() {
  const router = useRouter()
  const [diagnosisLogs, setDiagnosisLogs] = useState<DiagnosisLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchDiagnosisLogs()
  }, [currentPage])

  const fetchDiagnosisLogs = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      const response = await fetch(`/api/admin/diagnosis?${params.toString()}`)

      if (response.status === 403) {
        setError("管理者権限が必要です")
        return
      }

      if (!response.ok) {
        throw new Error("診断ログの取得に失敗しました")
      }

      const data = await response.json()
      setDiagnosisLogs(data.results || [])
      setTotalCount(data.totalCount || 0)
      setTotalPages(data.totalPages || 1)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
    fetchDiagnosisLogs()
  }

  const handleReset = () => {
    setSearch("")
    setCurrentPage(1) // Reset to first page when resetting
    setTimeout(() => fetchDiagnosisLogs(), 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP")
  }

  const handleViewDiagnosis = (id: string) => {
    router.push(`/diagnosis/view?id=${id}`)
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">診断ログ</h1>
              <p className="text-sm text-gray-600 mt-1">
                すべての診断結果を確認できます
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>検索・フィルター</CardTitle>
              <CardDescription>
                名前または生年月日で検索できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="名前または生年月日で検索..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch()
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSearch}>検索</Button>
                  <Button variant="outline" onClick={handleReset}>
                    リセット
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>診断ログ一覧</CardTitle>
              <CardDescription>
                クリックして診断結果の詳細を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : diagnosisLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    {search ? "検索結果が見つかりませんでした" : "診断ログがありません"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          名前
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          生年月日
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          診断日時
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosisLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {log.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {log.birthDate}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDiagnosis(log.id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              詳細を見る
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalCount}
              />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminRoute } from "@/components/auth/admin-route"
import { AdminLayout } from "@/components/admin/admin-layout"

interface CompatibilityType {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export default function AdminCompatibilityTypesPage() {
  const router = useRouter()
  const [types, setTypes] = useState<CompatibilityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<CompatibilityType | null>(null)
  const [formData, setFormData] = useState({ id: "", name: "", description: "" })

  useEffect(() => {
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/compatibility-types")

      if (response.status === 403) {
        setError("管理者権限が必要です")
        router.push("/")
        return
      }

      if (!response.ok) {
        throw new Error("相性タイプの取得に失敗しました")
      }

      const data = await response.json()
      setTypes(data.types || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (type: CompatibilityType) => {
    setEditingType(type)
    setFormData({
      id: type.id.toString(),
      name: type.name,
      description: type.description,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/compatibility-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: parseInt(formData.id, 10),
          name: formData.name,
          description: formData.description,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "保存に失敗しました")
      }

      setIsDialogOpen(false)
      setEditingType(null)
      setFormData({ id: "", name: "", description: "" })
      fetchTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(`相性タイプ${id}を削除してもよろしいですか？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/compatibility-types?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "削除に失敗しました")
      }

      fetchTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    }
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">相性タイプ管理</h1>
              <p className="text-gray-600 mt-1">相性タイプの説明文を管理します</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map((type) => (
                <Card key={type.id} className="shadow-md hover:shadow-lg transition">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{type.name}</CardTitle>
                        <CardDescription>タイプ {type.id}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-4">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>相性タイプを編集</DialogTitle>
                <DialogDescription>
                  相性タイプ{formData.id}の情報を編集します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="id">ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!editingType}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="相性①"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="相性タイプの説明文を入力してください"
                    rows={10}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSave}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AdminRoute>
  )
}


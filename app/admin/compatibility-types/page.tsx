"use client"

import { useState } from "react"
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
import {
  useCompatibilityTypes,
  useCreateCompatibilityType,
  useUpdateCompatibilityType,
  useDeleteCompatibilityType,
} from "@/lib/hooks/use-admin"

interface CompatibilityType {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export default function AdminCompatibilityTypesPage() {
  const { data: typesData, isLoading, error: queryError } = useCompatibilityTypes()
  const createMutation = useCreateCompatibilityType()
  const updateMutation = useUpdateCompatibilityType()
  const deleteMutation = useDeleteCompatibilityType()

  const types = typesData || []
  const error = queryError?.message || null
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<CompatibilityType | null>(null)
  const [formData, setFormData] = useState({ id: "", name: "", description: "" })

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
      if (editingType) {
        // Update existing
        await updateMutation.mutateAsync({
          id: parseInt(formData.id, 10),
          name: formData.name,
          description: formData.description,
        })
      } else {
        // Create new (if needed in future)
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
        })
      }

      setIsDialogOpen(false)
      setEditingType(null)
      setFormData({ id: "", name: "", description: "" })
    } catch (err) {
      // Error is handled by React Query
      console.error("Error saving:", err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(`相性タイプ${id}を削除してもよろしいですか？`)) {
      return
    }

    try {
      await deleteMutation.mutateAsync(id)

    } catch (err) {
      // Error is handled by React Query
      console.error("Error deleting:", err)
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


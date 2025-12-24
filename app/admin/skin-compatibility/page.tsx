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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface SkinCompatibilityItem {
  id: string
  skinTypeA: string
  skinTypeB: string
  compatibilityLevel: string
  iconType: string
  relationshipImage: string
  createdAt: string
  updatedAt: string
}

const SKIN_TYPES = [
  "天才肌",
  "オリジナル肌",
  "赤ちゃん肌",
  "多才肌",
  "ポジティブ肌",
  "スマート肌",
  "親分肌",
  "姉御肌",
  "コミュ肌",
  "ドリーム肌",
  "職人肌",
  "平和肌",
]

const COMPATIBILITY_LEVELS = ["良い", "とても良い", "普通", "注意"]

const ICON_TYPES = [
  { value: "single-circle", label: "○ (良い)" },
  { value: "double-circle", label: "◎ (とても良い)" },
  { value: "text-only", label: "普通 (テキストのみ)" },
  { value: "triangle", label: "▲ (注意)" },
]

export default function AdminSkinCompatibilityPage() {
  const router = useRouter()
  const [data, setData] = useState<SkinCompatibilityItem[]>([])
  const [groupedData, setGroupedData] = useState<Record<string, SkinCompatibilityItem[]>>({})
  const [selectedSkinType, setSelectedSkinType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SkinCompatibilityItem | null>(null)
  const [formData, setFormData] = useState({
    skinTypeA: "",
    skinTypeB: "",
    compatibilityLevel: "",
    iconType: "",
    relationshipImage: "",
  })

  useEffect(() => {
    fetchData()
  }, [selectedSkinType])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const url =
        selectedSkinType === "all"
          ? "/api/admin/skin-compatibility"
          : `/api/admin/skin-compatibility?skinTypeA=${selectedSkinType}`
      const response = await fetch(url)

      if (response.status === 403) {
        setError("管理者権限が必要です")
        router.push("/")
        return
      }

      if (!response.ok) {
        throw new Error("個性の相性データの取得に失敗しました")
      }

      const result = await response.json()
      setData(result.data || [])
      setGroupedData(result.grouped || {})
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      skinTypeA: selectedSkinType !== "all" ? selectedSkinType : "",
      skinTypeB: "",
      compatibilityLevel: "",
      iconType: "",
      relationshipImage: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: SkinCompatibilityItem) => {
    setEditingItem(item)
    setFormData({
      skinTypeA: item.skinTypeA,
      skinTypeB: item.skinTypeB,
      compatibilityLevel: item.compatibilityLevel,
      iconType: item.iconType,
      relationshipImage: item.relationshipImage,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.skinTypeA || !formData.skinTypeB || !formData.compatibilityLevel || !formData.iconType || !formData.relationshipImage) {
        setError("すべての必須フィールドを入力してください")
        return
      }

      const response = await fetch("/api/admin/skin-compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem?.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "保存に失敗しました")
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData({
        skinTypeA: "",
        skinTypeB: "",
        compatibilityLevel: "",
        iconType: "",
        relationshipImage: "",
      })
      setError(null)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("このデータを削除してもよろしいですか？")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/skin-compatibility?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "削除に失敗しました")
      }

      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    }
  }

  const getCompatibilityIcon = (iconType: string) => {
    switch (iconType) {
      case "double-circle":
        return "◎"
      case "single-circle":
        return "○"
      case "triangle":
        return "▲"
      default:
        return ""
    }
  }

  const displayData = selectedSkinType === "all" ? groupedData : { [selectedSkinType]: data }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">個性の相性管理</h1>
              <p className="text-gray-600 mt-1">個性の相性データを管理します</p>
            </div>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
              新規追加
            </Button>
          </div>

          {/* Filter */}
          <Card>
            <CardHeader>
              <CardTitle>フィルター</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="skin-type-filter">肌タイプ</Label>
                <Select value={selectedSkinType} onValueChange={setSelectedSkinType}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {SKIN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

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
            <div className="space-y-6">
              {Object.entries(displayData).map(([skinTypeA, items]) => (
                <Card key={skinTypeA} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {skinTypeA} ({items.length}件)
                    </CardTitle>
                    <CardDescription>
                      {skinTypeA} との相性データ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">相手の肌タイプ</th>
                            <th className="border p-2 text-left">相性度</th>
                            <th className="border p-2 text-left">アイコン</th>
                            <th className="border p-2 text-left">関係性イメージ</th>
                            <th className="border p-2 text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="border p-2 font-semibold">{item.skinTypeB}</td>
                              <td className="border p-2">{item.compatibilityLevel}</td>
                              <td className="border p-2 text-2xl">
                                {getCompatibilityIcon(item.iconType)}
                              </td>
                              <td className="border p-2 max-w-md">
                                <div className="truncate" title={item.relationshipImage}>
                                  {item.relationshipImage}
                                </div>
                              </td>
                              <td className="border p-2">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                  >
                                    編集
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    削除
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit/Add Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "個性の相性データを編集" : "個性の相性データを追加"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "個性の相性データの情報を編集します"
                    : "新しい個性の相性データを追加します"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skinTypeA">肌タイプ A *</Label>
                    <Select
                      value={formData.skinTypeA}
                      onValueChange={(value) =>
                        setFormData({ ...formData, skinTypeA: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKIN_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skinTypeB">肌タイプ B *</Label>
                    <Select
                      value={formData.skinTypeB}
                      onValueChange={(value) =>
                        setFormData({ ...formData, skinTypeB: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKIN_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="compatibilityLevel">相性度 *</Label>
                    <Select
                      value={formData.compatibilityLevel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, compatibilityLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPATIBILITY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iconType">アイコンタイプ *</Label>
                    <Select
                      value={formData.iconType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, iconType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_TYPES.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationshipImage">人としての相性・関係性イメージ *</Label>
                  <Textarea
                    id="relationshipImage"
                    value={formData.relationshipImage}
                    onChange={(e) =>
                      setFormData({ ...formData, relationshipImage: e.target.value })
                    }
                    placeholder="関係性の詳細な説明を入力してください"
                    rows={5}
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


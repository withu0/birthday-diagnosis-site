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

interface CompatibilityDataItem {
  id: string
  compatibilityType: number
  sheetName: string
  range: string
  aPeach: string | null
  aHard: string | null
  bPeach: string | null
  bHard: string | null
  rowIndex: number
  colIndex: number
  createdAt: string
  updatedAt: string
}

interface CompatibilityType {
  id: number
  name: string
}

export default function AdminCompatibilityDataPage() {
  const router = useRouter()
  const [data, setData] = useState<CompatibilityDataItem[]>([])
  const [groupedData, setGroupedData] = useState<Record<number, CompatibilityDataItem[]>>({})
  const [types, setTypes] = useState<CompatibilityType[]>([])
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchFilters, setSearchFilters] = useState({
    aPeach: "",
    aHard: "",
    bPeach: "",
    bHard: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CompatibilityDataItem | null>(null)
  const [formData, setFormData] = useState({
    compatibilityType: "",
    sheetName: "",
    range: "",
    aPeach: "",
    aHard: "",
    bPeach: "",
    bHard: "",
    rowIndex: "",
    colIndex: "",
  })

  useEffect(() => {
    fetchData()
    fetchTypes()
  }, [selectedType])

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/admin/compatibility-types")
      if (response.ok) {
        const result = await response.json()
        setTypes(result.types || [])
      }
    } catch (err) {
      console.error("Error fetching types:", err)
    }
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const url =
        selectedType === "all"
          ? "/api/admin/compatibility-data"
          : `/api/admin/compatibility-data?compatibilityType=${selectedType}`
      const response = await fetch(url)

      if (response.status === 403) {
        setError("管理者権限が必要です")
        router.push("/")
        return
      }

      if (!response.ok) {
        throw new Error("相性データの取得に失敗しました")
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
      compatibilityType: selectedType !== "all" ? selectedType : "",
      sheetName: "",
      range: "",
      aPeach: "",
      aHard: "",
      bPeach: "",
      bHard: "",
      rowIndex: "",
      colIndex: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: CompatibilityDataItem) => {
    setEditingItem(item)
    setFormData({
      compatibilityType: item.compatibilityType.toString(),
      sheetName: item.sheetName,
      range: item.range,
      aPeach: item.aPeach || "",
      aHard: item.aHard || "",
      bPeach: item.bPeach || "",
      bHard: item.bHard || "",
      rowIndex: item.rowIndex.toString(),
      colIndex: item.colIndex.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/compatibility-data", {
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
        compatibilityType: "",
        sheetName: "",
        range: "",
        aPeach: "",
        aHard: "",
        bPeach: "",
        bHard: "",
        rowIndex: "",
        colIndex: "",
      })
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
      const response = await fetch(`/api/admin/compatibility-data?id=${id}`, {
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

  const getTypeName = (typeId: number) => {
    const type = types.find((t) => t.id === typeId)
    return type ? type.name : `タイプ${typeId}`
  }

  const filterData = (items: CompatibilityDataItem[]) => {
    return items.filter((item) => {
      // All filters are AND relation
      const matchesAPeach = !searchFilters.aPeach || 
        (item.aPeach && item.aPeach.toLowerCase().includes(searchFilters.aPeach.toLowerCase()))
      const matchesAHard = !searchFilters.aHard || 
        (item.aHard && item.aHard.toLowerCase().includes(searchFilters.aHard.toLowerCase()))
      const matchesBPeach = !searchFilters.bPeach || 
        (item.bPeach && item.bPeach.toLowerCase().includes(searchFilters.bPeach.toLowerCase()))
      const matchesBHard = !searchFilters.bHard || 
        (item.bHard && item.bHard.toLowerCase().includes(searchFilters.bHard.toLowerCase()))
      
      return matchesAPeach && matchesAHard && matchesBPeach && matchesBHard
    })
  }

  const getFilteredGroupedData = () => {
    const baseData = selectedType === "all" ? groupedData : { [parseInt(selectedType, 10)]: data }
    const filtered: Record<number, CompatibilityDataItem[]> = {}
    
    Object.entries(baseData).forEach(([typeId, items]) => {
      const filteredItems = filterData(items)
      if (filteredItems.length > 0) {
        filtered[parseInt(typeId, 10)] = filteredItems
      }
    })
    
    return filtered
  }

  const displayData = getFilteredGroupedData()

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">相性データ管理</h1>
              <p className="text-gray-600 mt-1">相性データを管理します</p>
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
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="type-filter">相性タイプ</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} (タイプ{type.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">A 検索</Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="search-aPeach" className="text-xs text-gray-600">A Peach</Label>
                        <Input
                          id="search-aPeach"
                          value={searchFilters.aPeach}
                          onChange={(e) =>
                            setSearchFilters({ ...searchFilters, aPeach: e.target.value })
                          }
                          placeholder="A Peachで検索"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="search-aHard" className="text-xs text-gray-600">A Hard</Label>
                        <Input
                          id="search-aHard"
                          value={searchFilters.aHard}
                          onChange={(e) =>
                            setSearchFilters({ ...searchFilters, aHard: e.target.value })
                          }
                          placeholder="A Hardで検索"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">B 検索</Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="search-bPeach" className="text-xs text-gray-600">B Peach</Label>
                        <Input
                          id="search-bPeach"
                          value={searchFilters.bPeach}
                          onChange={(e) =>
                            setSearchFilters({ ...searchFilters, bPeach: e.target.value })
                          }
                          placeholder="B Peachで検索"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="search-bHard" className="text-xs text-gray-600">B Hard</Label>
                        <Input
                          id="search-bHard"
                          value={searchFilters.bHard}
                          onChange={(e) =>
                            setSearchFilters({ ...searchFilters, bHard: e.target.value })
                          }
                          placeholder="B Hardで検索"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
              {Object.entries(displayData).map(([typeId, items]) => (
                <Card key={typeId} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {getTypeName(parseInt(typeId, 10))} ({items.length}件)
                    </CardTitle>
                    <CardDescription>
                      シート: {items[0]?.sheetName} | 範囲: {items[0]?.range}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">A Peach</th>
                            <th className="border p-2 text-left">A Hard</th>
                            <th className="border p-2 text-left">B Peach</th>
                            <th className="border p-2 text-left">B Hard</th>
                            <th className="border p-2 text-left">Row</th>
                            <th className="border p-2 text-left">Col</th>
                            <th className="border p-2 text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="border p-2">{item.aPeach || "-"}</td>
                              <td className="border p-2">{item.aHard || "-"}</td>
                              <td className="border p-2">{item.bPeach || "-"}</td>
                              <td className="border p-2">{item.bHard || "-"}</td>
                              <td className="border p-2">{item.rowIndex}</td>
                              <td className="border p-2">{item.colIndex}</td>
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "相性データを編集" : "相性データを追加"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "相性データの情報を編集します"
                    : "新しい相性データを追加します"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="compatibilityType">相性タイプ *</Label>
                    <Select
                      value={formData.compatibilityType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, compatibilityType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheetName">シート名 *</Label>
                    <Input
                      id="sheetName"
                      value={formData.sheetName}
                      onChange={(e) => setFormData({ ...formData, sheetName: e.target.value })}
                      placeholder="相性①完成"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="range">範囲 *</Label>
                  <Input
                    id="range"
                    value={formData.range}
                    onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                    placeholder="A2:AM31"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aPeach">A Peach</Label>
                    <Input
                      id="aPeach"
                      value={formData.aPeach}
                      onChange={(e) => setFormData({ ...formData, aPeach: e.target.value })}
                      placeholder="T+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aHard">A Hard</Label>
                    <Input
                      id="aHard"
                      value={formData.aHard}
                      onChange={(e) => setFormData({ ...formData, aHard: e.target.value })}
                      placeholder="T-"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bPeach">B Peach</Label>
                    <Input
                      id="bPeach"
                      value={formData.bPeach}
                      onChange={(e) => setFormData({ ...formData, bPeach: e.target.value })}
                      placeholder="F+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bHard">B Hard</Label>
                    <Input
                      id="bHard"
                      value={formData.bHard}
                      onChange={(e) => setFormData({ ...formData, bHard: e.target.value })}
                      placeholder="F-"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rowIndex">行インデックス *</Label>
                    <Input
                      id="rowIndex"
                      type="number"
                      value={formData.rowIndex}
                      onChange={(e) => setFormData({ ...formData, rowIndex: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colIndex">列インデックス *</Label>
                    <Input
                      id="colIndex"
                      type="number"
                      value={formData.colIndex}
                      onChange={(e) => setFormData({ ...formData, colIndex: e.target.value })}
                      placeholder="0"
                    />
                  </div>
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


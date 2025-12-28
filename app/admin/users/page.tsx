"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminRoute } from "@/components/auth/admin-route";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAuthContext } from "@/lib/contexts/auth-context";
import { Eye, EyeOff } from "lucide-react";

interface Membership {
  id: string | null;
  accessExpiresAt: string | null;
  isActive: boolean | null;
  accessGrantedAt: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  membership: Membership | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editAccessExpiresAt, setEditAccessExpiresAt] = useState("");
  
  // Create user modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [createIsAdmin, setCreateIsAdmin] = useState(false);
  const [createAccessExpiresAt, setCreateAccessExpiresAt] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");
      
      if (response.status === 403) {
        setError("管理者権限が必要です");
        return;
      }

      if (!response.ok) {
        throw new Error("ユーザー一覧の取得に失敗しました");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("このユーザーを削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      // Refresh user list
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role || "user");
    setEditIsAdmin(user.isAdmin || false);
    // Format date for input (YYYY-MM-DDTHH:mm)
    if (user.membership?.accessExpiresAt) {
      const date = new Date(user.membership.accessExpiresAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setEditAccessExpiresAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setEditAccessExpiresAt("");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          isAdmin: editIsAdmin,
          accessExpiresAt: editAccessExpiresAt || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新に失敗しました");
      }

      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("user");
    setEditIsAdmin(false);
    setEditAccessExpiresAt("");
  };

  const handleCreateUser = async () => {
    if (!createName || !createEmail || !createPassword) {
      alert("名前、メールアドレス、パスワードは必須です");
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
          isAdmin: createIsAdmin,
          accessExpiresAt: createAccessExpiresAt || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "ユーザーの作成に失敗しました");
      }

      // Reset form and close modal
      setIsCreateModalOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("user");
      setCreateIsAdmin(false);
      setCreateAccessExpiresAt("");
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "ユーザーの作成に失敗しました");
    }
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("user");
    setCreateIsAdmin(false);
    setCreateAccessExpiresAt("");
    setShowCreatePassword(false);
  };

  const generateRandomPassword = () => {
    // Generate a 16-character random password (8 bytes = 16 hex characters)
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const password = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setCreatePassword(password);
  };

  const getDefaultExpirationDate = () => {
    // Calculate 6 months from now
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  const formatExpirationDate = (dateString: string | null) => {
    if (!dateString) return "なし";
    const date = new Date(dateString);
    const now = new Date();
    const isExpired = date < now;
    const className = isExpired ? "text-red-600 font-semibold" : "text-silver-dark";
    return (
      <span className={className}>
        {date.toLocaleString("ja-JP")} {isExpired && "(期限切れ)"}
      </span>
    );
  };

  return (
    <AdminRoute>
      <AdminLayout>
          <Card className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
            <CardHeader>
              <CardTitle className="text-3xl text-gold text-center">
                👥 ユーザー管理
              </CardTitle>
              <CardDescription className="text-center text-silver-dark">
                登録されているユーザー一覧と管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gold mx-auto mb-4"></div>
                  <p className="text-silver-dark">読み込み中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button
                    onClick={fetchUsers}
                    className="gradient-bg-gold text-white hover:opacity-90"
                  >
                    再試行
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-silver-dark">
                      合計 {users.length} 人のユーザー
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setIsCreateModalOpen(true);
                          // Set default expiration date to 6 months from now
                          setCreateAccessExpiresAt(getDefaultExpirationDate());
                        }}
                        className="bg-gold hover:bg-gold-dark text-white"
                      >
                        新規作成
                      </Button>
                      <Button
                        onClick={fetchUsers}
                        variant="outline"
                        className="border-gold text-gold hover:bg-gold hover:text-white"
                      >
                        更新
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gold-light/20 border-b border-gold/30">
                          <th className="p-3 text-left text-gold font-bold">名前</th>
                          <th className="p-3 text-left text-gold font-bold">メールアドレス</th>
                          <th className="p-3 text-left text-gold font-bold">ロール</th>
                          <th className="p-3 text-left text-gold font-bold">管理者</th>
                          <th className="p-3 text-left text-gold font-bold">有効期限</th>
                          <th className="p-3 text-left text-gold font-bold">登録日時</th>
                          <th className="p-3 text-left text-gold font-bold">更新日時</th>
                          <th className="p-3 text-center text-gold font-bold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-silver/20 hover:bg-gold-light/5"
                          >
                            <td className="p-3 text-silver-dark">{user.name}</td>
                            <td className="p-3 text-silver-dark">{user.email}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                user.role === "admin" 
                                  ? "bg-purple-100 text-purple-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {user.role === "admin" ? "管理者" : "ユーザー"}
                              </span>
                            </td>
                            <td className="p-3">
                              {user.isAdmin ? (
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                                  はい
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                                  いいえ
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {formatExpirationDate(user.membership?.accessExpiresAt || null)}
                            </td>
                            <td className="p-3 text-sm text-silver-dark">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="p-3 text-sm text-silver-dark">
                              {formatDate(user.updatedAt)}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(user)}
                                  className="border-gold text-gold hover:bg-gold hover:text-white"
                                >
                                  編集
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(user.id)}
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
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

                  {users.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-silver-dark">ユーザーが登録されていません</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit User Modal */}
          <Dialog open={editingUser !== null} onOpenChange={(open) => !open && handleCancelEdit()}>
            <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>ユーザーを編集</DialogTitle>
                <DialogDescription>
                  {editingUser?.name}さんの情報を編集します
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 overflow-y-auto flex-1">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">名前</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="名前を入力"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">メールアドレス</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="メールアドレスを入力"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">ロール</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">ユーザー</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-is-admin"
                    checked={editIsAdmin}
                    onCheckedChange={(checked) => setEditIsAdmin(checked === true)}
                  />
                  <Label htmlFor="edit-is-admin" className="text-sm font-normal cursor-pointer">
                    管理者権限を付与
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-expires-at">有効期限</Label>
                  <Input
                    id="edit-expires-at"
                    type="datetime-local"
                    value={editAccessExpiresAt}
                    onChange={(e) => setEditAccessExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    有効期限を設定しない場合は空欄のままにしてください
                  </p>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-gold text-white hover:opacity-90"
                >
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create User Modal */}
          <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && handleCancelCreate()}>
            <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>新しいユーザーを作成</DialogTitle>
                <DialogDescription>
                  新しいユーザーアカウントを作成します
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 overflow-y-auto flex-1">
                <div className="grid gap-2">
                  <Label htmlFor="create-name">名前 *</Label>
                  <Input
                    id="create-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="名前を入力"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-email">メールアドレス *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="メールアドレスを入力"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-password">パスワード *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="create-password"
                        type={showCreatePassword ? "text" : "password"}
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        placeholder="パスワードを入力"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label={showCreatePassword ? "パスワードを隠す" : "パスワードを表示"}
                      >
                        {showCreatePassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomPassword}
                      className="border-gold text-gold hover:bg-gold hover:text-white whitespace-nowrap"
                    >
                      ランダム生成
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-role">ロール</Label>
                  <Select value={createRole} onValueChange={setCreateRole}>
                    <SelectTrigger id="create-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">ユーザー</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-is-admin"
                    checked={createIsAdmin}
                    onCheckedChange={(checked) => setCreateIsAdmin(checked === true)}
                  />
                  <Label htmlFor="create-is-admin" className="text-sm font-normal cursor-pointer">
                    管理者権限を付与
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-expires-at">有効期限</Label>
                  <Input
                    id="create-expires-at"
                    type="datetime-local"
                    value={createAccessExpiresAt}
                    onChange={(e) => setCreateAccessExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    デフォルトは6ヶ月後です。変更する場合は上記の日時を編集してください。
                  </p>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelCreate}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleCreateUser}
                  className="bg-gold text-white hover:opacity-90"
                >
                  作成
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </AdminLayout>
    </AdminRoute>
  );
}


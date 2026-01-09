'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  UserCheck,
  Loader2
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import AdminLayout from '@/components/admin-layout';
import { usersApi, ApiError } from '@/lib/api-client';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    enabled: true,
  });

  // Fetch users from backend API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch data on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Update user via API
        const response = await usersApi.update(
          editingUser.id,
          formData.name,
          formData.email,
          formData.enabled,
          formData.password || undefined // Only include password if provided
        );

        setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
      } else {
        // Create user via API
        const response = await usersApi.create(
          formData.name,
          formData.email,
          formData.password,
          formData.enabled
        );
        setUsers([...users, response.data]);
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save user:', error);

      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
        alert(`保存失败: ${error.message}`);
      } else {
        alert('保存失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      enabled: user.enabled,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('确定要删除这个用户吗？此操作不可撤销。')) return;

    setLoading(true);

    try {
      await usersApi.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);

      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
        alert(`删除失败: ${error.message}`);
      } else {
        alert('删除失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setLoading(true);

    try {
      // Call API to update the user's enabled status
      const response = await usersApi.update(
        userId,
        user.name,
        user.email,
        !user.enabled
      );

      setUsers(users.map(u => u.id === userId ? response.data : u));
    } catch (error) {
      console.error('Failed to toggle user status:', error);

      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
        alert(`状态切换失败: ${error.message}`);
      } else {
        alert('状态切换失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      enabled: true,
    });
    setEditingUser(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">用户管理</h1>
              <p className="text-muted-foreground mt-2">
                管理系统用户账户和权限
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  添加用户
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? '编辑用户' : '添加新用户'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? '修改用户名和密码（邮箱不可修改）'
                      : '创建新的用户账户'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">用户名</Label>
                      <Input
                        id="name"
                        placeholder="张三"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        邮箱 {editingUser && <span className="text-muted-foreground text-sm"></span>}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="zhangsan@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={loading || !!editingUser}
                        className={editingUser ? "bg-muted cursor-not-allowed" : ""}
                      />
                      {editingUser && (
                        <p className="text-xs text-muted-foreground">用户邮箱创建后不可修改</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        密码 {editingUser && <span className="text-muted-foreground text-sm">(留空则不修改)</span>}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={editingUser ? "留空则不修改密码" : "请输入密码"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                        disabled={loading}
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">密码最少 6 位字符</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="enabled"
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                        disabled={loading}
                      />
                      <Label htmlFor="enabled">启用账户</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingUser ? '更新' : '添加'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.enabled).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已禁用</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter(u => !u.enabled).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>
                管理所有系统用户及其账户状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户 ID</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">
                        {user.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.enabled
                            ? "text-green-600 bg-green-50 border-green-200"
                            : "text-red-600 bg-red-50 border-red-200"
                          }
                        >
                          {user.enabled ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />已启用</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />已禁用</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={loading}
                          >
                            {user.enabled ? '禁用' : '启用'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>还没有添加任何用户</p>
                  <p className="text-sm">点击&ldquo;添加用户&rdquo;按钮创建新用户账户</p>
                </div>
              )}
              {loading && users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                  <p>加载中...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

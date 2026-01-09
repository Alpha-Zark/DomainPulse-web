'use client';

import { useState, useEffect } from 'react';
import { Domain } from '@/types';
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
  Globe, 
  CheckCircle, 
  XCircle,
  Activity,
  Loader2
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import AdminLayout from '@/components/admin-layout';
import { domainsApi, ApiError } from '@/lib/api-client';
import { processDomainItem } from '@/lib/certificate-utils';


export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
    checkInterval: 60,
  });

  // Fetch domains from backend API
  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await domainsApi.getAll();
      const processedDomains = response.data.map(processDomainItem);
      setDomains(processedDomains);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch data on component mount
  useEffect(() => {
    fetchDomains();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDomain) {
        // Update domain via API
        const response = await domainsApi.update(
          parseInt(editingDomain.id),
          formData.name,
          formData.isActive
        );

        const updatedDomain = processDomainItem(response.data);
        setDomains(domains.map(d => d.id === editingDomain.id ? updatedDomain : d));
      } else {
        // Create domain via API
        const response = await domainsApi.create(formData.name);
        const newDomain = processDomainItem(response.data);
        setDomains([...domains, newDomain]);
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save domain:', error);

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

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      isActive: domain.isActive,
      checkInterval: domain.checkInterval,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (domainId: string) => {
    if (!window.confirm('确定要删除这个域名吗？')) return;

    setLoading(true);

    try {
      await domainsApi.delete(parseInt(domainId));
      setDomains(domains.filter(d => d.id !== domainId));
    } catch (error) {
      console.error('Failed to delete domain:', error);
      
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

  const toggleDomainStatus = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    setLoading(true);

    try {
      // Call API to update the domain's enabled status
      const response = await domainsApi.update(
        parseInt(domainId),
        domain.name,
        !domain.isActive
      );

      const updatedDomain = processDomainItem(response.data);
      setDomains(domains.map(d => d.id === domainId ? updatedDomain : d));
    } catch (error) {
      console.error('Failed to toggle domain status:', error);

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
      isActive: true,
      checkInterval: 60,
    });
    setEditingDomain(null);
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
              <h1 className="text-3xl font-bold">域名管理</h1>
              <p className="text-muted-foreground mt-2">
                管理监控的域名和证书检查设置
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  添加域名
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingDomain ? '编辑域名' : '添加新域名'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDomain 
                      ? '修改域名的监控设置' 
                      : '添加新的域名以开始SSL证书监控'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">域名</Label>
                      <Input
                        id="name"
                        placeholder="example.com"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkInterval">检查间隔 (分钟)</Label>
                      <Input
                        id="checkInterval"
                        type="number"
                        min="5"
                        max="1440"
                        value={formData.checkInterval}
                        onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        disabled={loading}
                      />
                      <Label htmlFor="isActive">启用监控</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingDomain ? '更新' : '添加'}
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
                <CardTitle className="text-sm font-medium">总域名数</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{domains.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃域名</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {domains.filter(d => d.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已暂停</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {domains.filter(d => !d.isActive).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domains Table */}
          <Card>
            <CardHeader>
              <CardTitle>域名列表</CardTitle>
              <CardDescription>
                管理所有监控的域名及其配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>域名</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>检查间隔</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{domain.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={domain.isActive 
                            ? "text-green-600 bg-green-50 border-green-200" 
                            : "text-red-600 bg-red-50 border-red-200"
                          }
                        >
                          {domain.isActive ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />活跃</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />已暂停</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{domain.checkInterval} 分钟</TableCell>
                      <TableCell>
                        {domain.createdAt.toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDomainStatus(domain.id)}
                          >
                            {domain.isActive ? '暂停' : '启用'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(domain)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(domain.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {domains.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>还没有添加任何域名</p>
                  <p className="text-sm">点击&ldquo;添加域名&rdquo;按钮开始监控SSL证书</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
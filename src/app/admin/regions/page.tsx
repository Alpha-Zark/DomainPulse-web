'use client';

import { useState, useEffect } from 'react';
import { Region } from '@/types';
import { processLocationItem } from '@/lib/certificate-utils';
import { locationsApi, regionsApi, ApiError } from '@/lib/api-client';
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
  MapPin, 
  CheckCircle, 
  XCircle,
  Activity,
  Loader2
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import AdminLayout from '@/components/admin-layout';

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subnet: '',
    isActive: true,
  });

  // Fetch regions from backend API
  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await locationsApi.getAll();
      const processedRegions = response.data.map(processLocationItem);
      setRegions(processedRegions);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRegion) {
        // Update region via API
        const response = await regionsApi.update(
          parseInt(editingRegion.id),
          formData.name,
          formData.subnet,
          formData.isActive
        );

        const updatedRegion = processLocationItem(response.data);
        setRegions(regions.map(r => r.id === editingRegion.id ? updatedRegion : r));
      } else {
        // Create region via API
        const response = await regionsApi.create(formData.name, formData.subnet);
        const newRegion = processLocationItem(response.data);
        setRegions([...regions, newRegion]);
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save region:', error);

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

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      subnet: region.subnet || '',
      isActive: region.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (regionId: string) => {
    if (!window.confirm('确定要删除这个区域吗？删除后相关的证书数据将失去区域标记。')) return;

    setLoading(true);

    try {
      await regionsApi.delete(parseInt(regionId));
      setRegions(regions.filter(r => r.id !== regionId));
    } catch (error) {
      console.error('Failed to delete region:', error);
      
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

  const toggleRegionStatus = async (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;

    setLoading(true);

    try {
      // Call API to update the region's enabled status
      const response = await regionsApi.update(
        parseInt(regionId),
        region.name,
        region.subnet || '',
        !region.isActive
      );

      const updatedRegion = processLocationItem(response.data);
      setRegions(regions.map(r => r.id === regionId ? updatedRegion : r));
    } catch (error) {
      console.error('Failed to toggle region status:', error);

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
      subnet: '',
      isActive: true,
    });
    setEditingRegion(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const validateSubnet = (subnet: string) => {
    // CIDR format validation
    const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
    return cidrRegex.test(subnet);
  };

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">区域管理</h1>
              <p className="text-muted-foreground mt-2">
                管理监控区域，用于对证书进行地理分组
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  添加区域
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingRegion ? '编辑区域' : '添加新区域'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRegion 
                      ? '修改区域信息' 
                      : '创建新的监控区域用于证书分组'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">区域名称</Label>
                      <Input
                        id="name"
                        placeholder="美国"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subnet">子网</Label>
                      <Input
                        id="subnet"
                        placeholder="192.168.1.0/24"
                        value={formData.subnet}
                        onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                        required
                        disabled={loading}
                        pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$"
                      />
                      <p className="text-xs text-muted-foreground">
                        CIDR格式，例如: 192.168.1.0/24
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        disabled={loading}
                      />
                      <Label htmlFor="isActive">启用区域</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={loading || !validateSubnet(formData.subnet)}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingRegion ? '更新' : '添加'}
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
                <CardTitle className="text-sm font-medium">总区域数</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃区域</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {regions.filter(r => r.isActive).length}
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
                  {regions.filter(r => !r.isActive).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Regions Table */}
          <Card>
            <CardHeader>
              <CardTitle>区域列表</CardTitle>
              <CardDescription>
                管理所有监控区域及其配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>区域名称</TableHead>
                    <TableHead>子网</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{region.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {region.subnet ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {region.subnet}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={region.isActive 
                            ? "text-green-600 bg-green-50 border-green-200" 
                            : "text-red-600 bg-red-50 border-red-200"
                          }
                        >
                          {region.isActive ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />活跃</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />已禁用</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {region.createdAt.toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRegionStatus(region.id)}
                          >
                            {region.isActive ? '禁用' : '启用'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(region)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(region.id)}
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
              {regions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>还没有添加任何区域</p>
                  <p className="text-sm">点击&ldquo;添加区域&rdquo;按钮创建监控区域</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
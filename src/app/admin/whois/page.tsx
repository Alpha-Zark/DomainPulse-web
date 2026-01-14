'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import WhoisDomainAddDialog from '@/components/whois-domain-add-dialog';
import WhoisDomainEditDialog from '@/components/whois-domain-edit-dialog';
import { AdminWhoisDomain } from '@/types/api';
import { whoisDomainsApi, ApiError } from '@/lib/api-client';
import {
  RefreshCw,
  AlertCircle,
  Globe,
  Activity,
  XCircle,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';


function WhoisDomainsContent() {
  const [domains, setDomains] = useState<AdminWhoisDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<AdminWhoisDomain | null>(null);

  const fetchDomains = async (refreshCache: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await whoisDomainsApi.getAll(refreshCache);
      setDomains(response.data);
    } catch (error) {
      console.error('Failed to fetch whois domains:', error);

      if (error instanceof ApiError) {
        setError(`API错误: ${error.message}`);
        console.error('Whois Domains API Error:', error.message, error.status);
      } else {
        setError('获取whois域名列表失败');
      }

      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleRefresh = async () => {
    await fetchDomains(true);
  };

  const handleAddSuccess = async () => {
    // Refresh the domains list after successful addition
    await fetchDomains();
  };

  const handleEditSuccess = async () => {
    // Refresh the domains list after successful edit
    setEditingDomain(null);
    await fetchDomains();
  };

  const handleEdit = (domain: AdminWhoisDomain) => {
    setEditingDomain(domain);
  };

  const toggleAutoUpdate = async (domainId: number, currentValue: boolean) => {
    try {
      const domain = domains.find(d => d.id === domainId);
      if (!domain) return;

      await whoisDomainsApi.update(
        domainId,
        domain.domain,
        domain.enabled,
        !currentValue,
        domain.expiration_date
      );

      // Update local state
      setDomains(domains.map(d =>
        d.id === domainId ? { ...d, auto_update: !currentValue, updated_at: new Date().toISOString() } : d
      ));
    } catch (error) {
      console.error('Failed to toggle auto_update:', error);
      if (error instanceof ApiError) {
        setError(`更新失败: ${error.message}`);
      }
    }
  };

  const toggleDomainStatus = async (domainId: number) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    setLoading(true);

    try {
      await whoisDomainsApi.update(
        domainId,
        domain.domain,
        !domain.enabled,
        domain.auto_update,
        domain.expiration_date
      );

      setDomains(domains.map(d =>
        d.id === domainId ? { ...d, enabled: !d.enabled, updated_at: new Date().toISOString() } : d
      ));
    } catch (error) {
      console.error('Failed to toggle domain status:', error);
      if (error instanceof ApiError) {
        setError(`状态切换失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (domainId: number) => {
    if (!window.confirm('确定要删除这个域名吗？')) return;

    setLoading(true);

    try {
      await whoisDomainsApi.delete(domainId);
      setDomains(domains.filter(d => d.id !== domainId));
    } catch (error) {
      console.error('Failed to delete domain:', error);

      if (error instanceof ApiError) {
        setError(`删除失败: ${error.message}`);
      } else {
        setError('删除失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString || isoString === '0001-01-01T00:00:00Z') {
      return '-';
    }
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Whois域名管理</h1>
              <p className="text-muted-foreground mt-1">
                管理需要监控whois信息的域名列表
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <WhoisDomainAddDialog onSuccess={handleAddSuccess} />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
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
                  {domains.filter(d => d.enabled).length}
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
                  {domains.filter(d => !d.enabled).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domains List */}
          <Card>
            <CardHeader>
              <CardTitle>Whois域名列表</CardTitle>
              <CardDescription>
                管理所有监控的Whois域名及其配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>域名</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>域名有效期</TableHead>
                    <TableHead>自动更新</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{domain.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={domain.enabled
                            ? "text-green-600 bg-green-50 border-green-200"
                            : "text-red-600 bg-red-50 border-red-200"
                          }
                        >
                          {domain.enabled ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />活跃</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />已暂停</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(domain.expiration_date)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={domain.auto_update}
                          onCheckedChange={() => toggleAutoUpdate(domain.id, domain.auto_update)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDomainStatus(domain.id)}
                            disabled={loading}
                          >
                            {domain.enabled ? '禁用' : '启用'}
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
                  <p>还没有添加任何Whois域名</p>
                  <p className="text-sm">点击&quot;添加域名&quot;按钮开始监控域名whois信息</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>

      {/* Edit Dialog */}
      {editingDomain && (
        <WhoisDomainEditDialog
          domain={editingDomain}
          onSuccess={handleEditSuccess}
          trigger={null}
          open={!!editingDomain}
          onOpenChange={(open) => !open && setEditingDomain(null)}
        />
      )}
    </AuthGuard>
  );
}

export default function WhoisDomainsPage() {
  return <WhoisDomainsContent />;
}
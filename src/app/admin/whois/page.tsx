'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import AuthGuard from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WhoisDomainAddDialog from '@/components/whois-domain-add-dialog';
import WhoisDomainEditDialog from '@/components/whois-domain-edit-dialog';
import WhoisDomainDeleteDialog from '@/components/whois-domain-delete-dialog';
import { AdminWhoisDomain } from '@/types/api';
import { whoisDomainsApi, ApiError } from '@/lib/api-client';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Globe,
  Calendar,
  Building
} from 'lucide-react';


function WhoisDomainsContent() {
  const [domains, setDomains] = useState<AdminWhoisDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await whoisDomainsApi.getAll();
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
    await fetchDomains();
  };

  const handleAddSuccess = async () => {
    // Refresh the domains list after successful addition
    await fetchDomains();
  };

  const handleEditSuccess = async () => {
    // Refresh the domains list after successful edit
    await fetchDomains();
  };

  const handleDeleteSuccess = async () => {
    // Refresh the domains list after successful deletion
    await fetchDomains();
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{domains.length}</div>
                <p className="text-xs text-muted-foreground">正在监控的域名</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本月新增</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {domains.filter(d => {
                    const domainDate = new Date(d.created_at);
                    const currentDate = new Date();
                    return domainDate.getMonth() === currentDate.getMonth() &&
                           domainDate.getFullYear() === currentDate.getFullYear();
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">本月添加的域名</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">监控状态</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">正常</div>
                <p className="text-xs text-muted-foreground">监控服务运行中</p>
              </CardContent>
            </Card>
          </div>

          {/* Domains List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                域名列表
              </CardTitle>
              <CardDescription>
                当前监控的whois域名列表 ({domains.length} 个域名)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && domains.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>加载中...</span>
                </div>
              ) : domains.length > 0 ? (
                <div className="space-y-4">
                  {domains.map((domain) => (
                    <div 
                      key={domain.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{domain.domain}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              创建时间: {formatDate(domain.created_at)}
                            </span>
                            {domain.enabled ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                已启用
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                                已禁用
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <WhoisDomainEditDialog
                          domain={domain}
                          onSuccess={handleEditSuccess}
                        />
                        <WhoisDomainDeleteDialog
                          domain={domain}
                          onSuccess={handleDeleteSuccess}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg font-medium mb-2">暂无域名</div>
                  <div className="text-muted-foreground mb-4">
                    还没有添加需要监控whois信息的域名
                  </div>
                  <WhoisDomainAddDialog 
                    onSuccess={handleAddSuccess}
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        添加第一个域名
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

export default function WhoisDomainsPage() {
  return <WhoisDomainsContent />;
}
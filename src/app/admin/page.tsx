'use client';

import { useEffect, useState } from 'react';
// import { Certificate, CertificateStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Globe,
  Clock,
  Activity
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import AdminLayout from '@/components/admin-layout';
import { domainsApi } from '@/lib/api-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDomains: 0,
    activeCertificates: 0,
    expiringSoon: 0,
    failed: 0,
    lastUpdate: new Date()
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats from API
  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch certificate status using the correct API
      const certResponse = await domainsApi.getCertStatus();
      const domains = certResponse.data;

      // Calculate statistics by domain (not by certificate)
      // Each domain counts as one, take the minimum remaining_days across all regions
      let normalDomains = 0;      // All regions have remaining_days > 30
      let expiringSoon = 0;       // Any region has remaining_days 1-30
      let expiredDomains = 0;     // Any region has remaining_days <= 0

      domains.forEach(domainData => {
        // Find the minimum remaining_days across all regions for this domain
        const minRemainingDays = Math.min(
          ...domainData.cert_status.map(cert => cert.remaining_days)
        );

        // Classify this domain based on the worst-case (minimum) remaining days
        if (minRemainingDays > 30) {
          normalDomains++;
        } else if (minRemainingDays > 0) {
          expiringSoon++;
        } else {
          expiredDomains++;
        }
      });

      setStats({
        totalDomains: domains.length,
        activeCertificates: normalDomains,
        expiringSoon: expiringSoon,
        failed: expiredDomains,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Keep default stats on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);


  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">管理中心概览</h1>
            <p className="text-muted-foreground mt-2">
              SSL 证书监控系统管理面板
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总域名数</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDomains}</div>
                <p className="text-xs text-muted-foreground">
                  正在监控的域名
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">正常域名</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeCertificates}</div>
                <p className="text-xs text-muted-foreground">
                  所有区域证书正常
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">即将过期</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
                <p className="text-xs text-muted-foreground">
                  30天内有证书过期
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已过期</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">
                  有证书已过期
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
              <CardDescription>
                系统最近的监控和管理活动
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无活动记录</p>
                <p className="text-sm">系统活动将在此显示</p>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
              <CardDescription>
                最后更新: {stats.lastUpdate.toLocaleString('zh-CN')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={loading ? "text-yellow-600 bg-yellow-50 border-yellow-200" : "text-green-600 bg-green-50 border-green-200"}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {loading ? '加载中...' : '系统正常运行'}
                </Badge>
                <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                  监控中: {stats.totalDomains} 个域名
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
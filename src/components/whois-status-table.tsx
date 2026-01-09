'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DomainWhoisStatus } from '@/types/api';
import { getWhoisStatusBadge, formatExpiryDate } from '@/lib/whois-utils';
import { RefreshCw, Globe, Calendar } from 'lucide-react';

interface WhoisStatusTableProps {
  domains: DomainWhoisStatus[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function WhoisStatusTable({ domains, loading, onRefresh }: WhoisStatusTableProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusText = (status: string, daysUntilExpiry?: number) => {
    if (status === 'error') return '错误';
    if (status === 'checking') return '检查中';
    
    if (daysUntilExpiry === undefined || daysUntilExpiry < 0) {
      return '无数据';
    }
    
    if (daysUntilExpiry <= 7) {
      return `${daysUntilExpiry}天后到期`;
    }
    
    if (daysUntilExpiry <= 30) {
      return `${daysUntilExpiry}天后到期`;
    }
    
    if (daysUntilExpiry <= 90) {
      return `${Math.ceil(daysUntilExpiry / 30)}个月后到期`;
    }
    
    return `${Math.ceil(daysUntilExpiry / 30)}个月后到期`;
  };

  const errorCount = domains.filter(d => d.status === 'error').length;
  const warningCount = domains.filter(d => d.daysUntilExpiry !== undefined && d.daysUntilExpiry <= 30).length;
  const goodCount = domains.filter(d => d.status === 'success' && (d.daysUntilExpiry === undefined || d.daysUntilExpiry > 30)).length;

  if (loading && domains.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            域名Whois状态
          </CardTitle>
          <CardDescription>
            域名到期时间监控
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>加载中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              域名Whois状态
            </CardTitle>
            <CardDescription>
              域名到期时间监控 ({domains.length} 个域名)
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
            {loading || refreshing ? '检查中...' : '刷新'}
          </Button>
        </div>

        {/* Status Summary */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {errorCount}
            </Badge>
            <span className="text-sm text-muted-foreground">错误</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {warningCount}
            </Badge>
            <span className="text-sm text-muted-foreground">即将到期</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              {goodCount}
            </Badge>
            <span className="text-sm text-muted-foreground">正常</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">域名</TableHead>
                <TableHead>到期日期</TableHead>
                <TableHead>剩余天数</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.domain}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {domain.domain}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {domain.expiryDate && (
                        <>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatExpiryDate(domain.expiryDate)}
                        </>
                      )}
                      {!domain.expiryDate && domain.status === 'success' && (
                        <span className="text-muted-foreground">-</span>
                      )}
                      {domain.status === 'error' && (
                        <span className="text-red-600">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {domain.daysUntilExpiry !== undefined && domain.daysUntilExpiry >= 0 ? (
                      <span className={
                        domain.daysUntilExpiry <= 7 ? 'text-red-600 font-semibold' :
                        domain.daysUntilExpiry <= 30 ? 'text-orange-600 font-medium' :
                        domain.daysUntilExpiry <= 90 ? 'text-yellow-600' :
                        'text-green-600'
                      }>
                        {domain.daysUntilExpiry} 天
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getWhoisStatusBadge(domain.status, domain.daysUntilExpiry)}>
                      {getStatusText(domain.status, domain.daysUntilExpiry)}
                    </Badge>
                    {domain.error && (
                      <div className="text-xs text-red-600 mt-1" title={domain.error}>
                        {domain.error.length > 50 ? `${domain.error.substring(0, 50)}...` : domain.error}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {domains.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              暂无域名whois数据
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
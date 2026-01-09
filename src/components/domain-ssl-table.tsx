'use client';

import { useState } from 'react';
import { DomainSslStatus } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, Shield } from 'lucide-react';

interface DomainSslTableProps {
  domains: DomainSslStatus[];
  loading?: boolean;
  onRefresh?: () => void;
}

interface RegionCertCardProps {
  region: string;
  records: Array<{
    record: string;
    remaining_days: string;
  }>;
}

function RegionCertCard({ region, records }: RegionCertCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="font-medium text-sm text-muted-foreground mb-3">
        {region}
      </div>
      <div className="space-y-2">
        {records.map((record, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-muted last:border-b-0">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">
                RECORD
              </div>
              <div className="text-sm font-mono break-all">
                {record.record}
              </div>
            </div>
            <div className="ml-4 text-right">
              <div className="text-xs text-muted-foreground mb-1">
                REMAINING DAYS
              </div>
              <div className={`text-lg font-bold ${
                parseInt(record.remaining_days) <= 0 ? 'text-red-600' :
                parseInt(record.remaining_days) <= 7 ? 'text-red-500' :
                parseInt(record.remaining_days) <= 30 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {parseInt(record.remaining_days) <= 0 ? 'EXPIRED' : record.remaining_days}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDomainStatusBadge(status: string, minDays: number) {
  if (status === 'no_data') {
    return (
      <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200">
        无数据
      </Badge>
    );
  }
  
  if (status === 'error') {
    return (
      <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
        错误
      </Badge>
    );
  }

  if (minDays <= 0) {
    return (
      <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
        已过期
      </Badge>
    );
  } else if (minDays <= 7) {
    return (
      <Badge variant="outline" className="text-red-500 bg-red-50 border-red-200">
        紧急
      </Badge>
    );
  } else if (minDays <= 30) {
    return (
      <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
        即将过期
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
        正常
      </Badge>
    );
  }
}

export default function DomainSslTable({ domains, loading = false, onRefresh }: DomainSslTableProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              域名SSL证书状态
            </CardTitle>
            <CardDescription>
              SSL证书监控和过期提醒 ({domains.length} 个域名)
            </CardDescription>
          </div>
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '检查中...' : '刷新'}
          </Button>
        </div>
        
        {/* Status Summary */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {domains.filter(d => d.status === 'error' || d.minDays <= 0).length}
            </Badge>
            <span className="text-sm text-muted-foreground">错误/过期</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {domains.filter(d => d.status === 'success' && d.minDays > 0 && d.minDays <= 30).length}
            </Badge>
            <span className="text-sm text-muted-foreground">即将过期</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              {domains.filter(d => d.status === 'success' && d.minDays > 30).length}
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
              <TableHead className="w-12"></TableHead>
              <TableHead>域名</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>MinDays</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : domains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  暂无域名数据
                </TableCell>
              </TableRow>
            ) : (
              domains.map((domain) => (
                <Collapsible key={domain.domain} asChild>
                  <>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => toggleDomain(domain.domain)}
                            disabled={domain.status !== 'success'}
                          >
                            {expandedDomains.has(domain.domain) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-medium">
                        {domain.domain}
                      </TableCell>
                      <TableCell>
                        {getDomainStatusBadge(domain.status, domain.minDays)}
                      </TableCell>
                      <TableCell>
                        {domain.status === 'success' ? (
                          <span className={`font-medium ${
                            domain.minDays <= 0 ? 'text-red-600' :
                            domain.minDays <= 7 ? 'text-red-500' :
                            domain.minDays <= 30 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {domain.minDays <= 0 ? '已过期' : `${domain.minDays} 天`}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {domain.status === 'success' && (
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/20 p-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(domain.regions).map(([region, records]) => (
                                  <RegionCertCard 
                                    key={region} 
                                    region={region} 
                                    records={records} 
                                  />
                                ))}
                              </div>
                              {Object.keys(domain.regions).length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                  该域名暂无地区证书数据
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    )}
                    {domain.status === 'no_data' && (
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/20 p-6">
                            <div className="text-center text-muted-foreground">
                              <div className="font-medium mb-1">无监控数据</div>
                              <div className="text-sm">{domain.error || 'No metrics data available'}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    )}
                  </>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import { CertificateListProps } from '@/types';
import { getStatusColor, getStatusText, formatDate } from '@/lib/certificate-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

export default function CertificateTable({ certificates, loading = false, onRefresh }: CertificateListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">SSL 证书状态</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>域名</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>剩余天数</TableHead>
              <TableHead>到期时间</TableHead>
              <TableHead>签发机构</TableHead>
              <TableHead>最后检查</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : certificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无证书数据
                </TableCell>
              </TableRow>
            ) : (
              certificates.map((cert) => (
                <TableRow key={cert.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <div>{cert.fullDomain}</div>
                      {cert.region && (
                        <div className="text-sm text-muted-foreground">{cert.region}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(cert.status)}
                    >
                      {getStatusText(cert.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      cert.daysRemaining <= 0 ? 'text-red-600' :
                      cert.daysRemaining <= 7 ? 'text-red-500' :
                      cert.daysRemaining <= 30 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {cert.daysRemaining <= 0 ? '已过期' : `${cert.daysRemaining} 天`}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatDate(cert.validTo)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {cert.issuer}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(cert.lastChecked)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
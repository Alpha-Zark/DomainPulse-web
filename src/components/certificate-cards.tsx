'use client';

import { Certificate } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusText } from '@/lib/certificate-utils';

interface CertificateCardsProps {
  certificates: Certificate[];
}

interface RegionGroup {
  [region: string]: Certificate[];
}

export default function CertificateCards({ certificates }: CertificateCardsProps) {
  // Group certificates by region
  const groupedByRegion = certificates.reduce<RegionGroup>((acc, cert) => {
    const region = cert.region || '未分组';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(cert);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">区域证书详情</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedByRegion).map(([region, certs]) => (
          <Card key={region} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">{region}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {certs.map((cert) => (
                <div 
                  key={cert.id} 
                  className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      IP/RECORD
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      REMAINING DAYS
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono text-foreground truncate">
                        {cert.fullDomain}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={`text-lg font-bold ${
                        cert.daysRemaining <= 0 ? 'text-red-600' :
                        cert.daysRemaining <= 7 ? 'text-red-500' :
                        cert.daysRemaining <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {cert.daysRemaining <= 0 ? 'EXPIRED' : cert.daysRemaining}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(cert.status)} text-xs`}
                    >
                      {getStatusText(cert.status)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {cert.issuer}
                    </div>
                  </div>
                </div>
              ))}
              
              {certs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  该区域暂无证书
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {Object.keys(groupedByRegion).length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium mb-2">暂无证书数据</div>
              <div className="text-sm">请添加域名监控或刷新数据</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
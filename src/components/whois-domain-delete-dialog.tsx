'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminWhoisDomain } from '@/types/api';
import { whoisDomainsApi, ApiError } from '@/lib/api-client';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface WhoisDomainDeleteDialogProps {
  domain: AdminWhoisDomain;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export default function WhoisDomainDeleteDialog({ 
  domain, 
  onSuccess, 
  trigger 
}: WhoisDomainDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await whoisDomainsApi.delete(domain.id);
      
      // Success
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to delete whois domain:', error);
      
      if (error instanceof ApiError) {
        setError(`删除失败: ${error.message}`);
      } else {
        setError('删除域名失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            确认删除域名
          </DialogTitle>
          <DialogDescription>
            此操作不可撤销。删除后，该域名将不再进行whois监控。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <div className="font-medium mb-2">即将删除的域名:</div>
            <div className="text-lg font-semibold text-red-600 mb-2">
              {domain.domain}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>域名ID: {domain.id}</div>
              <div>创建时间: {new Date(domain.created_at).toLocaleString('zh-CN')}</div>
              <div>最后更新: {new Date(domain.updated_at).toLocaleString('zh-CN')}</div>
              <div>状态: {domain.enabled ? '已启用' : '已禁用'}</div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>警告:</strong> 删除域名后，相关的whois监控记录和历史数据可能会丢失。请确认您确实要删除此域名。
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
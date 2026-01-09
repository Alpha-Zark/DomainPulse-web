'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminWhoisDomain } from '@/types/api';
import { whoisDomainsApi, ApiError } from '@/lib/api-client';
import { Edit, AlertCircle, Loader2 } from 'lucide-react';

const formSchema = z.object({
  domain: z.string()
    .min(1, '域名不能为空')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*\.[a-zA-Z]{2,}$/, '请输入有效的域名格式'),
  enabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface WhoisDomainEditDialogProps {
  domain: AdminWhoisDomain;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export default function WhoisDomainEditDialog({ 
  domain, 
  onSuccess, 
  trigger 
}: WhoisDomainEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Initialize form with domain data when dialog opens
  useEffect(() => {
    if (open && domain) {
      setValue('domain', domain.domain);
      setValue('enabled', domain.enabled);
    }
  }, [open, domain, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      await whoisDomainsApi.update(domain.id, data.domain, data.enabled);

      // Success
      setOpen(false);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to update whois domain:', error);

      if (error instanceof ApiError) {
        setError(`更新失败: ${error.message}`);
      } else {
        setError('更新域名失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        reset();
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>编辑Whois域名</DialogTitle>
            <DialogDescription>
              修改域名配置信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-domain">域名</Label>
              <Input
                id="edit-domain"
                type="text"
                placeholder="example.com"
                {...register('domain')}
                disabled={loading}
                className={errors.domain ? 'border-red-500' : ''}
              />
              {errors.domain && (
                <p className="text-sm text-red-600">{errors.domain.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="edit-enabled"
                type="checkbox"
                {...register('enabled')}
                disabled={loading}
              />
              <Label htmlFor="edit-enabled">启用监控</Label>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <div className="font-medium mb-1">当前信息:</div>
              <div>ID: {domain.id}</div>
              <div>创建时间: {new Date(domain.created_at).toLocaleDateString('zh-CN')}</div>
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? '更新中...' : '保存更改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
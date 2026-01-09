'use client';

import { useState } from 'react';
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
import { whoisDomainsApi, ApiError } from '@/lib/api-client';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';

const formSchema = z.object({
  domain: z.string()
    .min(1, '域名不能为空')
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/,
      '请输入有效的域名格式'
    ),
});

type FormData = z.infer<typeof formSchema>;

interface WhoisDomainAddDialogProps {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export default function WhoisDomainAddDialog({ onSuccess, trigger }: WhoisDomainAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      await whoisDomainsApi.create(data.domain);
      
      // Success
      setOpen(false);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to create whois domain:', error);
      
      if (error instanceof ApiError) {
        setError(`创建失败: ${error.message}`);
      } else {
        setError('创建域名失败，请稍后重试');
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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            添加域名
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>添加Whois域名</DialogTitle>
            <DialogDescription>
              添加新的域名到whois监控列表中
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
              <Label htmlFor="domain">域名</Label>
              <Input
                id="domain"
                {...register('domain')}
                placeholder="例如: example.com"
                disabled={loading}
                className={errors.domain ? 'border-red-500' : ''}
              />
              {errors.domain && (
                <p className="text-sm text-red-600">{errors.domain.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                请输入完整的域名，不包含协议前缀
              </p>
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
              {loading ? '添加中...' : '添加域名'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
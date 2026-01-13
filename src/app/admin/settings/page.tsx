'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Mail,
  Save,
  Clock,
  Loader2,
  CheckCircle,
  Edit,
  X
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import AdminLayout from '@/components/admin-layout';
import { settingsApi, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Edit mode states
  const [isEditingCron, setIsEditingCron] = useState(false);
  const [isEditingAlert, setIsEditingAlert] = useState(false);
  const [isEditingSendGrid, setIsEditingSendGrid] = useState(false);

  // Cron Configuration State
  const [cronConfig, setCronConfig] = useState({
    cronExpr: '0 */12 * * *',
  });
  const [cronConfigBackup, setCronConfigBackup] = useState({
    cronExpr: '0 */12 * * *',
  });

  // Alert Configuration State
  const [alertConfig, setAlertConfig] = useState({
    enabled: true,
    certWarning: 30,
    certCritical: 7,
    whoisWarning: 90,
    whoisCritical: 30,
    checkInterval: 12,
  });
  const [alertConfigBackup, setAlertConfigBackup] = useState({
    enabled: true,
    certWarning: 30,
    certCritical: 7,
    whoisWarning: 90,
    whoisCritical: 30,
    checkInterval: 12,
  });

  // SendGrid Configuration State
  const [sendGridConfig, setSendGridConfig] = useState({
    enabled: false,
    apiKey: '',
    fromEmail: 'noreply@example.com',
    fromName: 'SSL监控系统',
    toEmails: '',
  });
  const [sendGridConfigBackup, setSendGridConfigBackup] = useState({
    enabled: false,
    apiKey: '',
    fromEmail: 'noreply@example.com',
    fromName: 'SSL监控系统',
    toEmails: '',
  });

  // Fetch all configurations on mount
  useEffect(() => {
    fetchAllConfigs();
  }, []);

  const fetchAllConfigs = async () => {
    try {
      setLoading(true);

      // Fetch cron config
      const cronResp = await settingsApi.cron.get();
      const cronData = { cronExpr: cronResp.cron_expr };
      setCronConfig(cronData);
      setCronConfigBackup(cronData);

      // Fetch alert config
      const alertResp = await settingsApi.alert.get();
      const alertData = {
        enabled: alertResp.alertmanager.enabled,
        certWarning: alertResp.alertmanager.cert.warning,
        certCritical: alertResp.alertmanager.cert.critical,
        whoisWarning: alertResp.alertmanager.whois.warning,
        whoisCritical: alertResp.alertmanager.whois.critical,
        checkInterval: alertResp.alertmanager.check_interval,
      };
      setAlertConfig(alertData);
      setAlertConfigBackup(alertData);

      // Fetch sendgrid config
      const sendgridResp = await settingsApi.sendgrid.get();
      const sendgridData = {
        enabled: sendgridResp.sendgrid.enabled,
        apiKey: sendgridResp.sendgrid.api_key,
        fromEmail: sendgridResp.sendgrid.from_email,
        fromName: sendgridResp.sendgrid.from_name,
        toEmails: sendgridResp.sendgrid.to_emails,
      };
      setSendGridConfig(sendgridData);
      setSendGridConfigBackup(sendgridData);
    } catch (error) {
      console.error('Failed to fetch configurations:', error);
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  // Edit mode handlers
  const handleEditCron = () => {
    setCronConfigBackup(cronConfig);
    setIsEditingCron(true);
  };

  const handleCancelCronEdit = () => {
    setCronConfig(cronConfigBackup);
    setIsEditingCron(false);
  };

  const handleEditAlert = () => {
    setAlertConfigBackup(alertConfig);
    setIsEditingAlert(true);
  };

  const handleCancelAlertEdit = () => {
    setAlertConfig(alertConfigBackup);
    setIsEditingAlert(false);
  };

  const handleEditSendGrid = () => {
    setSendGridConfigBackup(sendGridConfig);
    setIsEditingSendGrid(true);
  };

  const handleCancelSendGridEdit = () => {
    setSendGridConfig(sendGridConfigBackup);
    setIsEditingSendGrid(false);
  };

  const handleCronSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('cron');

    try {
      await settingsApi.cron.update(cronConfig.cronExpr);
      toast.success('定时任务配置已更新');
      setCronConfigBackup(cronConfig);
      setIsEditingCron(false);
    } catch (error) {
      console.error('Failed to update cron config:', error);
      if (error instanceof ApiError) {
        toast.error(`更新失败: ${error.message}`);
      } else {
        toast.error('更新失败，请稍后重试');
      }
    } finally {
      setSaving(null);
    }
  };

  const handleAlertConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('alert');

    try {
      await settingsApi.alert.update({
        alertmanager: {
          enabled: alertConfig.enabled,
          cert: {
            warning: alertConfig.certWarning,
            critical: alertConfig.certCritical,
          },
          whois: {
            warning: alertConfig.whoisWarning,
            critical: alertConfig.whoisCritical,
          },
          check_interval: alertConfig.checkInterval,
        },
      });
      toast.success('告警配置已更新');
      setAlertConfigBackup(alertConfig);
      setIsEditingAlert(false);
    } catch (error) {
      console.error('Failed to update alert config:', error);
      if (error instanceof ApiError) {
        toast.error(`更新失败: ${error.message}`);
      } else {
        toast.error('更新失败，请稍后重试');
      }
    } finally {
      setSaving(null);
    }
  };

  const handleTestAlert = async () => {
    setSaving('alert-test');

    try {
      await settingsApi.alert.test();
      toast.success('测试邮件已发送');
    } catch (error) {
      console.error('Failed to send test alert:', error);
      if (error instanceof ApiError) {
        toast.error(`发送失败: ${error.message}`);
      } else {
        toast.error('发送失败，请稍后重试');
      }
    } finally {
      setSaving(null);
    }
  };

  const handleSendGridConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('sendgrid');

    try {
      await settingsApi.sendgrid.update({
        sendgrid: {
          enabled: sendGridConfig.enabled,
          api_key: sendGridConfig.apiKey,
          from_email: sendGridConfig.fromEmail,
          from_name: sendGridConfig.fromName,
          to_emails: sendGridConfig.toEmails,
        },
      });
      toast.success('SendGrid 配置已更新');
      setSendGridConfigBackup(sendGridConfig);
      setIsEditingSendGrid(false);
    } catch (error) {
      console.error('Failed to update SendGrid config:', error);
      if (error instanceof ApiError) {
        toast.error(`更新失败: ${error.message}`);
      } else {
        toast.error('更新失败，请稍后重试');
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">系统设置</h1>
            <p className="text-muted-foreground mt-2">
              配置系统定时任务、告警和通知选项
            </p>
          </div>

          {/* Cron Configuration Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>定时任务配置</CardTitle>
              </div>
              <CardDescription>
                配置证书和域名检查的执行时间（Cron 表达式）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCronSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cronExpr">Cron 表达式</Label>
                  <Input
                    id="cronExpr"
                    placeholder="0 */12 * * *"
                    value={cronConfig.cronExpr}
                    onChange={(e) => setCronConfig({ cronExpr: e.target.value })}
                    disabled={!isEditingCron || saving !== null}
                    readOnly={!isEditingCron}
                  />
                  <p className="text-xs text-muted-foreground">
                    标准 5 字段格式：分 时 日 月 周 (例如: 0 */12 * * * 表示每 12 小时执行一次)
                  </p>
                </div>

                {!isEditingCron ? (
                  <Button type="button" onClick={handleEditCron} disabled={saving !== null}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑配置
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" disabled={saving !== null}>
                      {saving === 'cron' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {saving !== 'cron' && <Save className="mr-2 h-4 w-4" />}
                      保存配置
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelCronEdit}
                      disabled={saving !== null}
                    >
                      <X className="mr-2 h-4 w-4" />
                      取消
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Alert Configuration Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>告警配置</CardTitle>
              </div>
              <CardDescription>
                配置证书和域名过期告警的阈值
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAlertConfigSubmit} className="space-y-6">
                {/* Enable Alert Toggle */}
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <input
                    id="alertEnabled"
                    type="checkbox"
                    checked={alertConfig.enabled}
                    onChange={(e) => setAlertConfig({ ...alertConfig, enabled: e.target.checked })}
                    className="h-4 w-4"
                    disabled={!isEditingAlert || saving !== null}
                  />
                  <Label htmlFor="alertEnabled" className="font-medium">
                    启用告警通知
                  </Label>
                </div>

                {/* Certificate Expiry Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">证书过期告警</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certWarning">预警天数</Label>
                      <Input
                        id="certWarning"
                        type="number"
                        min="1"
                        value={alertConfig.certWarning}
                        onChange={(e) => setAlertConfig({
                          ...alertConfig,
                          certWarning: parseInt(e.target.value)
                        })}
                        disabled={!isEditingAlert || saving !== null}
                        readOnly={!isEditingAlert}
                      />
                      <p className="text-xs text-muted-foreground">
                        证书剩余天数低于此值时发送预警通知
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certCritical">紧急天数</Label>
                      <Input
                        id="certCritical"
                        type="number"
                        min="1"
                        value={alertConfig.certCritical}
                        onChange={(e) => setAlertConfig({
                          ...alertConfig,
                          certCritical: parseInt(e.target.value)
                        })}
                        disabled={!isEditingAlert || saving !== null}
                        readOnly={!isEditingAlert}
                      />
                      <p className="text-xs text-muted-foreground">
                        证书剩余天数低于此值时发送紧急通知
                      </p>
                    </div>
                  </div>
                </div>

                {/* Whois Expiry Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">域名过期告警</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whoisWarning">预警天数</Label>
                      <Input
                        id="whoisWarning"
                        type="number"
                        min="1"
                        value={alertConfig.whoisWarning}
                        onChange={(e) => setAlertConfig({
                          ...alertConfig,
                          whoisWarning: parseInt(e.target.value)
                        })}
                        disabled={!isEditingAlert || saving !== null}
                        readOnly={!isEditingAlert}
                      />
                      <p className="text-xs text-muted-foreground">
                        域名剩余天数低于此值时发送预警通知
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whoisCritical">紧急天数</Label>
                      <Input
                        id="whoisCritical"
                        type="number"
                        min="1"
                        value={alertConfig.whoisCritical}
                        onChange={(e) => setAlertConfig({
                          ...alertConfig,
                          whoisCritical: parseInt(e.target.value)
                        })}
                        disabled={!isEditingAlert || saving !== null}
                        readOnly={!isEditingAlert}
                      />
                      <p className="text-xs text-muted-foreground">
                        域名剩余天数低于此值时发送紧急通知
                      </p>
                    </div>
                  </div>
                </div>

                {/* Check Interval */}
                <div className="space-y-2">
                  <Label htmlFor="checkInterval">检查间隔（小时）</Label>
                  <Input
                    id="checkInterval"
                    type="number"
                    min="1"
                    max="48"
                    value={alertConfig.checkInterval}
                    onChange={(e) => setAlertConfig({
                      ...alertConfig,
                      checkInterval: parseInt(e.target.value)
                    })}
                    disabled={!isEditingAlert || saving !== null}
                    readOnly={!isEditingAlert}
                  />
                  <p className="text-xs text-muted-foreground">
                    告警检查的时间间隔
                  </p>
                </div>

                {!isEditingAlert ? (
                  <Button type="button" onClick={handleEditAlert} disabled={saving !== null}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑配置
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" disabled={saving !== null}>
                      {saving === 'alert' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {saving !== 'alert' && <Save className="mr-2 h-4 w-4" />}
                      保存配置
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelAlertEdit}
                      disabled={saving !== null}
                    >
                      <X className="mr-2 h-4 w-4" />
                      取消
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* SendGrid Configuration Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <CardTitle>SendGrid 配置</CardTitle>
              </div>
              <CardDescription>
                配置 SendGrid 邮件服务用于发送告警通知
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendGridConfigSubmit} className="space-y-6">
                {/* Enable SendGrid Toggle */}
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <input
                    id="sendgridEnabled"
                    type="checkbox"
                    checked={sendGridConfig.enabled}
                    onChange={(e) => setSendGridConfig({ ...sendGridConfig, enabled: e.target.checked })}
                    className="h-4 w-4"
                    disabled={!isEditingSendGrid || saving !== null}
                  />
                  <Label htmlFor="sendgridEnabled" className="font-medium">
                    启用 SendGrid 邮件服务
                  </Label>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={sendGridConfig.apiKey}
                    onChange={(e) => setSendGridConfig({
                      ...sendGridConfig,
                      apiKey: e.target.value
                    })}
                    disabled={!isEditingSendGrid || saving !== null}
                    readOnly={!isEditingSendGrid}
                  />
                  <p className="text-xs text-muted-foreground">
                    请从 SendGrid 控制台获取 API Key
                  </p>
                </div>

                {/* From Email */}
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">发件人邮箱</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="noreply@example.com"
                    value={sendGridConfig.fromEmail}
                    onChange={(e) => setSendGridConfig({
                      ...sendGridConfig,
                      fromEmail: e.target.value
                    })}
                    disabled={!isEditingSendGrid || saving !== null}
                    readOnly={!isEditingSendGrid}
                  />
                  <p className="text-xs text-muted-foreground">
                    必须是已在 SendGrid 验证的发件人邮箱
                  </p>
                </div>

                {/* From Name */}
                <div className="space-y-2">
                  <Label htmlFor="fromName">发件人名称</Label>
                  <Input
                    id="fromName"
                    type="text"
                    placeholder="SSL监控系统"
                    value={sendGridConfig.fromName}
                    onChange={(e) => setSendGridConfig({
                      ...sendGridConfig,
                      fromName: e.target.value
                    })}
                    disabled={!isEditingSendGrid || saving !== null}
                    readOnly={!isEditingSendGrid}
                  />
                  <p className="text-xs text-muted-foreground">
                    邮件中显示的发件人名称
                  </p>
                </div>

                {/* To Emails */}
                <div className="space-y-2">
                  <Label htmlFor="toEmails">收件人邮箱</Label>
                  <Input
                    id="toEmails"
                    type="text"
                    placeholder="admin@example.com,ops@example.com"
                    value={sendGridConfig.toEmails}
                    onChange={(e) => setSendGridConfig({
                      ...sendGridConfig,
                      toEmails: e.target.value
                    })}
                    disabled={!isEditingSendGrid || saving !== null}
                    readOnly={!isEditingSendGrid}
                  />
                  <p className="text-xs text-muted-foreground">
                    多个邮箱地址请用逗号分隔
                  </p>
                </div>

                {!isEditingSendGrid ? (
                  <Button type="button" onClick={handleEditSendGrid} disabled={saving !== null}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑配置
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" disabled={saving !== null}>
                      {saving === 'sendgrid' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {saving !== 'sendgrid' && <Save className="mr-2 h-4 w-4" />}
                      保存配置
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelSendGridEdit}
                      disabled={saving !== null}
                    >
                      <X className="mr-2 h-4 w-4" />
                      取消
                    </Button>
                  </div>
                )}

                {/* Test Email Button */}
                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestAlert}
                    disabled={saving !== null}
                    className="w-full sm:w-auto"
                  >
                    {saving === 'alert-test' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving !== 'alert-test' && <Mail className="mr-2 h-4 w-4" />}
                    发送测试邮件
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    发送测试邮件以验证 SendGrid 配置是否正确
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">配置已连接到后端</p>
                  <p>
                    所有配置更改将实时保存到数据库。定时任务配置更新后会立即重新调度，告警配置和 SendGrid 配置更新后立即生效。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

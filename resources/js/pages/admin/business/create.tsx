import { Head, Link, useForm } from '@inertiajs/react';
import { index as businessIndex } from '@/routes/admin/business';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Using native textarea instead of missing component
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dashboard } from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';

export default function BusinessCreate() {
    const { t } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.business'),
            href: businessIndex().url,
        },
        {
            title: t('business.create'),
            href: '/admin/business/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        business_name: '',
        business_number: '',
        vat_number: '',
        business_address: '',
        is_default: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/business');
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('business.createNew')} />
            
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={businessIndex()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('common.back')}
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('business.createNew')}</h1>
                        <p className="text-muted-foreground">
                            {t('business.createDescription')}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            {t('business.businessDetails')}
                        </CardTitle>
                        <CardDescription>
                            {t('business.businessDetailsDescription')}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="business_name">{t('business.name')} *</Label>
                                    <Input
                                        id="business_name"
                                        value={data.business_name}
                                        onChange={(e) => setData('business_name', e.target.value)}
                                        placeholder={t('business.namePlaceholder')}
                                        className={errors.business_name ? 'border-destructive' : ''}
                                    />
                                    {errors.business_name && (
                                        <p className="text-sm text-destructive">{errors.business_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business_number">{t('business.businessNumber')} *</Label>
                                    <Input
                                        id="business_number"
                                        value={data.business_number}
                                        onChange={(e) => setData('business_number', e.target.value)}
                                        placeholder={t('business.businessNumberPlaceholder')}
                                        className={errors.business_number ? 'border-destructive' : ''}
                                    />
                                    {errors.business_number && (
                                        <p className="text-sm text-destructive">{errors.business_number}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vat_number">{t('business.vatNumber')} *</Label>
                                <Input
                                    id="vat_number"
                                    value={data.vat_number}
                                    onChange={(e) => setData('vat_number', e.target.value)}
                                    placeholder={t('business.vatNumberPlaceholder')}
                                    className={errors.vat_number ? 'border-destructive' : ''}
                                />
                                {errors.vat_number && (
                                    <p className="text-sm text-destructive">{errors.vat_number}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="business_address">{t('business.address')} *</Label>
                                <textarea
                                    id="business_address"
                                    value={data.business_address}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('business_address', e.target.value)}
                                    placeholder={t('business.addressPlaceholder')}
                                    rows={4}
                                    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.business_address ? 'border-destructive' : ''}`}
                                />
                                {errors.business_address && (
                                    <p className="text-sm text-destructive">{errors.business_address}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_default"
                                    checked={data.is_default}
                                    onCheckedChange={(checked) => setData('is_default', checked as boolean)}
                                />
                                <Label htmlFor="is_default" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {t('business.setAsDefault')}
                                </Label>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('forms.saving') : t('business.create')}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={businessIndex()}>{t('common.cancel')}</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

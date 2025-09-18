import { Head, Link, router } from '@inertiajs/react';
import { index as businessIndex, create as businessCreate, edit as businessEdit, setDefault as businessSetDefault } from '@/routes/admin/business';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Plus, Edit, Trash2, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboard } from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';

interface BusinessInfo {
    id: number;
    business_name: string;
    business_number: string;
    vat_number: string;
    business_address: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    businessInfo: BusinessInfo[];
}

export default function BusinessIndex({ businessInfo }: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.business'),
            href: '/admin/business',
        },
    ];

    const handleDelete = (id: number) => {
        router.delete(`/admin/business/${id}`, {
            onStart: () => setDeletingId(id),
            onFinish: () => setDeletingId(null),
        });
    };

    const handleSetDefault = (id: number) => {
        router.post(`/admin/business/${id}/set-default`);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('business.title')} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('business.title')}</h1>
                        <p className="text-muted-foreground">
                            {t('business.description')}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={businessCreate()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('business.create')}
                        </Link>
                    </Button>
                </div>

                {businessInfo.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">{t('table.noData')}</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {t('business.description')}
                            </p>
                            <Button asChild>
                                <Link href={businessCreate()}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('business.create')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {businessInfo.map((business) => (
                            <Card key={business.id} className="relative">
                                {business.is_default && (
                                    <Badge className="absolute top-4 right-4" variant="default">
                                        <Star className="mr-1 h-3 w-3" />
                                        {t('business.default')}
                                    </Badge>
                                )}
                                
                                <CardHeader>
                                    <CardTitle className="text-lg">{business.business_name}</CardTitle>
                                    <CardDescription>
                                        {t('business.businessNumber')}: {business.business_number}
                                    </CardDescription>
                                </CardHeader>
                                
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('business.vatNumber')}</p>
                                        <p className="text-sm">{business.vat_number}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('business.address')}</p>
                                        <p className="text-sm">{business.business_address}</p>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="flex-1"
                                        >
                                            <Link href={businessEdit(business.id)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                {t('common.edit')}
                                            </Link>
                                        </Button>
                                        
                                        {!business.is_default && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSetDefault(business.id)}
                                            >
                                                <Star className="mr-2 h-4 w-4" />
                                                {t('business.setDefault')}
                                            </Button>
                                        )}
                                        
                                        {businessInfo.length > 1 && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('business.deleteConfirm')}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(business.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            {deletingId === business.id ? t('common.loading') : t('common.delete')}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

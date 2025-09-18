import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import AdminLayout from '@/layouts/admin/admin-layout';
import AdminSettingsLayout from '@/layouts/admin/admin-settings-layout';

export default function AdminAppearance() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.appearance.title'),
            href: '/admin/settings/appearance',
        },
    ];
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.appearance.title')} />

            <AdminSettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('settings.appearance.title')} description={t('settings.appearance.description')} />
                    <AppearanceTabs />
                </div>
            </AdminSettingsLayout>
        </AdminLayout>
    );
}

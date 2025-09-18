import { Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import LanguageSettings from '@/components/language-settings';
import { type BreadcrumbItem } from '@/types';

import AdminLayout from '@/layouts/admin/admin-layout';
import AdminSettingsLayout from '@/layouts/admin/admin-settings-layout';
import { useTranslation } from 'react-i18next';

export default function AdminLanguage() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.language.title'),
            href: '/admin/settings/language',
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.language.title')} />

            <AdminSettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title={t('settings.language.title')} 
                        description={t('settings.language.description')} 
                    />
                    <LanguageSettings />
                </div>
            </AdminSettingsLayout>
        </AdminLayout>
    );
}

import { Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import LanguageSettings from '@/components/language-settings';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useTranslation } from 'react-i18next';

export default function Language() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.language.title'),
            href: '/settings/language',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.language.title')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title={t('settings.language.title')} 
                        description={t('settings.language.description')} 
                    />
                    <LanguageSettings />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

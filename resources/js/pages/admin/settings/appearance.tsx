import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import AdminLayout from '@/layouts/admin/admin-layout';
import AdminSettingsLayout from '@/layouts/admin/admin-settings-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: '/admin/settings/appearance',
    },
];

export default function AdminAppearance() {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <AdminSettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Appearance settings" description="Update your account's appearance settings" />
                    <AppearanceTabs />
                </div>
            </AdminSettingsLayout>
        </AdminLayout>
    );
}

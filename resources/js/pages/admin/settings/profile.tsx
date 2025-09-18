import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import DeleteAdmin from '@/components/admin/delete-admin';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin/admin-layout';
import AdminSettingsLayout from '@/layouts/admin/admin-settings-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

export default function AdminProfile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { admin } = usePage<SharedData>().props;
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.profile.title'),
            href: '/admin/settings/profile',
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.profile.title')} />

            <AdminSettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('settings.profile.informationTitle')} description={t('settings.profile.informationDescription')} />

                    <Form
                        method="patch"
                        action="/admin/settings/profile"
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">{t('settings.profile.emailAddress')}</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={admin.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder={t('settings.profile.emailAddressPlaceholder')}
                                    />

                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                {mustVerifyEmail && admin.email_verified_at === null && (
                                    <div>
                                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                                            {t('settings.profile.emailUnverified')}
                                            <Link
                                                href="/admin/email/verification-notification"
                                                method="post"
                                                as="button"
                                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                                            >
                                                {t('settings.profile.resendVerification')}
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                                {t('settings.profile.verificationSent')}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>{t('settings.profile.save')}</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.profile.saved')}</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>

                    <DeleteAdmin />
                </div>
            </AdminSettingsLayout>
        </AdminLayout>
    );
}

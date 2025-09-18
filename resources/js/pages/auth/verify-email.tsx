// Components
import EmailVerificationNotificationController from '@/actions/App/Http/Controllers/Auth/EmailVerificationNotificationController';
import { logout } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import LanguageSelector from '@/components/language-selector';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation();

    return (
        <AuthLayout title={t('auth.verifyEmail.title')} description={t('auth.verifyEmail.description')}>
            <Head title={t('auth.verifyEmail.title')} />

            <div className="flex justify-end mb-4">
                <LanguageSelector variant="outline" size="sm" />
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {t('auth.verifyEmail.linkSent')}
                </div>
            )}

            <Form {...EmailVerificationNotificationController.store.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {t('auth.verifyEmail.resendButton')}
                        </Button>

                        <TextLink href={logout()} className="mx-auto block text-sm">
                            {t('auth.verifyEmail.logoutButton')}
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}

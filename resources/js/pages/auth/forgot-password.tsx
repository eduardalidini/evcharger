// Components
import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import LanguageSelector from '@/components/language-selector';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();

    return (
        <AuthLayout title={t('auth.forgotPassword.title')} description={t('auth.forgotPassword.description')}>
            <Head title={t('auth.forgotPassword.title')} />

            <div className="flex justify-end mb-4">
                <LanguageSelector variant="outline" size="sm" />
            </div>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

            <div className="space-y-6">
                <Form {...PasswordResetLinkController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.login.email')}</Label>
                                <Input id="email" type="email" name="email" autoComplete="off" autoFocus placeholder={t('auth.login.emailPlaceholder')} />

                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button className="w-full" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {t('auth.forgotPassword.sendButton')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <TextLink href={login()}>{t('auth.forgotPassword.backToLogin')}</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}

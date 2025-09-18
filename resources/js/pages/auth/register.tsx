import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
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

export default function Register() {
    const { t } = useTranslation();

    return (
        <AuthLayout title={t('auth.register.title')} description={t('auth.register.description')}>
            <Head title={t('auth.register.title')} />

            <div className="flex justify-end mb-4">
                <LanguageSelector variant="outline" size="sm" />
            </div>
            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('auth.register.name')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="given-name"
                                    name="name"
                                    placeholder={t('auth.register.namePlaceholder')}
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="surname">{t('auth.register.surname')}</Label>
                                <Input
                                    id="surname"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    autoComplete="family-name"
                                    name="surname"
                                    placeholder={t('auth.register.surnamePlaceholder')}
                                />
                                <InputError message={errors.surname} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="id_number">{t('auth.register.idNumber')}</Label>
                                <Input
                                    id="id_number"
                                    type="text"
                                    required
                                    tabIndex={3}
                                    name="id_number"
                                    placeholder={t('auth.register.idNumberPlaceholder')}
                                />
                                <InputError message={errors.id_number} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_no">{t('auth.register.phoneNumber')}</Label>
                                <Input
                                    id="phone_no"
                                    type="tel"
                                    required
                                    tabIndex={4}
                                    autoComplete="tel"
                                    name="phone_no"
                                    placeholder={t('auth.register.phoneNumberPlaceholder')}
                                />
                                <InputError message={errors.phone_no} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.login.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={5}
                                    autoComplete="email"
                                    name="email"
                                    placeholder={t('auth.login.emailPlaceholder')}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="nipt">{t('auth.register.nipt')}</Label>
                                <Input
                                    id="nipt"
                                    type="text"
                                    tabIndex={6}
                                    name="nipt"
                                    placeholder={t('auth.register.niptPlaceholder')}
                                />
                                <InputError message={errors.nipt} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">{t('auth.login.password')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={7}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder={t('auth.login.passwordPlaceholder')}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">{t('auth.register.confirmPassword')}</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={8}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder={t('auth.register.confirmPasswordPlaceholder')}
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button type="submit" className="mt-2 w-full" tabIndex={9}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                {t('auth.register.registerButton')}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.register.hasAccount')}{' '}
                            <TextLink href={login()} tabIndex={10}>
                                {t('auth.register.signIn')}
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}

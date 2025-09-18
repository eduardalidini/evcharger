import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import LanguageSelector from '@/components/language-selector';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useTranslation();
    const { data, setData } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        const savedEmail = localStorage.getItem('userLoginEmail');
        const savedPassword = localStorage.getItem('userLoginPassword');
        const savedRemember = localStorage.getItem('userLoginRemember') === 'true';

        if (savedEmail) {
            setData('email', savedEmail);
        }
        if (savedPassword) {
            setData('password', savedPassword);
        }
        if (savedRemember) {
            setData('remember', savedRemember);
        }
    }, []);

    const handleRememberChange = (checked: boolean) => {
        setData('remember', checked);
        
        if (checked) {
            localStorage.setItem('userLoginEmail', data.email);
            localStorage.setItem('userLoginPassword', data.password);
            localStorage.setItem('userLoginRemember', 'true');
        } else {
            localStorage.removeItem('userLoginEmail');
            localStorage.removeItem('userLoginPassword');
            localStorage.removeItem('userLoginRemember');
        }
    };

    const handleEmailChange = (value: string) => {
        setData('email', value);
        if (data.remember) {
            localStorage.setItem('userLoginEmail', value);
        }
    };

    const handlePasswordChange = (value: string) => {
        setData('password', value);
        if (data.remember) {
            localStorage.setItem('userLoginPassword', value);
        }
    };

    return (
        <AuthLayout title={t('auth.login.title')} description={t('auth.login.description')}>
            <Head title={t('auth.login.title')} />

            <div className="flex justify-end mb-4">
                <LanguageSelector variant="outline" size="sm" />
            </div>

            <Form {...AuthenticatedSessionController.store.form()} className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.login.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    defaultValue={data.email}
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder={t('auth.login.emailPlaceholder')}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">{t('auth.login.password')}</Label>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                                            {t('auth.login.forgotPassword')}
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    defaultValue={data.password}
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t('auth.login.passwordPlaceholder')}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" checked={data.remember} value="true" tabIndex={3} onCheckedChange={(checked) => handleRememberChange(checked as boolean)} />
                                <Label htmlFor="remember">{t('auth.login.rememberMe')}</Label>
                            </div>

                            <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                {t('auth.login.loginButton')}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.login.noAccount')}{' '}
                            <TextLink href={register()} tabIndex={5}>
                                {t('auth.login.signUp')}
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}

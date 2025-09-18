import InputError from '@/components/input-error';
import LanguageSelector from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminAuthLayout from '@/layouts/admin/admin-auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { store as loginStore } from '@/routes/admin/login';
import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AdminLoginProps {
    status?: string;
}

export default function AdminLogin({ status }: AdminLoginProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        const savedEmail = localStorage.getItem('adminLoginEmail');
        const savedPassword = localStorage.getItem('adminLoginPassword');
        const savedRemember = localStorage.getItem('adminLoginRemember') === 'true';

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
            localStorage.setItem('adminLoginEmail', data.email);
            localStorage.setItem('adminLoginPassword', data.password);
            localStorage.setItem('adminLoginRemember', 'true');
        } else {
            localStorage.removeItem('adminLoginEmail');
            localStorage.removeItem('adminLoginPassword');
            localStorage.removeItem('adminLoginRemember');
        }
    };

    const handleEmailChange = (value: string) => {
        setData('email', value);
        if (data.remember) {
            localStorage.setItem('adminLoginEmail', value);
        }
    };

    const handlePasswordChange = (value: string) => {
        setData('password', value);
        if (data.remember) {
            localStorage.setItem('adminLoginPassword', value);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(loginStore().url);
    };

    return (
        <AdminAuthLayout title={t('auth.adminLogin.title')} description={t('auth.adminLogin.description')}>
            <Head title={t('auth.adminLogin.title')} />

            <div className="flex justify-end mb-4">
                <LanguageSelector variant="outline" size="sm" />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('auth.login.email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder={t('auth.adminLogin.emailPlaceholder')}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('auth.login.password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder={t('auth.login.passwordPlaceholder')}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox 
                            id="remember" 
                            checked={data.remember}
                            onCheckedChange={(checked) => handleRememberChange(checked as boolean)}
                            tabIndex={3} 
                        />
                        <Label htmlFor="remember">{t('auth.login.rememberMe')}</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {t('auth.adminLogin.loginButton')}
                    </Button>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AdminAuthLayout>
    );
}

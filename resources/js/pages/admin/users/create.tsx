import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, create as usersCreate, store as usersStore } from '@/routes/admin/users';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function CreateUser() {
    const { t } = useTranslation();
    const [userType, setUserType] = useState<'individual' | 'business'>('individual');
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        surname: '',
        id_number: '',
        phone_no: '',
        email: '',
        nipt: '',
        balance: '',
        password: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.users'),
            href: usersIndex().url,
        },
        {
            title: t('users.create'),
            href: usersCreate().url,
        },
    ];

    const handleUserTypeChange = (type: 'individual' | 'business') => {
        setUserType(type);
        // Clear NIPT if switching to individual user
        if (type === 'individual') {
            setData('nipt', '');
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Only include NIPT for business users
        if (userType === 'individual') {
            setData('nipt', '');
        }
        post(usersStore().url);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('users.create')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('users.create')}</h1>
                    <Link href={usersIndex().url}>
                        <Button variant="outline">{t('common.back')}</Button>
                    </Link>
                </div>

                <div className="max-w-2xl">
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <form onSubmit={submit} className="space-y-6">
                            {/* User Type Selection */}
                            <div className="space-y-2">
                                <Label>{t('users.userType')}</Label>
                                <Select value={userType} onValueChange={handleUserTypeChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('users.userTypePlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">{t('users.individual')}</SelectItem>
                                        <SelectItem value="business">{t('users.business')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('users.firstName')}</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                        placeholder={t('users.firstNamePlaceholder')}
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="surname">{t('users.lastName')}</Label>
                                    <Input
                                        id="surname"
                                        type="text"
                                        value={data.surname}
                                        onChange={(e) => setData('surname', e.target.value)}
                                        required
                                        placeholder={t('users.lastNamePlaceholder')}
                                    />
                                    <InputError message={errors.surname} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="id_number">{t('users.idNumber')}</Label>
                                    <Input
                                        id="id_number"
                                        type="text"
                                        value={data.id_number}
                                        onChange={(e) => setData('id_number', e.target.value)}
                                        required
                                        placeholder={t('users.idNumberPlaceholder')}
                                    />
                                    <InputError message={errors.id_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_no">{t('users.phoneNumber')}</Label>
                                    <Input
                                        id="phone_no"
                                        type="tel"
                                        value={data.phone_no}
                                        onChange={(e) => setData('phone_no', e.target.value)}
                                        required
                                        placeholder={t('users.phoneNumberPlaceholder')}
                                    />
                                    <InputError message={errors.phone_no} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('users.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        placeholder={t('users.emailPlaceholder')}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* NIPT field - only show for business users */}
                                {userType === 'business' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="nipt">{t('users.nipt')}</Label>
                                        <Input
                                            id="nipt"
                                            type="text"
                                            value={data.nipt}
                                            onChange={(e) => setData('nipt', e.target.value)}
                                            required
                                            placeholder={t('users.niptPlaceholder')}
                                        />
                                        <InputError message={errors.nipt} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="balance">{t('users.initialBalance')}</Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.balance}
                                        onChange={(e) => setData('balance', e.target.value)}
                                        placeholder={t('users.initialBalancePlaceholder')}
                                    />
                                    <InputError message={errors.balance} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('users.password')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        placeholder={t('users.passwordPlaceholder')}
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {t('users.create')}
                                </Button>
                                <Link href={usersIndex().url}>
                                    <Button type="button" variant="outline">
                                        {t('common.cancel')}
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

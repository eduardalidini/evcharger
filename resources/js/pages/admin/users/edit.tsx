import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, show as usersShow, edit as usersEdit, update as usersUpdate } from '@/routes/admin/users';
import { LoaderCircle } from 'lucide-react';

interface User {
    id: number;
    name: string;
    surname: string;
    id_number: string;
    phone_no: string;
    email: string;
    nipt: string | null;
    balance: number;
    user_type: 'individual' | 'business';
}

interface EditUserProps {
    user: User;
}

export default function EditUser({ user }: EditUserProps) {
    const { t } = useTranslation();
    const fromView = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'view';
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
            title: `Edit ${user.name} ${user.surname}`,
            href: usersEdit(user.id).url,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        surname: user.surname,
        id_number: user.id_number,
        phone_no: user.phone_no,
        email: user.email,
        nipt: user.nipt || '',
        // balance is treated as a delta: e.g., +500 or -500
        balance: '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear NIPT for individual users before submitting
        if (user.user_type === 'individual') {
            setData('nipt', '');
        }
        
        const url = fromView
            ? usersUpdate.url(user.id, { query: { from: 'view', type: user.user_type } })
            : usersUpdate(user.id, { query: { type: user.user_type } }).url;
        put(url);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Edit User: {user.name} {user.surname}</h1>
                    <Link href={fromView ? usersShow(user.id, { query: { type: user.user_type } }).url : usersIndex().url}>
                        <Button variant="outline">{fromView ? 'Back to View' : 'Back to Users'}</Button>
                    </Link>
                </div>

                <div className="max-w-2xl">
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">First Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Enter first name"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="surname">Last Name</Label>
                                    <Input
                                        id="surname"
                                        type="text"
                                        value={data.surname}
                                        onChange={(e) => setData('surname', e.target.value)}
                                        required
                                        placeholder="Enter last name"
                                    />
                                    <InputError message={errors.surname} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="id_number">ID Number</Label>
                                    <Input
                                        id="id_number"
                                        type="text"
                                        value={data.id_number}
                                        onChange={(e) => setData('id_number', e.target.value)}
                                        required
                                        placeholder="Enter national ID number"
                                    />
                                    <InputError message={errors.id_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_no">Phone Number</Label>
                                    <Input
                                        id="phone_no"
                                        type="tel"
                                        value={data.phone_no}
                                        onChange={(e) => setData('phone_no', e.target.value)}
                                        required
                                        placeholder="+355 69 123 4567"
                                    />
                                    <InputError message={errors.phone_no} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        placeholder="Enter email address"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* NIPT field - only show for business users */}
                                {user.user_type === 'business' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="nipt">NIPT</Label>
                                        <Input
                                            id="nipt"
                                            type="text"
                                            value={data.nipt}
                                            onChange={(e) => setData('nipt', e.target.value)}
                                            required
                                            placeholder="Business NIPT number"
                                        />
                                        <InputError message={errors.nipt} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="balance">Balance (ALL)</Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        step="0.01"
                                        value={data.balance}
                                        onChange={(e) => setData('balance', e.target.value)}
                                        placeholder="e.g. +500 or -500"
                                    />
                                    <InputError message={errors.balance} />
                                    <p className="text-sm text-muted-foreground">Enter a signed amount to adjust wallet. +500 adds, -500 removes. Default currency: ALL.</p>
                                    <p className="text-xs text-muted-foreground">Current balance: <span className="font-semibold">{Number(user.balance ?? 0).toFixed(2)} ALL</span></p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter new password (leave blank to keep current)"
                                    />
                                    <InputError message={errors.password} />
                                    <p className="text-sm text-muted-foreground">
                                        Leave blank to keep the current password
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Update User
                                </Button>
                                <Link href={fromView ? usersShow(user.id, { query: { type: user.user_type } }).url : usersIndex().url}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

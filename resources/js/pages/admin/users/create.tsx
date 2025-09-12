import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, create as usersCreate, store as usersStore } from '@/routes/admin/users';
import { LoaderCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Users',
        href: usersIndex().url,
    },
    {
        title: 'Create User',
        href: usersCreate().url,
    },
];

export default function CreateUser() {
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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(usersStore().url);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Create New User</h1>
                    <Link href={usersIndex().url}>
                        <Button variant="outline">Back to Users</Button>
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

                                <div className="space-y-2">
                                    <Label htmlFor="nipt">NIPT (Optional)</Label>
                                    <Input
                                        id="nipt"
                                        type="text"
                                        value={data.nipt}
                                        onChange={(e) => setData('nipt', e.target.value)}
                                        placeholder="Business NIPT number"
                                    />
                                    <InputError message={errors.nipt} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="balance">Initial Balance (€)</Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.balance}
                                        onChange={(e) => setData('balance', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <InputError message={errors.balance} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        placeholder="Enter password"
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                                <Link href={usersIndex().url}>
                                    <Button type="button" variant="outline">
                                        Cancel
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

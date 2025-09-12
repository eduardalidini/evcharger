import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, create as usersCreate, edit as usersEdit, destroy as usersDestroy } from '@/routes/admin/users';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    surname: string;
    id_number: string;
    phone_no: string;
    email: string;
    nipt: string | null;
    balance: number;
    email_verified_at: string | null;
    created_at: string;
}

interface UsersIndexProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    search?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Users',
        href: usersIndex().url,
    },
];

export default function UsersIndex({ users, search }: UsersIndexProps) {
    const [searchTerm, setSearchTerm] = useState(search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(usersIndex().url, { search: searchTerm }, { preserveState: true });
    };

    const deleteUser = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(usersDestroy(id).url);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Users Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Users Management</h1>
                    <Link href={usersCreate().url}>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add User
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search users by name, surname, email, ID, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                    </div>
                    <Button type="submit">Search</Button>
                </form>

                {/* Users Table */}
                <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">ID</th>
                                    <th className="px-4 py-3 text-left font-medium">Name</th>
                                    <th className="px-4 py-3 text-left font-medium">ID Number</th>
                                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                                    <th className="px-4 py-3 text-left font-medium">Email</th>
                                    <th className="px-4 py-3 text-left font-medium">Balance</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                            No users found. <Link href={usersCreate().url} className="text-primary hover:underline">Create the first user</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                    <tr key={user.id} className="border-t">
                                        <td className="px-4 py-3">{user.id}</td>
                                        <td className="px-4 py-3">{user.name} {user.surname || ''}</td>
                                        <td className="px-4 py-3">{user.id_number || '-'}</td>
                                        <td className="px-4 py-3">{user.phone_no || '-'}</td>
                                        <td className="px-4 py-3">{user.email}</td>
                                        <td className="px-4 py-3">€{Number(user.balance || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                user.email_verified_at 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                            }`}>
                                                {user.email_verified_at ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link href={usersEdit(user.id).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => deleteUser(user.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {users.from} to {users.to} of {users.total} results
                        </div>
                        <div className="flex items-center gap-2">
                            {users.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

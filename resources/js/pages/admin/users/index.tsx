import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, create as usersCreate, show as usersShow, edit as usersEdit, destroy as usersDestroy } from '@/routes/admin/users';
import { Edit, Eye, Plus, Search, Trash2, Users, Building, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    user_type: 'individual' | 'business';
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
    filter?: string;
    stats: {
        total: number;
        individual: number;
        business: number;
    };
}

export default function UsersIndex({ users, search, filter, stats }: UsersIndexProps) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [activeFilter, setActiveFilter] = useState(filter || 'all');
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.users'),
            href: usersIndex().url,
        },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(usersIndex().url, { search: searchTerm, filter: activeFilter }, { preserveState: true });
    };

    const handleFilterChange = (newFilter: string) => {
        setActiveFilter(newFilter);
        router.get(usersIndex().url, { search: searchTerm, filter: newFilter }, { preserveState: true });
    };

    const deleteUser = (id: number, userType: string) => {
        if (confirm(t('users.deleteConfirm'))) {
            router.delete(usersDestroy(id, { query: { type: userType } }).url);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('users.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-bold sm:text-2xl">{t('users.title')}</h1>
                    <Link href={usersCreate().url}>
                        <Button className="flex w-full items-center gap-2 sm:w-auto">
                            <Plus className="h-4 w-4" />
                            {t('users.create')}
                        </Button>
                    </Link>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={activeFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('all')}
                        className="flex items-center gap-2"
                    >
                        <Users className="h-4 w-4" />
                        {t('users.allUsersFilter', { count: stats.total })}
                    </Button>
                    <Button
                        variant={activeFilter === 'individual' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('individual')}
                        className="flex items-center gap-2"
                    >
                        <UserCheck className="h-4 w-4" />
                        {t('users.individualFilter', { count: stats.individual })}
                    </Button>
                    <Button
                        variant={activeFilter === 'business' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('business')}
                        className="flex items-center gap-2"
                    >
                        <Building className="h-4 w-4" />
                        {t('users.businessFilter', { count: stats.business })}
                    </Button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('table.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">{t('common.search')}</Button>
                </form>

                {/* Users Table - Desktop */}
                <div className="hidden lg:block rounded-xl border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">{t('users.id')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('users.type')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('users.name')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('settings.profile.idNumber')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('settings.profile.phoneNumber')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('users.email')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('users.nipt')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('settings.profile.accountBalance')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('users.status')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                                            {t('table.noData')}. <Link href={usersCreate().url} className="text-primary hover:underline">{t('users.create')}</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                    <tr key={user.id} className="border-t">
                                        <td className="px-4 py-3">{user.id}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.user_type === 'business'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                                            }`}>
                                                {user.user_type === 'business' ? t('users.business') : t('users.individual')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{user.name} {user.surname || ''}</td>
                                        <td className="px-4 py-3">{user.id_number || '-'}</td>
                                        <td className="px-4 py-3">{user.phone_no || '-'}</td>
                                        <td className="px-4 py-3">{user.email}</td>
                                        <td className="px-4 py-3">{user.nipt || '-'}</td>
                                        <td className="px-4 py-3">€{Number(user.balance || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                user.email_verified_at 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                            }`}>
                                                {user.email_verified_at ? t('users.emailVerified') : t('users.emailNotVerified')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link href={usersShow(user.id, { query: { type: user.user_type } }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={usersEdit(user.id, { query: { type: user.user_type } }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => deleteUser(user.id, user.user_type)}
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

                {/* Users Cards - Mobile */}
                <div className="block lg:hidden space-y-4">
                    {users.data.length === 0 ? (
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-8 text-center text-muted-foreground">
                            {t('table.noData')}. <Link href={usersCreate().url} className="text-primary hover:underline">{t('users.create')}</Link>
                        </div>
                    ) : (
                        users.data.map((user) => (
                            <div key={user.id} className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-base">{user.name} {user.surname || ''}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.user_type === 'business'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                                            }`}>
                                                {user.user_type === 'business' ? t('users.business') : t('users.individual')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                user.email_verified_at 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                            }`}>
                                                {user.email_verified_at ? t('users.emailVerified') : t('users.emailNotVerified')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-lg">€{Number(user.balance || 0).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">{t('settings.profile.idNumber')}:</span>
                                        <p className="font-medium">{user.id_number || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">{t('settings.profile.phoneNumber')}:</span>
                                        <p className="font-medium">{user.phone_no || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">{t('users.nipt')}:</span>
                                        <p className="font-medium">{user.nipt || '-'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sidebar-border/50">
                                    <Link href={usersShow(user.id, { query: { type: user.user_type } }).url}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            {t('common.view')}
                                        </Button>
                                    </Link>
                                    <Link href={usersEdit(user.id, { query: { type: user.user_type } }).url}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-2" />
                                            {t('common.edit')}
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => deleteUser(user.id, user.user_type)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('common.delete')}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                            {t('table.showing')} {users.from} {t('table.to')} {users.to} {t('table.of')} {users.total} {t('table.entries')}
                        </div>
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                            {users.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className="text-xs sm:text-sm"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

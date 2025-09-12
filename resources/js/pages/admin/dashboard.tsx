import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { Users } from 'lucide-react';

interface AdminDashboardProps {
    total_users: number;
    recent_users: Array<{
        id: number;
        name: string;
        email: string;
        created_at: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
];

export default function AdminDashboard({ total_users, recent_users }: AdminDashboardProps) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Stats */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                                <p className="text-2xl font-bold">{total_users}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>

                {/* Recent Users */}
                <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
                    <div className="space-y-3">
                        {recent_users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

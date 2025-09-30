import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { Users, Receipt, DollarSign, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
}

interface AdminDashboardProps {
    total_users: number;
    recent_users: Array<{
        id: number;
        name: string;
        surname: string;
        email: string;
        created_at: string;
    }>;
    total_receipts: number;
    monthly_revenue: number;
    pending_receipts: number;
    recent_receipts: Array<{
        id: number;
        receipt_number: string;
        user: User;
        type: 'receipt';
        total_amount: number;
        currency: string;
        status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
        created_at: string;
    }>;
}

export default function AdminDashboard({ 
    total_users, 
    recent_users, 
    total_receipts, 
    monthly_revenue, 
    pending_receipts, 
    recent_receipts 
}: AdminDashboardProps) {
    const { t } = useTranslation();
    
    // Real-time updates for admin dashboard
    useEffect(() => {
        const echo: any = (window as any).Echo;
        if (!echo) {
            return;
        }

        const adminChannel = echo.private('admin.charging');
        const globalPublic = echo.channel('charging.global');

        const refreshAdminData = () => {
            router.reload({
                only: ['total_users', 'recent_users', 'total_receipts', 'monthly_revenue', 'pending_receipts', 'recent_receipts'],
                preserveScroll: true,
            });
        };

        adminChannel
            .listen('.session.started', refreshAdminData)
            .listen('.session.updated', refreshAdminData)
            .listen('.session.stopped', refreshAdminData);

        globalPublic
            .listen('.charge_point.status_updated', refreshAdminData)
            .listen('.ocpp.log', refreshAdminData);

        return () => {
            try { echo.leaveChannel('private-admin.charging'); } catch {}
            try { echo.leaveChannel('charging.global'); } catch {}
        };
    }, []);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.dashboard.title'),
            href: dashboard().url,
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('admin.dashboard.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Stats */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
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
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                                <Receipt className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Receipts</p>
                                <p className="text-2xl font-bold">{total_receipts}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                                <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                                <p className="text-2xl font-bold">EUR {Number(monthly_revenue || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Receipts</p>
                                <p className="text-2xl font-bold">{pending_receipts}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Users */}
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Users</h3>
                            <Link href="/admin/users" className="text-sm text-primary hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recent_users.length > 0 ? recent_users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium">{user.name} {user.surname}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">No users yet</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Receipts */}
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Receipts</h3>
                            <Link href="/admin/receipts" className="text-sm text-primary hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recent_receipts.length > 0 ? recent_receipts.map((receipt) => (
                                <div key={receipt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium font-mono">{receipt.receipt_number}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {receipt.user.name} {receipt.user.surname}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{receipt.currency} {Number(receipt.total_amount).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(receipt.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">No receipts yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

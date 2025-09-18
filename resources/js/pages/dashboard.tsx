import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Receipt, Download, DollarSign, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Admin {
    id: number;
    email: string;
}

interface UserDashboardProps {
    total_receipts: number;
    monthly_revenue: number;
    pending_receipts: number;
    recent_receipts: Array<{
        id: number;
        receipt_number: string;
        admin: Admin;
        type: 'receipt';
        total_amount: number;
        currency: string;
        status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
        created_at: string;
    }>;
}

export default function Dashboard({ 
    total_receipts, 
    monthly_revenue, 
    pending_receipts, 
    recent_receipts 
}: UserDashboardProps) {
    const { t } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard.title'),
            href: dashboard().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Stats */}
                <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                                <Receipt className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('dashboard.stats.totalReceipts')}</p>
                                <p className="text-2xl font-bold">{total_receipts || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                                <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('dashboard.stats.monthlyTotal')}</p>
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
                                <p className="text-sm text-muted-foreground">{t('dashboard.stats.pending')}</p>
                                <p className="text-2xl font-bold">{pending_receipts || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Quick Actions */}
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{t('dashboard.quickActions.myReceipts')}</h3>
                                <p className="text-sm text-muted-foreground">{t('dashboard.quickActions.myReceiptsDesc')}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Link href="/receipts">
                                <Button className="w-full" variant="outline">
                                    <Receipt className="mr-2 h-4 w-4" />
                                    {t('dashboard.quickActions.viewAllReceipts')}
                                </Button>
                            </Link>
                            <Link href="/user/charging">
                                <Button className="w-full">
                                    <Zap className="mr-2 h-4 w-4" />
                                    EV Charging
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Receipts */}
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{t('dashboard.recentReceipts.title')}</h3>
                            <Link href="/receipts" className="text-sm text-primary hover:underline">
                                {t('dashboard.recentReceipts.viewAll')}
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recent_receipts && recent_receipts.length > 0 ? recent_receipts.map((receipt) => (
                                <div key={receipt.id} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                                    <div>
                                        <p className="font-medium font-mono text-sm sm:text-base">{receipt.receipt_number}</p>
                                        <p className="text-xs text-muted-foreground sm:text-sm">
                                            {t('dashboard.recentReceipts.issuedBy')}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="font-medium text-sm sm:text-base">{receipt.currency} {Number(receipt.total_amount).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground sm:text-sm">
                                            {new Date(receipt.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">{t('dashboard.recentReceipts.noReceipts')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

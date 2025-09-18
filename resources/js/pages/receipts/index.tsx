import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { Search, Download, Eye, Receipt, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
}

interface Admin {
    id: number;
    email: string;
}

interface Receipt {
    id: number;
    receipt_number: string;
    admin: Admin;
    type: 'receipt';
    // Business Information
    business_name: string;
    business_number: string | null;
    business_vat: string | null;
    business_address: string | null;
    // Basic amounts
    amount: number;
    currency: string;
    description: string | null;
    tax_amount: number;
    total_amount: number;
    // EV Charging Specific Fields
    charging_duration_minutes: number | null;
    vehicle_registration: string | null;
    vehicle_model: string | null;
    charger_type: string | null;
    rate_per_kwh: number | null;
    kwh_consumed: number | null;
    tax_rate_percentage: number | null;
    // Payment and status
    payment_method: string | null;
    payment_reference: string | null;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    issued_at: string | null;
    due_date: string | null;
    pdf_path: string | null;
    notes: string | null;
    created_at: string;
}

interface ReceiptsIndexProps {
    receipts: {
        data: Receipt[];
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
    filters: {
        type?: string;
        status?: string;
    };
    error?: string;
}

const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    cancelled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
};

const typeColors = {
    receipt: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
};

export default function ReceiptsIndex({ receipts, search, filters, error }: ReceiptsIndexProps) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('navigation.receipts'),
            href: '/receipts',
        },
    ];

    // Debug logging
    console.log('ReceiptsIndex props:', { receipts, search, filters, error });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/receipts', { 
            search: searchTerm,
            type: typeFilter,
            status: statusFilter
        }, { preserveState: true });
    };

    const downloadPdf = (id: number) => {
        window.open(`/receipts/${id}/download-pdf`, '_blank');
    };

    const deleteReceipt = (id: number) => {
        if (confirm(t('receipts.deleteConfirm'))) {
            router.delete(`/receipts/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('receipts.title')} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('receipts.title')}</h1>
                        <p className="text-muted-foreground">{t('receipts.viewDescription')}</p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Search and Filters */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('table.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder={t('receipts.type')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('receipts.allTypes')}</SelectItem>
                            <SelectItem value="receipt">{t('receipts.receipt')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder={t('receipts.status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('receipts.allStatus')}</SelectItem>
                            <SelectItem value="draft">{t('receipts.draft')}</SelectItem>
                            <SelectItem value="sent">{t('receipts.sent')}</SelectItem>
                            <SelectItem value="paid">{t('receipts.paid')}</SelectItem>
                            <SelectItem value="overdue">{t('receipts.overdue')}</SelectItem>
                            <SelectItem value="cancelled">{t('receipts.cancelled')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit">{t('common.search')}</Button>
                </form>

                {/* Receipts Table */}
                <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">{t('receipts.number')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('receipts.type')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('receipts.vehicle')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('receipts.kwh')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('receipts.amount')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('receipts.status')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('receipts.date')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receipts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Receipt className="h-12 w-12 text-muted-foreground" />
                                                <div>
                                                    <h3 className="text-lg font-medium">{t('receipts.noReceipts')}</h3>
                                                    <p className="text-muted-foreground">
                                                        {t('receipts.noReceiptsDescription')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    receipts.data.map((receipt) => (
                                        <tr key={receipt.id} className="border-t">
                                            <td className="px-4 py-3 font-mono">{receipt.receipt_number}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${typeColors[receipt.type]}`}>
                                                    {t(`receipts.${receipt.type}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    {receipt.vehicle_registration && (
                                                        <div className="font-medium">{receipt.vehicle_registration}</div>
                                                    )}
                                                    {receipt.vehicle_model && (
                                                        <div className="text-sm text-muted-foreground">{receipt.vehicle_model}</div>
                                                    )}
                                                    {!receipt.vehicle_registration && !receipt.vehicle_model && '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {receipt.kwh_consumed ? Number(receipt.kwh_consumed).toFixed(3) : '-'}
                                            </td>
                                            <td className="px-4 py-3 font-mono">
                                                {receipt.currency} {Number(receipt.total_amount).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[receipt.status]}`}>
                                                    {t(`receipts.${receipt.status}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {receipt.issued_at ? new Date(receipt.issued_at).toLocaleDateString() : 
                                                 new Date(receipt.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/receipts/${receipt.id}`}>
                                                        <Button variant="outline" size="sm" title={t('common.view')}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => downloadPdf(receipt.id)}
                                                        title={t('receipts.downloadPdf')}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => deleteReceipt(receipt.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title={t('common.delete')}
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
                {receipts.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {t('table.showing')} {receipts.from} {t('table.to')} {receipts.to} {t('table.of')} {receipts.total} {t('table.entries')}
                        </div>
                        <div className="flex items-center gap-2">
                            {receipts.links.map((link, index) => (
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
        </AppLayout>
    );
}

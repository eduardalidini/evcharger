import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { Plus, Search, Trash2, Download, Eye } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
}

interface Admin {
    id: number;
    name: string;
    email: string;
}

interface Receipt {
    id: number;
    receipt_number: string;
    user: User;
    admin: Admin;
    type: 'receipt' | 'invoice';
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
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Receipts & Invoices',
        href: '/admin/receipts',
    },
];

const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    cancelled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
};

const typeColors = {
    receipt: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
    invoice: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
};

export default function ReceiptsIndex({ receipts, search, filters }: ReceiptsIndexProps) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Debug logging
    console.log('Admin ReceiptsIndex rendered with props:', { receipts, search, filters });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/receipts', { 
            search: searchTerm,
            type: typeFilter,
            status: statusFilter
        }, { preserveState: true });
    };

    const deleteReceipt = (id: number) => {
        if (confirm('Are you sure you want to delete this receipt?')) {
            router.delete(`/admin/receipts/${id}`);
        }
    };


    const downloadPdf = (id: number) => {
        // Try to download PDF, if it doesn't exist the server will generate it first
        window.open(`/admin/receipts/${id}/download-pdf`, '_blank');
    };

    // Fallback for receipts data
    const safeReceipts = receipts || {
        data: [],
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0,
        links: []
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Receipts & Invoices Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Receipts & Invoices</h1>
                    <Link href="/admin/receipts/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create New
                        </Button>
                    </Link>
                </div>

                {/* Search and Filters */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by receipt number, description, or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="receipt">Receipt</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit">Search</Button>
                </form>

                {/* Receipts Table */}
                <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Number</th>
                                    <th className="px-4 py-3 text-left font-medium">Type</th>
                                    <th className="px-4 py-3 text-left font-medium">User</th>
                                    <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                                    <th className="px-4 py-3 text-left font-medium">kWh</th>
                                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Issued</th>
                                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeReceipts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                            No receipts found. <Link href="/admin/receipts/create" className="text-primary hover:underline">Create the first receipt</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    safeReceipts.data.map((receipt) => (
                                        <tr key={receipt.id} className="border-t">
                                            <td className="px-4 py-3 font-mono">{receipt.receipt_number}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${typeColors[receipt.type]}`}>
                                                    {receipt.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium">{receipt.user.name} {receipt.user.surname}</div>
                                                    <div className="text-sm text-muted-foreground">{receipt.user.email}</div>
                                                </div>
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
                                                    {receipt.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {receipt.issued_at ? new Date(receipt.issued_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/admin/receipts/${receipt.id}`}>
                                                        <Button variant="outline" size="sm" title="View">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => downloadPdf(receipt.id)}
                                                        title="Download PDF"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => deleteReceipt(receipt.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Delete"
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
                {safeReceipts.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {safeReceipts.from} to {safeReceipts.to} of {safeReceipts.total} results
                        </div>
                        <div className="flex items-center gap-2">
                            {safeReceipts.links.map((link, index) => (
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

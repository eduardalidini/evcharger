import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { Download, ArrowLeft, Calendar, CreditCard, Zap, Car, Trash2, Receipt, Package } from 'lucide-react';
import { router } from '@inertiajs/react';

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

interface ReceiptItem {
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

// services removed

interface Receipt {
    id: number;
    receipt_number: string;
    user: User;
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
    // Items only
    receipt_items?: ReceiptItem[];
    created_at: string;
}

interface ReceiptShowProps {
    receipt: Receipt;
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

export default function ReceiptShow({ receipt }: ReceiptShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Receipts',
            href: '/admin/receipts',
        },
        {
            title: `${receipt.type} #${receipt.receipt_number}`,
            href: `/admin/receipts/${receipt.id}`,
        },
    ];

    const downloadPdf = () => {
        window.open(`/admin/receipts/${receipt.id}/download-pdf`, '_blank');
    };


    const deleteReceipt = () => {
        if (confirm('Are you sure you want to delete this receipt?')) {
            router.delete(`/admin/receipts/${receipt.id}`);
        }
    };

    const formatDuration = (minutes: number): string => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${receipt.type} #${receipt.receipt_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/receipts">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Receipts
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Receipt className="h-6 w-6" />
                                {receipt.type.charAt(0).toUpperCase() + receipt.type.slice(1)} #{receipt.receipt_number}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${typeColors[receipt.type]}`}>
                                    {receipt.type}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[receipt.status]}`}>
                                    {receipt.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={downloadPdf} className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                        <Button 
                            onClick={deleteReceipt} 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Business Information */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Business Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                                    <p className="text-sm">{receipt.business_name}</p>
                                </div>
                                {receipt.business_number && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Business Number</label>
                                        <p className="text-sm font-mono">{receipt.business_number}</p>
                                    </div>
                                )}
                                {receipt.business_vat && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">VAT Number</label>
                                        <p className="text-sm font-mono">{receipt.business_vat}</p>
                                    </div>
                                )}
                                {receipt.business_address && (
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                                        <p className="text-sm whitespace-pre-line">{receipt.business_address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Customer Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Customer</label>
                                    <p className="text-sm font-medium">{receipt.user.name} {receipt.user.surname}</p>
                                    <p className="text-sm text-muted-foreground">{receipt.user.email}</p>
                                </div>
                                {receipt.vehicle_registration && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Vehicle Registration</label>
                                        <p className="text-sm font-mono">{receipt.vehicle_registration}</p>
                                    </div>
                                )}
                                {receipt.vehicle_model && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Vehicle Model</label>
                                        <p className="text-sm">{receipt.vehicle_model}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* EV Charging Details */}
                        {(receipt.kwh_consumed || receipt.rate_per_kwh || receipt.charger_type) && (
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    EV Charging Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {receipt.charger_type && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Charger Type</label>
                                            <p className="text-sm">{receipt.charger_type}</p>
                                        </div>
                                    )}
                                    {receipt.charging_duration_minutes && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Charging Duration</label>
                                            <p className="text-sm">{formatDuration(receipt.charging_duration_minutes)}</p>
                                        </div>
                                    )}
                                    {receipt.kwh_consumed && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">kWh Consumed</label>
                                            <p className="text-sm font-mono">{Number(receipt.kwh_consumed).toFixed(3)} kWh</p>
                                        </div>
                                    )}
                                    {receipt.rate_per_kwh && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Rate per kWh</label>
                                            <p className="text-sm font-mono">{receipt.currency} {Number(receipt.rate_per_kwh).toFixed(4)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Items */}
                        {(receipt.receipt_items && receipt.receipt_items.length > 0) && (
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                                <h3 className="text-lg font-semibold mb-4">Items</h3>
                                <div className="space-y-6">
                                    {/* Items */}
                                    {receipt.receipt_items && receipt.receipt_items.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Items
                                            </h4>
                                            <div className="space-y-2">
                                                {receipt.receipt_items.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{item.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {receipt.currency} {item.unit_price.toFixed(2)} × {item.quantity}
                                                            </div>
                                                        </div>
                                                        <div className="font-medium text-sm">
                                                            {receipt.currency} {item.total_price.toFixed(2)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {receipt.description && (
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                                <h3 className="text-lg font-semibold mb-4">Description</h3>
                                <p className="text-sm whitespace-pre-line">{receipt.description}</p>
                            </div>
                        )}

                        {/* Notes */}
                        {receipt.notes && (
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                                <p className="text-sm whitespace-pre-line">{receipt.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Amount Summary */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Amount Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Subtotal</span>
                                    <span className="text-sm font-mono">{receipt.currency} {Number(receipt.amount).toFixed(2)}</span>
                                </div>
                                {receipt.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Tax ({receipt.tax_rate_percentage}%)</span>
                                        <span className="text-sm font-mono">{receipt.currency} {Number(receipt.tax_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Total</span>
                                        <span className="font-semibold font-mono">{receipt.currency} {Number(receipt.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Payment Information
                            </h3>
                            <div className="space-y-3">
                                {receipt.payment_method && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                                        <p className="text-sm">{receipt.payment_method}</p>
                                    </div>
                                )}
                                {receipt.payment_reference && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Payment Reference</label>
                                        <p className="text-sm font-mono">{receipt.payment_reference}</p>
                                    </div>
                                )}
                                {receipt.issued_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Issued Date</label>
                                        <p className="text-sm">{new Date(receipt.issued_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {receipt.due_date && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                                        <p className="text-sm">{new Date(receipt.due_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm">{new Date(receipt.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Admin Information */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4">Admin Information</h3>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created by</label>
                                    <p className="text-sm">Admin</p>
                                    <p className="text-sm text-muted-foreground">{receipt.admin.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

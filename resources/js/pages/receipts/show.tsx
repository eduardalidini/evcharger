import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { Download, ArrowLeft, Receipt as ReceiptIcon, Calendar, CreditCard, Zap, Car, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

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
        {
            title: `${receipt.type} #${receipt.receipt_number}`,
            href: `/receipts/${receipt.id}`,
        },
    ];

    const downloadPdf = () => {
        window.open(`/receipts/${receipt.id}/download-pdf`, '_blank');
    };

    const deleteReceipt = () => {
        if (confirm(t('receipts.deleteConfirm'))) {
            router.delete(`/receipts/${receipt.id}`, {
                onSuccess: () => {
                    // Redirect to receipts list after successful deletion
                    router.get('/receipts');
                }
            });
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${receipt.type} #${receipt.receipt_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/receipts">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('receipts.backToReceipts')}
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <ReceiptIcon className="h-6 w-6" />
                                {t(`receipts.${receipt.type}`)} #{receipt.receipt_number}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${typeColors[receipt.type]}`}>
                                    {t(`receipts.${receipt.type}`)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[receipt.status]}`}>
                                    {t(`receipts.${receipt.status}`)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={downloadPdf} className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            {t('receipts.downloadPdf')}
                        </Button>
                        <Button 
                            onClick={deleteReceipt} 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Receipt Details */}
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('receipts.receiptInformation')}
                            </h3>
                            <div className="grid gap-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('receipts.receiptNumber')}:</span>
                                    <span className="font-mono">{receipt.receipt_number}</span>
                                </div>
                                {receipt.issued_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.issueDate')}:</span>
                                        <span>{new Date(receipt.issued_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {receipt.due_date && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.dueDate')}:</span>
                                        <span>{new Date(receipt.due_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('receipts.created')}:</span>
                                    <span>{new Date(receipt.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        {(receipt.vehicle_registration || receipt.vehicle_model) && (
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                {t('receipts.vehicleInformation')}
                            </h3>
                                <div className="grid gap-3">
                                    {receipt.vehicle_registration && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('receipts.registration')}:</span>
                                            <span className="font-medium">{receipt.vehicle_registration}</span>
                                        </div>
                                    )}
                                    {receipt.vehicle_model && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('receipts.model')}:</span>
                                            <span>{receipt.vehicle_model}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Information */}
                        {(receipt.payment_method || receipt.payment_reference) && (
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                {t('receipts.paymentInformation')}
                            </h3>
                                <div className="grid gap-3">
                                    {receipt.payment_method && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('receipts.paymentMethod')}:</span>
                                            <span>{receipt.payment_method}</span>
                                        </div>
                                    )}
                                    {receipt.payment_reference && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('receipts.reference')}:</span>
                                            <span className="font-mono">{receipt.payment_reference}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charging Details & Amount */}
                    <div className="space-y-6">
                        {/* Charging Details */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                {t('receipts.chargingDetails')}
                            </h3>
                            <div className="grid gap-3">
                                {receipt.charger_type && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.chargerType')}:</span>
                                        <span>{receipt.charger_type}</span>
                                    </div>
                                )}
                                {receipt.rate_per_kwh && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.ratePerKwh')}:</span>
                                        <span className="font-mono">{receipt.currency} {Number(receipt.rate_per_kwh).toFixed(4)}</span>
                                    </div>
                                )}
                                {receipt.kwh_consumed && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.energyConsumed')}:</span>
                                        <span className="font-medium">{Number(receipt.kwh_consumed).toFixed(3)} kWh</span>
                                    </div>
                                )}
                                {receipt.charging_duration_minutes && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.chargingDuration')}:</span>
                                        <span>{formatDuration(receipt.charging_duration_minutes)}</span>
                                    </div>
                                )}
                                {receipt.tax_rate_percentage && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.taxRate')}:</span>
                                        <span>{Number(receipt.tax_rate_percentage).toFixed(2)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount Breakdown */}
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                            <h3 className="text-lg font-semibold mb-4">{t('receipts.amountBreakdown')}</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('receipts.subtotal')}:</span>
                                    <span className="font-mono">{receipt.currency} {Number(receipt.amount).toFixed(2)}</span>
                                </div>
                                {receipt.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('receipts.tax')}:</span>
                                        <span className="font-mono">{receipt.currency} {Number(receipt.tax_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>{t('receipts.total')}:</span>
                                        <span className="font-mono">{receipt.currency} {Number(receipt.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description/Notes */}
                        {(receipt.description || receipt.notes) && (
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                                <h3 className="text-lg font-semibold mb-4">
                                    {receipt.description ? t('receipts.description') : t('receipts.notes')}
                                </h3>
                                <p className="text-muted-foreground">
                                    {receipt.description || receipt.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Business Information */}
                <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                    <h3 className="text-lg font-semibold mb-4">{t('receipts.from')}</h3>
                    <div className="grid gap-2">
                        <p className="font-medium">{receipt.business_name || 'EV Charging Station'}</p>
                        {receipt.business_address && (
                            <p className="text-muted-foreground">{receipt.business_address}</p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            {receipt.business_number && (
                                <span>{t('receipts.businessNumber')}: {receipt.business_number}</span>
                            )}
                            {receipt.business_vat && (
                                <span>{t('receipts.vat')}: {receipt.business_vat}</span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {t('receipts.generatedByAdmin')}
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

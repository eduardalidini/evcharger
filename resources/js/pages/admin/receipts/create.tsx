import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { LoaderCircle, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
}

// services removed

interface BusinessInfo {
    id: number;
    business_name: string;
    business_number: string;
    vat_number: string;
    business_address: string;
    is_default: boolean;
}

interface CreateReceiptProps {
    users: User[];
    businessInfo: BusinessInfo[];
    businessInfoMissing?: boolean;
    businessCreateUrl?: string;
}


export default function CreateReceipt({ users, businessInfo, businessInfoMissing, businessCreateUrl }: CreateReceiptProps) {
    const { t } = useTranslation();
    const isBusinessMissing = businessInfoMissing ?? businessInfo.length === 0;
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.receipts'),
            href: '/admin/receipts',
        },
        {
            title: t('receipts.create'),
            href: '/admin/receipts/create',
        },
    ];
    // services removed
    const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
        businessInfo.find(b => b.is_default)?.id || businessInfo[0]?.id || null
    );

    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        type: 'receipt',
        // Business Information
        business_name: 'EV Charging Station',
        business_number: '',
        business_vat: '',
        business_address: '',
        // Basic amounts
        amount: '',
        currency: 'EUR',
        description: '',
        tax_amount: '',
        total_amount: '',
        // EV Charging Specific Fields
        charging_duration_minutes: '',
        vehicle_registration: '',
        vehicle_model: '',
        charger_type: '',
        rate_per_kwh: '',
        kwh_consumed: '',
        tax_rate_percentage: '',
        // Payment and status
        payment_method: '',
        payment_reference: '',
        status: 'draft',
        issued_at: '',
        due_date: '',
        notes: '',
        // services removed
    });


    // services removed

    // Update business information when selected business changes
    useEffect(() => {
        if (selectedBusinessId) {
            const selectedBusiness = businessInfo.find(b => b.id === selectedBusinessId);
            if (selectedBusiness) {
                setData('business_name', selectedBusiness.business_name);
                setData('business_number', selectedBusiness.business_number);
                setData('business_vat', selectedBusiness.vat_number);
                setData('business_address', selectedBusiness.business_address);
            }
        }
    }, [selectedBusinessId, businessInfo]);

    // services removed

    // services removed

    // services removed

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Calculate the final amounts
        const baseAmount = evChargingAmount > 0 ? evChargingAmount : (parseFloat(data.amount) || 0);
        const finalAmount = baseAmount;
        const finalTaxAmount = data.tax_amount || calculatedTax;
        const finalTotal = finalAmount + parseFloat(finalTaxAmount.toString());
        
        // Create updated form data with calculated values
        const submissionData = {
            ...data,
            amount: finalAmount.toString(),
            tax_amount: finalTaxAmount.toString(),
            total_amount: finalTotal.toString(),
            // services removed
        };
        
        console.log('Submitting receipt with data:', submissionData);

        const formData: Record<string, any> = {
            ...submissionData,
        };

        router.post('/admin/receipts', formData, {
            onSuccess: (page) => {
                console.log('Receipt created successfully', page);
            },
            onError: (errors) => {
                console.error('Receipt creation failed', errors);
            },
            onFinish: () => {
                console.log('Receipt submission finished');
            }
        });
    };


    // Calculate amounts based on EV charging, manual amount only
    const evChargingAmount = (parseFloat(data.kwh_consumed) || 0) * (parseFloat(data.rate_per_kwh) || 0);
    const manualAmount = parseFloat(data.amount) || 0;
    
    const baseAmount = evChargingAmount > 0 ? evChargingAmount : manualAmount;
    const subtotal = baseAmount;
    
    // Auto-calculate tax if rate is provided
    const calculatedTax = subtotal * ((parseFloat(data.tax_rate_percentage) || 0) / 100);
    const taxAmount = parseFloat(data.tax_amount) || calculatedTax;
    const total = subtotal + taxAmount;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Receipt" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('receipts.createNew')}</h1>
                    <Link href="/admin/receipts">
                        <Button variant="outline">{t('receipts.backToReceipts')}</Button>
                    </Link>
                </div>

                <div className="max-w-4xl">
                    {isBusinessMissing && (
                        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                            {t('receipts.businessInfoMissing')}
                            {businessCreateUrl && (
                                <span className="ml-2">
                                    <Link className="underline font-medium" href={businessCreateUrl}>{t('receipts.addBusinessInfo')}</Link>
                                </span>
                            )}
                        </div>
                    )}
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <fieldset disabled={isBusinessMissing} className={isBusinessMissing ? 'opacity-60 pointer-events-none' : ''}>
                            {/* Business Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">{t('receipts.businessInformation')}</h3>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="business_select">{t('receipts.selectBusiness')}</Label>
                                    <Select value={selectedBusinessId?.toString() || ''} onValueChange={(value) => setSelectedBusinessId(parseInt(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('receipts.selectBusiness')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {businessInfo.map((business) => (
                                                <SelectItem key={business.id} value={business.id.toString()}>
                                                    {business.business_name} {business.is_default && '(Default)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="business_name">{t('receipts.businessName')}</Label>
                                        <Input
                                            id="business_name"
                                            type="text"
                                            value={data.business_name}
                                            readOnly
                                            className="bg-muted"
                                        />
                                        <InputError message={errors.business_name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_number">{t('receipts.businessNumber')}</Label>
                                        <Input
                                            id="business_number"
                                            type="text"
                                            value={data.business_number}
                                            readOnly
                                            className="bg-muted"
                                        />
                                        <InputError message={errors.business_number} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_vat">{t('receipts.vatNumber')}</Label>
                                        <Input
                                            id="business_vat"
                                            type="text"
                                            value={data.business_vat}
                                            readOnly
                                            className="bg-muted"
                                        />
                                        <InputError message={errors.business_vat} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_address">{t('receipts.businessAddress')}</Label>
                                        <textarea
                                            id="business_address"
                                            value={data.business_address}
                                            readOnly
                                            rows={2}
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.business_address} />
                                    </div>
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">{t('receipts.receiptInformation')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">{t('receipts.user')}</Label>
                                    <Select value={data.user_id} onValueChange={(value) => setData('user_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('receipts.selectUser')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.length > 0 ? (
                                                users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name} {user.surname} ({user.email})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-users" disabled>
                                                    No users available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.user_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">{t('receipts.type')}</Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="receipt">{t('receipts.receipt')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">{t('receipts.currency')}</Label>
                                    <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="ALL">ALL (L)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.currency} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">{t('receipts.status')}</Label>
                                    <Select value={data.status} onValueChange={(value: any ) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">{t('receipts.draft')}</SelectItem>
                                            <SelectItem value="sent">{t('receipts.sent')}</SelectItem>
                                            <SelectItem value="paid">{t('receipts.paid')}</SelectItem>
                                            <SelectItem value="overdue">{t('receipts.overdue')}</SelectItem>
                                            <SelectItem value="cancelled">{t('receipts.cancelled')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="issued_at">{t('receipts.issueDate')}</Label>
                                    <Input
                                        id="issued_at"
                                        type="datetime-local"
                                        value={data.issued_at}
                                        onChange={(e: any) => setData('issued_at', e.target.value)}
                                    />
                                    <InputError message={errors.issued_at} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="due_date">{t('receipts.dueDate')}</Label>
                                    <Input
                                        id="due_date"
                                        type="datetime-local"
                                        value={data.due_date}
                                        onChange={(e: any) => setData('due_date', e.target.value)}
                                    />
                                    <InputError message={errors.due_date} />
                                </div>
                            </div>
                            </div>

                            {/* Vehicle Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">{t('receipts.vehicleInformation')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle_registration">{t('receipts.registration')}</Label>
                                        <Input
                                            id="vehicle_registration"
                                            type="text"
                                            value={data.vehicle_registration}
                                            onChange={(e: any) => setData('vehicle_registration', e.target.value)}
                                            placeholder="e.g., ABC-123"
                                        />
                                        <InputError message={errors.vehicle_registration} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle_model">{t('receipts.model')}</Label>
                                        <Input
                                            id="vehicle_model"
                                            type="text"
                                            value={data.vehicle_model}
                                            onChange={(e: any) => setData('vehicle_model', e.target.value)}
                                            placeholder="e.g., Tesla Model 3"
                                        />
                                        <InputError message={errors.vehicle_model} />
                                    </div>
                                </div>
                            </div>

                            {/* EV Charging Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">{t('receipts.chargingDetails')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="charger_type">{t('receipts.chargerType')}</Label>
                                        <Select value={data.charger_type} onValueChange={(value) => setData('charger_type', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select charger type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AC Level 1">AC Level 1 (120V)</SelectItem>
                                                <SelectItem value="AC Level 2">AC Level 2 (240V)</SelectItem>
                                                <SelectItem value="DC Fast Charge">DC Fast Charge</SelectItem>
                                                <SelectItem value="Tesla Supercharger">Tesla Supercharger</SelectItem>
                                                <SelectItem value="CCS">CCS (Combined Charging System)</SelectItem>
                                                <SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.charger_type} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="charging_duration_minutes">{t('receipts.chargingDuration')} (minuta)</Label>
                                        <Input
                                            id="charging_duration_minutes"
                                            type="number"
                                            min="1"
                                            value={data.charging_duration_minutes}
                                            onChange={(e: any) => setData('charging_duration_minutes', e.target.value)}
                                            placeholder="e.g., 45"
                                        />
                                        <InputError message={errors.charging_duration_minutes} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rate_per_kwh">{t('receipts.ratePerKwh')} ({data.currency})</Label>
                                        <Input
                                            id="rate_per_kwh"
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={data.rate_per_kwh}
                                            onChange={(e: any) => setData('rate_per_kwh', e.target.value)}
                                            placeholder="e.g., 0.2500"
                                        />
                                        <InputError message={errors.rate_per_kwh} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="kwh_consumed">{t('receipts.energyConsumed')}</Label>
                                        <Input
                                            id="kwh_consumed"
                                            type="number"
                                            min="0"
                                            step="0.001"
                                            value={data.kwh_consumed}
                                            onChange={(e) => setData('kwh_consumed', e.target.value)}
                                            placeholder="e.g., 25.750"
                                        />
                                        <InputError message={errors.kwh_consumed} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_rate_percentage">{t('receipts.taxRate')} (%)</Label>
                                        <Input
                                            id="tax_rate_percentage"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={data.tax_rate_percentage}
                                            onChange={(e) => setData('tax_rate_percentage', e.target.value)}
                                            placeholder="e.g., 20.00"
                                        />
                                        <InputError message={errors.tax_rate_percentage} />
                                    </div>
                                </div>
                            </div>

                            {/* services removed */}

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">{t('receipts.description')}</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e: any) => setData('description', e.target.value)}
                                    placeholder={t('receipts.descriptionPlaceholder')}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>


                            {/* Payment Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">{t('receipts.paymentMethod')}</Label>
                                    <Input
                                        id="payment_method"
                                        type="text"
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        placeholder={t('receipts.paymentMethodPlaceholder')}
                                    />
                                    <InputError message={errors.payment_method} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_reference">{t('receipts.reference')}</Label>
                                    <Input
                                        id="payment_reference"
                                        type="text"
                                        value={data.payment_reference}
                                        onChange={(e) => setData('payment_reference', e.target.value)}
                                        placeholder={t('receipts.referencePlaceholder')}
                                    />
                                    <InputError message={errors.payment_reference} />
                                </div>
                            </div>

                            {/* Amounts */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">{t('receipts.amountCalculation')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/30 p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">
                                            {t('receipts.baseAmount')} ({data.currency})
                                            {evChargingAmount > 0 && <span className="text-sm text-muted-foreground ml-1">(Auto-calculated)</span>}
                                        </Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={evChargingAmount > 0 ? evChargingAmount.toFixed(2) : data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            readOnly={evChargingAmount > 0}
                                            className={evChargingAmount > 0 ? "bg-muted" : ""}
                                            placeholder="0.00"
                                        />
                                        <InputError message={errors.amount} />
                                        {/* services removed */}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_amount">
                                            {t('receipts.taxAmount')} ({data.currency})
                                            {calculatedTax > 0 && <span className="text-sm text-muted-foreground ml-1">(Auto-calculated)</span>}
                                        </Label>
                                        <Input
                                            id="tax_amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.tax_amount || (calculatedTax > 0 ? calculatedTax.toFixed(2) : '')}
                                            onChange={(e) => setData('tax_amount', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError message={errors.tax_amount} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Total ({data.currency})</Label>
                                        <div className="text-lg font-semibold py-2 px-3 bg-background border rounded-md">
                                            {total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">{t('receipts.notes')}</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e: any) => setData('notes', e.target.value)}
                                    placeholder={t('receipts.additionalNotesPlaceholder')}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing || isBusinessMissing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {t('receipts.create')}
                                </Button>
                                <Link href="/admin/receipts">
                                    <Button type="button" variant="outline">
                                        {t('common.cancel')}
                                    </Button>
                                </Link>
                            </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

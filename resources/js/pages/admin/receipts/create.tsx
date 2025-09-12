import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { LoaderCircle } from 'lucide-react';

interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
}

interface CreateReceiptProps {
    users: User[];
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
    {
        title: 'Create Receipt',
        href: '/admin/receipts/create',
    },
];

export default function CreateReceipt({ users }: CreateReceiptProps) {

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
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Calculate the final amount to send
        const finalAmount = evChargingAmount > 0 ? evChargingAmount : (parseFloat(data.amount) || 0);
        const finalTaxAmount = data.tax_amount || calculatedTax;
        
        // Update form data with calculated values
        setData('amount', finalAmount.toString());
        setData('tax_amount', finalTaxAmount.toString());
        setData('total_amount', (finalAmount + parseFloat(finalTaxAmount.toString())).toString());
        
        console.log('Submitting receipt with data:', { ...data, amount: finalAmount, tax_amount: finalTaxAmount });
        
        post('/admin/receipts', {
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


    // Calculate amounts based on EV charging or manual amount
    const evChargingAmount = (parseFloat(data.kwh_consumed) || 0) * (parseFloat(data.rate_per_kwh) || 0);
    const manualAmount = parseFloat(data.amount) || 0;
    const subtotal = evChargingAmount > 0 ? evChargingAmount : manualAmount;
    
    // Auto-calculate tax if rate is provided
    const calculatedTax = subtotal * ((parseFloat(data.tax_rate_percentage) || 0) / 100);
    const taxAmount = parseFloat(data.tax_amount) || calculatedTax;
    const total = subtotal + taxAmount;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Receipt" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Create New Receipt/Invoice</h1>
                    <Link href="/admin/receipts">
                        <Button variant="outline">Back to Receipts</Button>
                    </Link>
                </div>

                <div className="max-w-4xl">
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        <form onSubmit={submit} className="space-y-6">
                            {/* Business Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Business Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="business_name">Business Name</Label>
                                        <Input
                                            id="business_name"
                                            type="text"
                                            value={data.business_name}
                                            onChange={(e: any) => setData('business_name', e.target.value)}
                                            placeholder="EV Charging Station"
                                        />
                                        <InputError message={errors.business_name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_number">Business Number</Label>
                                        <Input
                                            id="business_number"
                                            type="text"
                                            value={data.business_number}
                                            onChange={(e: any) => setData('business_number', e.target.value)}
                                            placeholder="Business registration number"
                                        />
                                        <InputError message={errors.business_number} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_vat">VAT Number</Label>
                                        <Input
                                            id="business_vat"
                                            type="text"
                                            value={data.business_vat}
                                            onChange={(e: any) => setData('business_vat', e.target.value)}
                                            placeholder="VAT identification number"
                                        />
                                        <InputError message={errors.business_vat} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_address">Business Address</Label>
                                        <textarea
                                            id="business_address"
                                            value={data.business_address}
                                            onChange={(e: any) => setData('business_address', e.target.value)}
                                            placeholder="Complete business address"
                                            rows={2}
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.business_address} />
                                    </div>
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Receipt Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">User</Label>
                                    <Select value={data.user_id} onValueChange={(value) => setData('user_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select user" />
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
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="receipt">Receipt</SelectItem>
                                            <SelectItem value="invoice">Invoice</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
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
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(value: any ) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="sent">Sent</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="issued_at">Issued Date</Label>
                                    <Input
                                        id="issued_at"
                                        type="datetime-local"
                                        value={data.issued_at}
                                        onChange={(e: any) => setData('issued_at', e.target.value)}
                                    />
                                    <InputError message={errors.issued_at} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date</Label>
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
                                <h3 className="text-lg font-semibold border-b pb-2">Vehicle Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle_registration">Vehicle Registration</Label>
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
                                        <Label htmlFor="vehicle_model">Vehicle Model</Label>
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
                                <h3 className="text-lg font-semibold border-b pb-2">EV Charging Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="charger_type">Charger Type</Label>
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
                                        <Label htmlFor="charging_duration_minutes">Charging Duration (minutes)</Label>
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
                                        <Label htmlFor="rate_per_kwh">Rate Per kWh ({data.currency})</Label>
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
                                        <Label htmlFor="kwh_consumed">kWh Consumed</Label>
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
                                        <Label htmlFor="tax_rate_percentage">Tax Rate (%)</Label>
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

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e: any) => setData('description', e.target.value)}
                                    placeholder="Enter description"
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>


                            {/* Payment Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <Input
                                        id="payment_method"
                                        type="text"
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        placeholder="e.g., Cash, Card, Bank Transfer"
                                    />
                                    <InputError message={errors.payment_method} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_reference">Payment Reference</Label>
                                    <Input
                                        id="payment_reference"
                                        type="text"
                                        value={data.payment_reference}
                                        onChange={(e) => setData('payment_reference', e.target.value)}
                                        placeholder="Transaction ID, Check number, etc."
                                    />
                                    <InputError message={errors.payment_reference} />
                                </div>
                            </div>

                            {/* Amounts */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Amount Calculation</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/30 p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">
                                            Subtotal ({data.currency})
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_amount">
                                            Tax Amount ({data.currency})
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
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e: any) => setData('notes', e.target.value)}
                                    placeholder="Additional notes"
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Create {data.type === 'receipt' ? 'Receipt' : 'Invoice'}
                                </Button>
                                <Link href="/admin/receipts">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

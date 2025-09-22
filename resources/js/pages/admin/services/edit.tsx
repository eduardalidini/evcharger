import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as servicesIndex, show as servicesShow } from '@/routes/admin/services';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

interface ChargingService {
    id: number;
    name: string;
    description: string;
    rate_per_kwh: number;
    currency: string;
    is_active: boolean;
    sort_order: number;
}

interface Props {
    service: ChargingService;
}

export default function EditService({ service }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Services', href: servicesIndex().url },
        { title: service.name, href: servicesShow(service.id).url },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: service.name,
        description: service.description || '',
        rate_per_kwh: service.rate_per_kwh,
        currency: service.currency,
        is_active: service.is_active,
        sort_order: service.sort_order,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/admin/services/${service.id}`);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${service.name} - Charging Service`} />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Link href={servicesShow(service.id).url}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Service
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Service</h1>
                        <p className="text-muted-foreground">Update the charging service details</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Service Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter service name"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rate_per_kwh">Rate per kWh</Label>
                                <Input
                                    id="rate_per_kwh"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    max="999.9999"
                                    value={data.rate_per_kwh}
                                    onChange={(e) => setData('rate_per_kwh', parseFloat(e.target.value) || 0)}
                                    placeholder="0.0000"
                                    required
                                />
                                {errors.rate_per_kwh && (
                                    <p className="text-sm text-red-600">{errors.rate_per_kwh}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Input
                                    id="currency"
                                    type="text"
                                    maxLength={3}
                                    value={data.currency}
                                    onChange={(e) => setData('currency', e.target.value.toUpperCase())}
                                    placeholder="ALL"
                                    required
                                />
                                {errors.currency && (
                                    <p className="text-sm text-red-600">{errors.currency}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sort_order">Sort Order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                                {errors.sort_order && (
                                    <p className="text-sm text-red-600">{errors.sort_order}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Enter service description (optional)"
                                rows={4}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <Label htmlFor="is_active">Active Service</Label>
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                            <Button type="button" variant="outline" asChild>
                                <Link href={servicesShow(service.id).url}>
                                    Cancel
                                </Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}

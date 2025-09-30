import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { index as servicesIndex, update as servicesUpdate } from '@/routes/admin/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface ServiceForm {
    id: number;
    name: string;
    description: string | null;
    rate_per_kwh: number;
    currency: string;
    is_active: boolean;
}

export default function ServiceEditPage({ service }: { service: ServiceForm }) {
    const [form, setForm] = useState<ServiceForm>({ ...service });
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Services', href: servicesIndex().url },
        { title: 'Edit', href: '#' },
    ];

    const onChange = (field: keyof ServiceForm, value: string | number | boolean | null) => {
        setForm(prev => ({ ...prev, [field]: value as any }));
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Service - ${service.name}`} />
            <Card>
                <CardHeader>
                    <CardTitle>Edit Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input value={form.name} onChange={e => onChange('name', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <Input value={form.description ?? ''} onChange={e => onChange('description', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Rate per kWh</label>
                            <Input type="number" step="0.0001" value={form.rate_per_kwh} onChange={e => onChange('rate_per_kwh', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Currency</label>
                            <Input value={form.currency} onChange={e => onChange('currency', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox checked={form.is_active} onCheckedChange={(v: boolean) => onChange('is_active', v)} />
                        <span className="text-sm">Active</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setProcessing(true);
                                router.put(servicesUpdate({ service: form.id }).url, {
                                    name: form.name,
                                    description: form.description,
                                    rate_per_kwh: Number(form.rate_per_kwh),
                                    currency: form.currency,
                                    is_active: form.is_active,
                                }, {
                                    onFinish: () => setProcessing(false),
                                });
                            }}
                            disabled={processing || !form.name}
                        >
                            Save
                        </Button>
                        <Button variant="outline" onClick={() => history.back()}>Cancel</Button>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}



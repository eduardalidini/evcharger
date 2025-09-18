import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as currencyIndex, store as currencyStore, update as currencyUpdate, destroy as currencyDestroy } from '@/routes/admin/currencies';
import { LoaderCircle, Plus, Edit, Trash2, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CurrencyRow {
    id: number;
    currency_code: string;
    price_per_kwh: number;
    tax_percent: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

interface CurrencyProps {
    currencies: CurrencyRow[];
}

export default function CurrencyIndex({ currencies }: CurrencyProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingRow, setEditingRow] = useState<CurrencyRow | null>(null);
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('admin.navigation.dashboard'), href: dashboard().url },
        { title: t('admin.navigation.currencies'), href: currencyIndex().url },
    ];

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        currency_code: '',
        price_per_kwh: '',
        tax_percent: '',
        is_default: false,
    });

    const handleCreate = () => {
        setIsCreating(true);
        setEditingRow(null);
        reset();
        setData('currency_code', '');
        setData('price_per_kwh', '');
        setData('tax_percent', '');
        setData('is_default', false);
    };

    const handleEdit = (row: CurrencyRow) => {
        setEditingRow(row);
        setIsCreating(false);
        setData('currency_code', row.currency_code);
        setData('price_per_kwh', String(row.price_per_kwh));
        setData('tax_percent', String(row.tax_percent));
        setData('is_default', row.is_default ? true : false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRow) {
            put(currencyUpdate({ currency: editingRow.id }).url, {
                onSuccess: () => {
                    reset();
                    setEditingRow(null);
                    router.reload();
                },
            });
        } else {
            post(currencyStore().url, {
                onSuccess: () => {
                    reset();
                    setIsCreating(false);
                    router.reload();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirmDelete') || 'Are you sure?')) {
            destroy(currencyDestroy({ currency: id }).url, {
                onSuccess: () => router.reload(),
            });
        }
    };


    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('admin.navigation.currencies')} />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    <h1 className="text-xl font-semibold">{t('currencies.title')}</h1>
                </div>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" /> {t('common.create')}
                </Button>
            </div>

            {(isCreating || editingRow) && (
                <form onSubmit={handleSubmit} className="space-y-4 border rounded-md p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <Label>{t('currencies.currency')}</Label>
                            <Input value={data.currency_code} onChange={(e) => setData('currency_code', e.target.value.toUpperCase())} />
                            {errors.currency_code && <p className="text-sm text-red-500">{errors.currency_code}</p>}
                        </div>
                        <div>
                            <Label>{t('currencies.pricePerKwh')}</Label>
                            <Input type="number" step="0.01" value={data.price_per_kwh} onChange={(e) => setData('price_per_kwh', e.target.value)} />
                            {errors.price_per_kwh && <p className="text-sm text-red-500">{errors.price_per_kwh}</p>}
                        </div>
                        
                        <div>
                            <Label>{t('currencies.taxPercent')}</Label>
                            <Input type="number" step="0.01" value={data.tax_percent} onChange={(e) => setData('tax_percent', e.target.value)} />
                            {errors.tax_percent && <p className="text-sm text-red-500">{errors.tax_percent}</p>}
                        </div>
                        <div className="flex items-end gap-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={!!data.is_default} onChange={(e) => setData('is_default', e.target.checked)} />
                                <span>{t('currencies.default')}</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : t('common.save')}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => { reset(); setIsCreating(false); setEditingRow(null); }}>
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left">
                            <th className="px-2 py-2">{t('currencies.currency')}</th>
                            <th className="px-2 py-2">{t('currencies.pricePerKwh')}</th>
                            
                            <th className="px-2 py-2">{t('currencies.taxPercent')}</th>
                            <th className="px-2 py-2">{t('currencies.default')}</th>
                            <th className="px-2 py-2">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currencies.map(row => (
                            <tr key={row.id} className="border-t">
                                <td className="px-2 py-2">{row.currency_code}</td>
                                <td className="px-2 py-2">{row.price_per_kwh}</td>
                                
                                <td className="px-2 py-2">{row.tax_percent}</td>
                                <td className="px-2 py-2">{row.is_default ? t('common.yes') : t('common.no')}</td>
                                <td className="px-2 py-2">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(row)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(row.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}



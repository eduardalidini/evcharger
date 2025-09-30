import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as servicesIndex, show as servicesShow, store as servicesStore, edit as servicesEdit, destroy as servicesDestroy } from '@/routes/admin/services';
import { useState, useEffect } from 'react';
import { Play, Square, Users, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';

interface ChargingService {
    id: number;
    name: string;
    description: string;
    rate_per_kwh: number | string;
    currency: string;
    is_active: boolean;
}

interface ChargePoint {
    id: number;
    identifier: string;
    name: string;
    location: string;
    status: string;
    connector_count: number;
    max_power: number;
}

interface Stats { total_services: number; active_sessions: number; available_charge_points: number; total_charge_points: number; }

interface ServicesIndexProps { services: ChargingService[]; chargePoints: ChargePoint[]; stats: Stats; }

export default function ServicesIndex({ services, chargePoints, stats }: ServicesIndexProps) {
    const { t } = useTranslation();
    const [processing, setProcessing] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        rate_per_kwh: '',
        currency: 'ALL',
        is_active: true,
    });
    const [liveStats, setLiveStats] = useState(stats);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.services'),
            href: servicesIndex().url,
        },
    ];

    const onCreateChange = (field: keyof typeof createForm, value: string | boolean) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    const submitCreate = () => {
        setProcessing(true);
        router.post(servicesStore().url, {
            name: createForm.name,
            description: createForm.description || null,
            rate_per_kwh: Number(createForm.rate_per_kwh || 0),
            currency: createForm.currency,
            is_active: createForm.is_active,
        }, {
            onSuccess: () => {
                setCreateOpen(false);
                setCreateForm({ name: '', description: '', rate_per_kwh: '', currency: 'ALL', is_active: true });
            },
            onFinish: () => setProcessing(false),
            preserveScroll: true,
        });
    };

    // Update local state when props change
    useEffect(() => {
        setLiveStats(stats);
    }, [stats]);

    // Session Manager removed from this page; leftover stopSession removed

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            'Active': 'default',
            'Paused': 'secondary',
            'Starting': 'outline',
            'Available': 'default',
            'Occupied': 'destructive',
            'Unavailable': 'secondary',
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const safeNumber = (value: number | string | null | undefined): number => {
        return Number(value) || 0;
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('services.chargingServices')} />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('common.services')}</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_services}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('services.chargingServices')}</CardTitle>
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button>{t('services.newService')}</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('services.createService')}</DialogTitle>
                                        <DialogDescription>{t('services.createServiceDescription')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">{t('common.name')}</label>
                                            <Input value={createForm.name} onChange={(e) => onCreateChange('name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">{t('services.description')}</label>
                                            <Input value={createForm.description} onChange={(e) => onCreateChange('description', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium">{t('services.ratePerKwh')}</label>
                                                <Input type="number" step="0.0001" value={createForm.rate_per_kwh} onChange={(e) => onCreateChange('rate_per_kwh', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">{t('services.currency')}</label>
                                                <Input value={createForm.currency} onChange={(e) => onCreateChange('currency', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox checked={createForm.is_active} onCheckedChange={(v: boolean) => onCreateChange('is_active', v)} />
                                            <span className="text-sm">{t('common.active')}</span>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
                                        <Button onClick={submitCreate} disabled={processing || !createForm.name || !createForm.rate_per_kwh}>{t('common.create')}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('common.name')}</TableHead>
                                        <TableHead>{t('common.rate')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead>{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{service.name}</div>
                                                    <div className="text-sm text-muted-foreground">{service.description}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {safeNumber(service.rate_per_kwh).toFixed(2)} {service.currency}/kWh
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(service.is_active ? t('common.active') : t('common.inactive'))}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Link href={servicesShow(service.id).url}>
                                                        <Button variant="outline" size="sm">{t('common.view')}</Button>
                                                    </Link>
                                                    <Link href={servicesEdit({ service: service.id }).url}>
                                                        <Button variant="outline" size="sm">{t('common.edit')}</Button>
                                                    </Link>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (!confirm(t('services.messages.confirmDelete'))) return;
                                                            router.delete(servicesDestroy(service.id).url);
                                                        }}
                                                    >
                                                        {t('common.delete')}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
            </div>
        </AdminLayout>
    );
}

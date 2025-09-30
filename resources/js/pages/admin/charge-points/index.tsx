import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as chargePointsIndex, store as chargePointsStore, update as chargePointsUpdate, destroy as chargePointsDestroy } from '@/routes/admin/charge-points';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
interface ChargePoint {
    id: number;
    identifier: string;
    name: string;
    location: string;
    status: string;
    connector_count: number;
    max_power: number;
}

interface Props {
    chargePoints: ChargePoint[];
}

export default function ChargePointsIndex({ chargePoints }: Props) {
    const { t } = useTranslation();     
    const [liveChargePoints, setLiveChargePoints] = useState<ChargePoint[]>(chargePoints);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState<null | number>(null);
    const [processing, setProcessing] = useState(false);
    const [createForm, setCreateForm] = useState({
        identifier: '',
        name: '',
        location: '',
        connector_count: '1',
        max_power: '',
    });
    const [editForm, setEditForm] = useState<Record<number, any>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('admin.navigation.dashboard'), href: dashboard().url },
        { title: t('chargePoints.title'), href: chargePointsIndex().url },
    ];

    // Live updates via Echo + fallback polling
    useEffect(() => {
        const echo: any = (window as any).Echo;
        let interval: NodeJS.Timeout | undefined;

        const onChargePointUpdated = (event: any) => {
            const updated = event.charge_point;
            setLiveChargePoints(prev => prev.map(cp => cp.id === updated.id ? { ...cp, status: updated.status } : cp));
        };

        if (echo) {
            try {
                const adminChannel = echo.private('admin.charging');
                const globalPublic = echo.channel('charging.global');
                adminChannel.listen('.charge_point.status_updated', onChargePointUpdated);
                globalPublic
                    .listen('.charge_point.status_updated', onChargePointUpdated)
                    .listen('.ocpp.status', (e: any) => {
                        setLiveChargePoints(prev => prev.map(cp => cp.identifier === e.identifier ? { ...cp, status: e.status } : cp));
                    })
                    .listen('.ocpp.log', () => {/* optional raw log hook */});
            } catch {}
        } else {
            interval = setInterval(() => {
                router.reload({ only: ['chargePoints'] });
            }, 3000);
        }

        return () => {
            const e: any = (window as any).Echo;
            if (e) {
                try { e.leaveChannel('private-admin.charging'); } catch {}
                try { e.leaveChannel('charging.global'); } catch {}
            }
            if (interval) clearInterval(interval);
        };
    }, []);

    useEffect(() => setLiveChargePoints(chargePoints), [chargePoints]);

    const onCreateChange = (field: keyof typeof createForm, value: string | boolean) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    const submitCreate = () => {
        setProcessing(true);
        router.post(chargePointsStore().url, {
            identifier: createForm.identifier,
            name: createForm.name,
            location: createForm.location || null,
            connector_count: Number(createForm.connector_count || 1),
            max_power: createForm.max_power ? Number(createForm.max_power) : null,
        }, {
            onSuccess: () => {
                setCreateOpen(false);
                setCreateForm({ identifier: '', name: '', location: '', connector_count: '1', max_power: '' });
            },
            onFinish: () => setProcessing(false),
            preserveScroll: true,
        });
    };

    const openEdit = (cp: ChargePoint) => {
        setEditForm(prev => ({ ...prev, [cp.id]: {
            identifier: cp.identifier,
            name: cp.name,
            location: cp.location || '',
            connector_count: String(cp.connector_count || 1),
            max_power: cp.max_power ? String(cp.max_power) : '',
        }}));
        setEditOpen(cp.id);
    };

    const onEditChange = (id: number, field: string, value: any) => {
        setEditForm(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };

    const submitEdit = (id: number) => {
        const data = editForm[id];
        router.put(chargePointsUpdate(id).url, {
            name: data.name,
            location: data.location || null,
            connector_count: Number(data.connector_count || 1),
            max_power: data.max_power ? Number(data.max_power) : null,
        }, { preserveScroll: true, onSuccess: () => setEditOpen(null) });
    };

    const destroy = (id: number) => {
        if (!confirm(t('chargePoints.deleteConfirm'))) return;
        router.delete(chargePointsDestroy(id).url, { preserveScroll: true });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('chargePoints.title')} />

            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>{t('chargePoints.title')}</CardTitle>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>{t('chargePoints.newChargePoint')}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('chargePoints.createChargePoint')}</DialogTitle>
                                <DialogDescription>{t('chargePoints.createChargePointDescription')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">{t('chargePoints.identifier')}</label>
                                    <Input value={createForm.identifier} onChange={(e) => onCreateChange('identifier', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('chargePoints.name')}</label>
                                    <Input value={createForm.name} onChange={(e) => onCreateChange('name', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium">{t('chargePoints.location')}</label>
                                        <Input value={createForm.location} onChange={(e) => onCreateChange('location', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">{t('chargePoints.connectors')}</label>
                                        <Input type="number" value={createForm.connector_count} onChange={(e) => onCreateChange('connector_count', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">{t('chargePoints.maxPower')}</label>
                                        <Input type="number" step="0.01" value={createForm.max_power} onChange={(e) => onCreateChange('max_power', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
                                <Button onClick={submitCreate} disabled={processing || !createForm.identifier || !createForm.name}>{t('common.create')}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('chargePoints.name')}</TableHead>
                                <TableHead>{t('chargePoints.location')}</TableHead>
                                <TableHead>{t('common.status')}</TableHead>
                                <TableHead>{t('chargePoints.connectors')}</TableHead>
                                <TableHead>{t('chargePoints.maxPower')}</TableHead>
                                <TableHead>{t('chargePoints.type')}</TableHead>
                                <TableHead>{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {liveChargePoints.map((cp) => (
                                <TableRow key={cp.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{cp.name}</div>
                                            <div className="text-sm text-muted-foreground">{cp.identifier}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{cp.location}</TableCell>
                                    <TableCell>
                                        <Badge variant={cp.status === 'Available' ? 'default' : cp.status === 'Occupied' ? 'destructive' : 'secondary'}>
                                            {t(`chargePoints.status.${cp.status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{cp.connector_count}</TableCell>
                                    <TableCell>{cp.max_power} kW</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell>
                                        <Dialog open={editOpen === cp.id} onOpenChange={(open) => setEditOpen(open ? cp.id : null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">{t('common.edit')}</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>{t('chargePoints.editChargePoint')}</DialogTitle>
                                                    <DialogDescription>{t('chargePoints.editChargePointDescription')}</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="md:col-span-2">
                                                            <label className="text-sm font-medium">{t('chargePoints.identifier')}</label>
                                                            <Input value={editForm[cp.id]?.identifier || cp.identifier} disabled />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium">{t('chargePoints.name')}</label>
                                                            <Input value={editForm[cp.id]?.name || ''} onChange={(e) => onEditChange(cp.id, 'name', e.target.value)} />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-sm font-medium">{t('chargePoints.location')}</label>
                                                            <Input value={editForm[cp.id]?.location || ''} onChange={(e) => onEditChange(cp.id, 'location', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium">{t('chargePoints.connectors')}</label>
                                                            <Input type="number" value={editForm[cp.id]?.connector_count || '1'} onChange={(e) => onEditChange(cp.id, 'connector_count', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium">{t('chargePoints.maxPower')}</label>
                                                            <Input type="number" step="0.01" value={editForm[cp.id]?.max_power || ''} onChange={(e) => onEditChange(cp.id, 'max_power', e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setEditOpen(null)}>{t('common.cancel')}</Button>
                                                    <Button onClick={() => submitEdit(cp.id)}>{t('common.save')}</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <Button variant="outline" size="sm" className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => destroy(cp.id)}>{t('common.delete')}</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}







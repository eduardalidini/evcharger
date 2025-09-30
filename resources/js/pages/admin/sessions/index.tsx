import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { index as sessionsIndex } from '@/routes/admin/sessions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play } from 'lucide-react';
import { users as sessionsUsers } from '@/routes/admin/sessions';
import { start as simulationStart } from '@/routes/admin/services/simulation';
import { useTranslation } from 'react-i18next';

interface ActiveSessionRow {
    id: number;
    status: string;
    started_at: string | null;
    duration_minutes: number;
    energy_consumed: number;
    credits_used: number;
    connector_id: number | null;
    charge_point: { id: number; name?: string | null; identifier?: string | null; status?: string | null };
    service: { id: number; name?: string | null; currency?: string | null };
    user: { id: number; type: string | null; full_name: string; email?: string | null };
}

export default function AdminSessionsIndex({ activeSessions: initialActive }: { activeSessions?: ActiveSessionRow[] }) {
    const { t } = useTranslation();
    const [activeSessions, setActiveSessions] = useState<ActiveSessionRow[]>(initialActive || []);
    const [processing, setProcessing] = useState(false);
    // Session Manager (ported from Services)
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [userOptions, setUserOptions] = useState<{ id: number | string; full_name: string; type: 'individual' | 'business' }[]>([]);
    const [services, setServices] = useState<{ id: number; name: string }[]>([]);
    const [chargePoints, setChargePoints] = useState<{ id: number; name?: string | null; identifier?: string | null; status?: string | null }[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [selectedChargePointId, setSelectedChargePointId] = useState<string>('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('sessions.title'), href: sessionsIndex().url },
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        const fetchInitial = async () => {
            try {
                const res = await fetch('/admin/sessions/active', { headers: { 'Accept': 'application/json' } });
                const json = await res.json();
                setActiveSessions(json.data || []);
            } catch {}
        };
        fetchInitial();

        // Load selects for Manager (same sources as services manager uses for users/services/chargePoints)
        fetch(sessionsUsers().url, { headers: { 'Accept': 'application/json' } })
            .then(r => r.json())
            .then(j => setUserOptions((j.data || []).map((u: any) => ({ id: u.id.toString(), full_name: u.full_name, type: u.type }))))
            .catch(() => setUserOptions([]));
        fetch('/admin/sessions/services', { headers: { 'Accept': 'application/json' } })
            .then(r => r.json())
            .then(j => setServices(j.data || []))
            .catch(() => setServices([]));
        fetch('/admin/sessions/charge-points', { headers: { 'Accept': 'application/json' } })
            .then(r => r.json())
            .then(j => setChargePoints(j.data || []))
            .catch(() => setChargePoints([]));

        const echo: any = (window as any).Echo;
        if (echo) {
            try {
                const adminChannel = echo.private('admin.charging');
                adminChannel
                    .listen('.session.started', (e: any) => setActiveSessions(prev => {
                        const s = e.session; if (!s?.id) return prev; const exists = prev.some(x => x.id === s.id);
                        const user = { id: s.user_id, type: null, full_name: s.user_name || `User ${s.user_id}` };
                        const cp = { id: s.charge_point_id, name: s.charge_point_name, identifier: s.charge_point_name, status: s.charge_point_status };
                        const service = { id: 0, name: s.service_name, currency: undefined };
                        const row: ActiveSessionRow = {
                            id: s.id, status: s.status, started_at: s.started_at, duration_minutes: s.duration_minutes ?? 0,
                            energy_consumed: s.energy_consumed ?? 0, credits_used: s.credits_used ?? 0, connector_id: s.connector_id ?? null,
                            charge_point: cp, service, user,
                        };
                        return exists ? prev.map(x => x.id === s.id ? row : x) : [row, ...prev];
                    }))
                    .listen('.session.updated', (e: any) => setActiveSessions(prev => prev.map(x => x.id === e.session.id ? {
                        ...x,
                        status: e.session.status,
                        energy_consumed: e.session.energy_consumed ?? x.energy_consumed,
                        credits_used: e.session.credits_used ?? x.credits_used,
                        duration_minutes: e.session.duration_minutes ?? x.duration_minutes,
                        charge_point: { ...x.charge_point, status: e.session.charge_point_status ?? x.charge_point.status },
                    } : x)))
                    .listen('.session.stopped', (e: any) => setActiveSessions(prev => prev.filter(x => x.id !== e.session.id)));
            } catch {
                interval = setInterval(() => router.reload({ only: [] }), 5000);
            }
        } else {
            interval = setInterval(() => fetchInitial(), 5000);
        }

        return () => {
            const e: any = (window as any).Echo;
            if (e) { try { e.leaveChannel('private-admin.charging'); } catch {} }
            if (interval) clearInterval(interval);
        };
    }, []);

    const startSimulation = () => {
        if (!selectedUserId || !selectedServiceId || !selectedChargePointId) {
            alert(t('sessions.selectAllRequired'));
            return;
        }

        setProcessing(true);
        router.post(simulationStart().url, {
            user_id: parseInt(selectedUserId),
            user_type: (userOptions.find(u => u.id.toString() === selectedUserId)?.type) || 'individual',
            charging_service_id: parseInt(selectedServiceId),
            charge_point_id: parseInt(selectedChargePointId),
            connector_id: 1,
        }, {
            onSuccess: () => {
                setSelectedUserId('');
                setSelectedServiceId('');
                setSelectedChargePointId('');
            },
            onFinish: () => setProcessing(false),
            preserveScroll: true,
        });
    };

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

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('sessions.title')} />
            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">{t('sessions.activeSessions')}</TabsTrigger>
                    <TabsTrigger value="manager">{t('sessions.sessionManager')}</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('sessions.activeSessions')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('sessions.user')}</TableHead>
                                        <TableHead>{t('sessions.chargePoint')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead>{t('sessions.kwh')}</TableHead>
                                        <TableHead>{t('sessions.duration')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeSessions.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-muted-foreground">{t('sessions.noActiveSessions')}</TableCell></TableRow>
                                    ) : activeSessions.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell>{s.user.full_name} ({(s.user.type || '').toLowerCase() === 'business' ? 'business' : (s.user.type || 'individual')})</TableCell>
                                            <TableCell>{s.charge_point.name || s.charge_point.identifier} ({s.charge_point.status || '-'})</TableCell>
                                            <TableCell>{getStatusBadge(s.status)}</TableCell>
                                            <TableCell>{Number(s.energy_consumed || 0).toFixed(3)}</TableCell>
                                            <TableCell>{s.duration_minutes}m</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        router.post(`/admin/sessions/${s.id}/stop`, {}, { preserveScroll: true });
                                                    }}
                                                >
                                                    {t('sessions.stop')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manager">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('sessions.sessionManager')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('sessions.user')}</label>
                                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('sessions.selectUser')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {userOptions.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {u.full_name} ({u.type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('common.services')}</label>
                                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('sessions.selectService')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.id.toString()}>
                                                    {service.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('sessions.chargePoint')}</label>
                                    <Select value={selectedChargePointId} onValueChange={setSelectedChargePointId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('sessions.selectChargePoint')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {chargePoints.filter(cp => (cp.status || '').toLowerCase() === 'available').map((cp) => (
                                                <SelectItem key={cp.id} value={cp.id.toString()}>
                                                    {cp.name || cp.identifier} ({cp.status || '-'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button onClick={startSimulation} disabled={processing || !selectedUserId || !selectedServiceId || !selectedChargePointId} className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                {t('sessions.startSession')}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}



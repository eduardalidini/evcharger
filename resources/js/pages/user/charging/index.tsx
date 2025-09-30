import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Play, Pause, Square, Zap, AlertCircle, Clock, Battery, DollarSign, Activity } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    surname: string;
    balance: number | string;
}

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
    status: string;
}

interface ActiveSession {
    id: number;
    service_name: string;
    charge_point_name: string;
    status: string;
    started_at: string;
    energy_consumed: number | string;
    credits_used: number | string;
    credits_reserved: number | string;
    rate_per_kwh: number | string;
}

interface RecentTransaction {
    id: number;
    reference: string;
    service_name: string;
    charge_point_name: string;
    energy_consumed: number | string;
    total_amount: number | string;
    duration_minutes: number;
    created_at: string;
}

interface ChargingIndexProps {
    user: User;
    services: ChargingService[];
    chargePoints: ChargePoint[];
    activeSession: ActiveSession | null;
    recentTransactions: RecentTransaction[];
}

export default function ChargingIndex({ 
    user, 
    services, 
    chargePoints, 
    activeSession, 
    recentTransactions 
}: ChargingIndexProps) {
    const { t } = useTranslation();
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [selectedChargePointId, setSelectedChargePointId] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [preparingIdentifier, setPreparingIdentifier] = useState<string>('');
    const [sessionTimer, setSessionTimer] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [liveChargePoints, setLiveChargePoints] = useState<ChargePoint[]>(chargePoints);

    // WebSocket listeners for real-time updates
    useEffect(() => {
        const echo: any = (window as any).Echo;
        let interval: NodeJS.Timeout | undefined;

        if (echo) {
            try {
                const globalChannel = echo.channel('charging.global');
                let userChannel: any = null;
                if (user?.id) {
                    userChannel = echo.private(`user.charging.${user.id}`);
                }

                const reloadUser = (only: string[]) => router.reload({ only });

                const applySessionChargePoint = (event: any) => {
                    const s = event.session;
                    if (!s?.charge_point_id || !s?.charge_point_status) return;
                    setLiveChargePoints(prev => prev.map(cp => cp.id === s.charge_point_id ? { ...cp, status: s.charge_point_status } : cp));
                };

                if (userChannel) {
                    userChannel
                        .listen('.session.started', (e: any) => { applySessionChargePoint(e); reloadUser(['activeSession', 'recentTransactions']); })
                        .listen('.session.stopped', (e: any) => { applySessionChargePoint(e); reloadUser(['activeSession', 'recentTransactions', 'user']); })
                        .listen('.session.updated', (e: any) => { applySessionChargePoint(e); reloadUser(['activeSession']); });
                }

                globalChannel.listen('.charge_point.status_updated', (event: any) => {
                    const updated = event.charge_point;
                    setLiveChargePoints(prev => prev.map(cp => cp.id === updated.id ? { ...cp, status: updated.status } : cp));
                    setPreparingIdentifier(prev => (updated.identifier === prev && updated.status !== 'Preparing') ? '' : prev);
                });
                globalChannel.listen('.ocpp.status', (e: any) => {
                    // e = { identifier, connectorId, status, timestamp }
                    setLiveChargePoints(prev => prev.map(cp => cp.identifier === e.identifier ? { ...cp, status: e.status } : cp));
                    if (e.status === 'Preparing') {
                        setPreparingIdentifier(e.identifier);
                    } else {
                        setPreparingIdentifier(prev => (e.identifier === prev ? '' : prev));
                    }
                });
            } catch (error) {
                // Fall back to polling
                interval = setInterval(() => {
                    router.reload({ only: ['activeSession', 'user', 'recentTransactions', 'chargePoints'] });
                }, 2000);
            }
        } else {
            // No Echo; poll
            interval = setInterval(() => {
                router.reload({ only: ['activeSession', 'user', 'recentTransactions', 'chargePoints'] });
            }, 2000);
        }

        return () => {
            const e: any = (window as any).Echo;
            if (e) {
                if (user?.id) { try { e.leaveChannel(`private-user.charging.${user.id}`); } catch {} }
                try { e.leaveChannel('charging.global'); } catch {}
            }
            if (interval) clearInterval(interval);
        };
    }, [user?.id]);

    // Real-time session timer updates
    useEffect(() => {
        if (!activeSession) return;

        const interval = setInterval(() => {
            // Calculate session duration
            const startTime = new Date(activeSession.started_at).getTime();
            const now = new Date().getTime();
            const durationMinutes = Math.floor((now - startTime) / (1000 * 60));
            setSessionTimer(durationMinutes);

            // Simulate energy consumption and cost
            const simulatedConsumption = (durationMinutes / 60) * 10; // 10 kWh per hour
            const cost = simulatedConsumption * safeNumber(activeSession.rate_per_kwh);
            setEstimatedCost(cost);

            // Check if credits are running out and auto-stop
            if (cost >= safeNumber(user.balance) && activeSession.status === 'Active') {
                console.log('Credits exhausted, stopping session automatically...');
                router.post(`/user/charging/session/${activeSession.id}/stop`, {}, {
                    preserveScroll: true,
                });
                return;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeSession]);

    // Update live charge points when props change
    useEffect(() => {
        setLiveChargePoints(chargePoints);
    }, [chargePoints]);

    // Ensure Preparing banner clears when the CP becomes Available in live list
    useEffect(() => {
        if (!preparingIdentifier) return;
        const cp = liveChargePoints.find(x => x.identifier === preparingIdentifier);
        if (cp && cp.status !== 'Preparing') {
            setPreparingIdentifier('');
        }
    }, [liveChargePoints, preparingIdentifier]);

    const startSession = async () => {
        if (!selectedServiceId || !selectedChargePointId) {
            alert(t('charging.selectBothRequired'));
            return;
        }

        if (safeNumber(user.balance) < 10) {
            alert(t('charging.insufficientCreditsAlert'));
            return;
        }

        setProcessing(true);
        try {
            const cpIdNum = parseInt(selectedChargePointId);
            const selectedCp = liveChargePoints.find(cp => cp.id === cpIdNum);
            if (!selectedCp) throw new Error('Charge point not found');

            // Call web-proxied route (session-auth) to avoid 401
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/ocpp/${encodeURIComponent(selectedCp.identifier)}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ idTag: selectedCp.identifier, connectorId: 1 }),
                credentials: 'include',
            });
            if (!res.ok) {
                const body = await res.text();
                throw new Error(`Start failed: ${res.status} ${body}`);
            }
            // Show immediate local hint while waiting for realtime event
            setLiveChargePoints(prev => prev.map(cp => cp.id === cpIdNum ? { ...cp, status: 'Preparing' } : cp));
            setPreparingIdentifier(selectedCp.identifier);
            // Clear selections; real-time events will update status to Preparing
            setSelectedServiceId('');
            setSelectedChargePointId('');
        } catch (e) {
            console.error(e);
            alert('Failed to start charging. Please try again.');
            setPreparingIdentifier('');
        } finally {
            setProcessing(false);
        }
    };

    const pauseSession = () => {
        if (!activeSession) return;
        setProcessing(true);
        router.post(`/user/charging/session/${activeSession.id}/pause`, {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const resumeSession = () => {
        if (!activeSession) return;
        
        if (safeNumber(user.balance) < 5) {
            alert(t('charging.insufficientCreditsResume'));
            return;
        }
        
        setProcessing(true);
        router.post(`/user/charging/session/${activeSession.id}/resume`, {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const stopSession = () => {
        if (!activeSession) return;
        setProcessing(true);
        router.post(`/user/charging/session/${activeSession.id}/stop`, {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-green-600';
            case 'Paused': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const safeNumber = (value: number | string | null | undefined): number => {
        return Number(value) || 0;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard'),
            href: '/dashboard',
        },
        {
            title: t('charging.title'),
            href: '/user/charging',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="EV Charging" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">EV Charging Services</h1>
                    <p className="text-gray-600">Manage your electric vehicle charging sessions</p>
                </div>

                {/* User Balance Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            Available Credits
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-green-600">
                                    {safeNumber(user.balance).toFixed(2)} ALL
                                </div>
                                <p className="text-sm text-gray-600">
                                    1 credit = 1 ALL • Used for charging sessions
                                </p>
                            </div>
                            {safeNumber(user.balance) < 10 && (
                                <div className="flex items-center gap-2 text-orange-600">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="text-sm">Low balance</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Inline preparing banner now handled inside Start New Session card */}

                {/* Active Session */}
                {activeSession && (
                    <Card className="mb-6 border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className={`h-5 w-5 ${getStatusColor(activeSession.status)}`} />
                                Active Charging Session
                                <Badge className={getStatusColor(activeSession.status)}>
                                    {activeSession.status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <div className="text-sm text-gray-600">Service</div>
                                    <div className="font-medium">{activeSession.service_name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Charge Point</div>
                                    <div className="font-medium">{activeSession.charge_point_name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Duration</div>
                                    <div className="font-medium flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {formatDuration(sessionTimer)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Energy</div>
                                    <div className="font-medium flex items-center gap-1">
                                        <Battery className="h-4 w-4" />
                                        {((sessionTimer / 60) * 10).toFixed(2)} kWh
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-lg">
                                    <div className="text-sm text-gray-600">Estimated Cost</div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {estimatedCost.toFixed(2)} ALL
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Rate: {safeNumber(activeSession.rate_per_kwh)} ALL/kWh
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg">
                                    <div className="text-sm text-gray-600">Session Started</div>
                                    <div className="font-medium">
                                        {new Date(activeSession.started_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Session Controls */}
                            <div className="flex gap-3">
                                {activeSession.status === 'Active' && (
                                    <Button 
                                        onClick={pauseSession} 
                                        disabled={processing}
                                        variant="secondary"
                                    >
                                        <Pause className="h-4 w-4 mr-2" />
                                        Pause
                                    </Button>
                                )}
                                {activeSession.status === 'Paused' && (
                                    <Button 
                                        onClick={resumeSession} 
                                        disabled={processing || safeNumber(user.balance) < 5}
                                        variant="default"
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Resume
                                    </Button>
                                )}
                                <Button 
                                    onClick={stopSession} 
                                    disabled={processing}
                                    variant="destructive"
                                >
                                    <Square className="h-4 w-4 mr-2" />
                                    Stop Session
                                </Button>
                            </div>

                            {/* Low balance warning */}
                            {safeNumber(user.balance) < 5 && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    <div className="text-sm text-yellow-800">
                                        <strong>Low Balance Warning:</strong> Your session may stop automatically when credits run out.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Start New Session */}
                {!activeSession && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-500" />
                                Start Charging Session
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {preparingIdentifier ? (
                                <div className="p-4 rounded-md border border-blue-200 bg-blue-50 text-blue-900 flex items-start gap-3">
                                    <span className="mt-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                    <div>
                                        <div className="font-semibold">Preparing to charge…</div>
                                        <div className="text-sm text-blue-800/90">Connector requested on {preparingIdentifier}. Plug in the cable to begin.</div>
                                    </div>
                                </div>
                            ) : (
                                safeNumber(user.balance) < 10 ? (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <div className="font-medium text-yellow-800">Insufficient Credits</div>
                                                <div className="text-sm text-yellow-600">
                                                    Minimum 10 ALL credits required to start a session. 
                                                    <Link href="/marketplace" className="underline ml-1">
                                                        Buy more credits
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Service</label>
                                                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select charging service" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {services.filter(s => s.is_active).map((service) => (
                                                            <SelectItem key={service.id} value={service.id.toString()}>
                                                                <div>
                                                                    <div className="font-medium">{service.name}</div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {safeNumber(service.rate_per_kwh).toFixed(2)} {service.currency}/kWh
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Charge Point</label>
                                                <Select value={selectedChargePointId} onValueChange={setSelectedChargePointId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select charge point" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {liveChargePoints.filter(cp => cp.status === 'Available').map((chargePoint) => (
                                                            <SelectItem key={chargePoint.id} value={chargePoint.id.toString()}>
                                                                {chargePoint.name} ({chargePoint.status})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={startSession} 
                                            disabled={processing || !selectedServiceId || !selectedChargePointId || safeNumber(user.balance) < 10}
                                            className="w-full"
                                            size="lg"
                                        >
                                            <Play className="h-5 w-5 mr-2" />
                                            Start Charging Session
                                        </Button>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Available Services */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Available Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {services.map((service) => (
                                <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{service.name}</div>
                                        <div className="text-sm text-gray-600">{service.description}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{safeNumber(service.rate_per_kwh).toFixed(2)} {service.currency}/kWh</div>
                                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                            {service.is_active ? 'Available' : 'Unavailable'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentTransactions.length === 0 ? (
                            <p className="text-gray-500">No transactions yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{transaction.service_name}</div>
                                            <div className="text-sm text-gray-600">
                                                {transaction.charge_point_name} • {safeNumber(transaction.energy_consumed).toFixed(2)} kWh
                                            </div>
                                            <div className="text-xs text-gray-500">{transaction.reference}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{safeNumber(transaction.total_amount).toFixed(2)} ALL</div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(transaction.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

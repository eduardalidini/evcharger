import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Play, Pause, Square, Zap, AlertCircle, Clock, Battery, DollarSign, Activity } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

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
    is_simulation: boolean;
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
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [selectedChargePointId, setSelectedChargePointId] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [sessionTimer, setSessionTimer] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [liveChargePoints, setLiveChargePoints] = useState<ChargePoint[]>(chargePoints);
    const [liveActiveSession, setLiveActiveSession] = useState<ActiveSession | null>(activeSession);
    const [liveRecentTransactions, setLiveRecentTransactions] = useState<RecentTransaction[]>(recentTransactions);

    // WebSocket listeners for real-time updates
    useEffect(() => {
        if (!window.Echo || !user) {
            console.error('❌ Echo not available or user not found - WebSocket connection required');
            return;
        }

        try {
            console.log('🔗 Setting up WebSocket for user:', user.id);
            
            // Wait for connection to be established
            const setupChannels = () => {
                const userChannel = window.Echo.private(`user.charging.${user.id}`);
                const globalChannel = window.Echo.private('charging.global');
                
                // Debug channel subscription
                userChannel.subscribed(() => {
                    console.log('✅ Successfully subscribed to user channel:', `user.charging.${user.id}`);
                });
                
                userChannel.error((error: any) => {
                    console.error('❌ User channel subscription error:', error);
                });
                
                globalChannel.subscribed(() => {
                    console.log('✅ Successfully subscribed to global channel');
                });
                
                globalChannel.error((error: any) => {
                    console.error('❌ Global channel subscription error:', error);
                });
                
                return { userChannel, globalChannel };
            };
            
            const { userChannel, globalChannel } = setupChannels();
                
            userChannel.listen('.session.started', (event: any) => {
                console.log('🚀 USER: Session started event received:', event);
                const session = event.session;
                
                // Update active session
                setLiveActiveSession({
                    id: session.id,
                    service_name: session.service_name,
                    charge_point_name: session.charge_point_name,
                    status: session.status,
                    started_at: session.started_at,
                    energy_consumed: 0,
                    credits_used: 0,
                    credits_reserved: session.credits_reserved || 0,
                    rate_per_kwh: session.rate_per_kwh || 0
                });
                
                // Update charge points
                setLiveChargePoints(prev => prev.map(cp => 
                    Number(cp.id) === Number(session.charge_point_id)
                        ? { ...cp, status: 'Occupied' }
                        : cp
                ));
            });
                
            userChannel.listen('.session.stopped', (event: any) => {
                console.log('🛑 USER: Session stopped event received:', event);
                const session = event.session;
                const transaction = event.transaction;
                
                // Clear active session
                setLiveActiveSession(null);
                
                // Update charge points
                setLiveChargePoints(prev => prev.map(cp => 
                    Number(cp.id) === Number(session.charge_point_id)
                        ? { ...cp, status: 'Available' }
                        : cp
                ));
                
                // Add to recent transactions
                if (transaction) {
                    setLiveRecentTransactions(prev => [
                        {
                            id: transaction.id,
                            reference: transaction.transaction_reference,
                            service_name: transaction.service_name,
                            charge_point_name: transaction.charge_point_name,
                            energy_consumed: transaction.energy_consumed,
                            total_amount: transaction.total_amount,
                            duration_minutes: transaction.duration_minutes,
                            created_at: transaction.created_at
                        },
                        ...prev.slice(0, 9)
                    ]);
                }
                
                // Reload user balance
                router.reload({ only: ['user'] });
            });
                
            userChannel.listen('.session.updated', (event: any) => {
                console.log('🔄 USER: Session updated event received:', event);
                const session = event.session;
                
                setLiveActiveSession(prev => prev ? {
                    ...prev,
                    status: session.status,
                    energy_consumed: session.energy_consumed || prev.energy_consumed,
                    credits_used: session.credits_used || prev.credits_used
                } : null);
            });
                
                // Listen for charge point status updates on global channel
                globalChannel.listen('.charge_point.status_updated', (event: any) => {
                    console.log('🔋 Charge point status updated in user panel:', event);
                    const updatedChargePoint = event.charge_point;
                    console.log('🔋 CP ID:', updatedChargePoint?.id, 'Status:', updatedChargePoint?.status);
                    
                    // Update the local charge points state
                    setLiveChargePoints(prev => {
                        const updated = prev.map(cp => 
                            Number(cp.id) === Number(updatedChargePoint.id) 
                                ? { ...cp, status: updatedChargePoint.status as string }
                                : cp
                        );
                        console.log('🔋 Updated charge points:', updated);
                        return updated;
                    });
                });
                
            console.log('✅ WebSocket connected for user charging');
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
        }

        return () => {
            if (window.Echo && user) {
                window.Echo.leaveChannel(`user.charging.${user.id}`);
                window.Echo.leaveChannel('charging.global');
            }
        };
    }, [user?.id]);

    // Real-time session timer updates
    useEffect(() => {
        if (!liveActiveSession) return;

        const interval = setInterval(() => {
            // Calculate session duration
            const startTime = new Date(liveActiveSession.started_at).getTime();
            const now = new Date().getTime();
            const durationMinutes = Math.floor((now - startTime) / (1000 * 60));
            setSessionTimer(durationMinutes);

            // Simulate energy consumption and cost
            const simulatedConsumption = (durationMinutes / 60) * 10; // 10 kWh per hour
            const cost = simulatedConsumption * safeNumber(liveActiveSession.rate_per_kwh);
            setEstimatedCost(cost);

            // Check if credits are running out and auto-stop
            if (cost >= safeNumber(user.balance) && liveActiveSession.status === 'Active') {
                console.log('Credits exhausted, stopping session automatically...');
                router.post(`/user/charging/session/${liveActiveSession.id}/stop`, {}, {
                    preserveScroll: true,
                });
                return;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [liveActiveSession]);

    // Update live state when props change
    useEffect(() => {
        setLiveChargePoints(chargePoints);
        setLiveActiveSession(activeSession);
        setLiveRecentTransactions(recentTransactions);
    }, [chargePoints, activeSession, recentTransactions]);

    const startSession = () => {
        if (!selectedServiceId || !selectedChargePointId) {
            alert('Please select both service and charge point');
            return;
        }

        if (safeNumber(user.balance) < 10) {
            alert('Insufficient credits. Minimum 10 ALL required to start a session.');
            return;
        }

        setProcessing(true);
        router.post('/user/charging/start', {
            charging_service_id: parseInt(selectedServiceId),
            charge_point_id: parseInt(selectedChargePointId),
            connector_id: 1,
        }, {
            onSuccess: () => {
                setSelectedServiceId('');
                setSelectedChargePointId('');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const pauseSession = () => {
        if (!liveActiveSession) return;
        setProcessing(true);
        router.post(`/user/charging/session/${liveActiveSession.id}/pause`, {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const resumeSession = () => {
        if (!liveActiveSession) return;
        
        if (safeNumber(user.balance) < 5) {
            alert('Insufficient credits to resume session');
            return;
        }
        
        setProcessing(true);
        router.post(`/user/charging/session/${liveActiveSession.id}/resume`, {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const stopSession = () => {
        if (!liveActiveSession) return;
        setProcessing(true);
        router.post(`/user/charging/session/${liveActiveSession.id}/stop`, {}, {
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
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'EV Charging',
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

                {/* Active Session */}
                {liveActiveSession && (
                    <Card className="mb-6 border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className={`h-5 w-5 ${getStatusColor(liveActiveSession.status)}`} />
                                Active Charging Session
                                <Badge className={getStatusColor(liveActiveSession.status)}>
                                    {liveActiveSession.status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <div className="text-sm text-gray-600">Service</div>
                                    <div className="font-medium">{liveActiveSession.service_name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Charge Point</div>
                                    <div className="font-medium">{liveActiveSession.charge_point_name}</div>
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
                                        Rate: {safeNumber(liveActiveSession.rate_per_kwh)} ALL/kWh
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg">
                                    <div className="text-sm text-gray-600">Session Started</div>
                                    <div className="font-medium">
                                        {new Date(liveActiveSession.started_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Session Controls */}
                            <div className="flex gap-3">
                                {liveActiveSession.status === 'Active' && (
                                    <Button 
                                        onClick={pauseSession} 
                                        disabled={processing}
                                        variant="secondary"
                                    >
                                        <Pause className="h-4 w-4 mr-2" />
                                        Pause
                                    </Button>
                                )}
                                {liveActiveSession.status === 'Paused' && (
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
                {!liveActiveSession && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-500" />
                                Start Charging Session
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                                    {safeNumber(user.balance) < 10 ? (
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
                        {liveRecentTransactions.length === 0 ? (
                            <p className="text-gray-500">No transactions yet</p>
                        ) : (
                            <div className="space-y-3">
                                {liveRecentTransactions.map((transaction) => (
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

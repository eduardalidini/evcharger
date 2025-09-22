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
    duration_minutes?: number;
    last_activity?: string;
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

    // WebSocket listeners for real-time updates
    useEffect(() => {
        let wsConnected = false;
        let interval: NodeJS.Timeout | undefined;
        
        // Try WebSocket first for user-specific updates
        if (window.Echo && user) {
            try {
                console.log(`🔌 Attempting to connect to user.charging.${user.id} channel...`);
                const channel = window.Echo.private(`user.charging.${user.id}`);
                
                // Test connection
                channel.subscribed(() => {
                    console.log(`✅ WebSocket connected to user.charging.${user.id} channel`);
                    wsConnected = true;
                });
                
                channel.error((error: any) => {
                    console.error('❌ WebSocket connection error:', error);
                    wsConnected = false;
                });

                // Add connection status logging
                window.Echo.connector.socket.on('connect', () => {
                    console.log('🟢 Reverb WebSocket connected');
                });

                window.Echo.connector.socket.on('disconnect', () => {
                    console.log('🔴 Reverb WebSocket disconnected');
                    wsConnected = false;
                });

                window.Echo.connector.socket.on('reconnect', () => {
                    console.log('🔄 Reverb WebSocket reconnected');
                    wsConnected = true;
                });

                window.Echo.connector.socket.on('error', (error: any) => {
                    console.error('🚨 Reverb WebSocket error:', error);
                    wsConnected = false;
                });
                
                channel.listen('.session.started', (event: any) => {
                    console.log('User session started:', event);
                    router.reload({ only: ['activeSession', 'recentTransactions', 'chargePoints'] });
                });
                
                channel.listen('.session.stopped', (event: any) => {
                    console.log('User session stopped:', event);
                    router.reload({ only: ['activeSession', 'recentTransactions', 'user', 'chargePoints'] });
                });
                
                channel.listen('.session.updated', (event: any) => {
                    console.log('User session updated:', event);
                    
                    // Update local state instead of reloading the page
                    if (event.session && activeSession && event.session.id === activeSession.id) {
                        // Update the session data in real time
                        const updatedSession = {
                            ...activeSession,
                            ...event.session,
                            // Update timing in real-time
                            duration_minutes: event.session.duration_minutes || activeSession.duration_minutes,
                            energy_consumed: event.session.energy_consumed || activeSession.energy_consumed,
                            credits_used: event.session.credits_used || activeSession.credits_used,
                            last_activity: event.session.last_activity || activeSession.last_activity,
                        };
                        
                        // Trigger a minimal reload to update just the active session
                        router.reload({ only: ['activeSession'] });
                    }
                });

                // Listen for admin force stop events
                channel.listen('.session.force_stopped', (event: any) => {
                    console.log('Admin force stopped session:', event);
                    router.reload({ only: ['activeSession', 'recentTransactions', 'user', 'chargePoints'] });
                    
                    // Show notification to user
                    if (event.reason) {
                        alert(`Your charging session was stopped by admin: ${event.reason}`);
                    }
                });
                
                // Listen for global updates (admin actions)
                const globalChannel = window.Echo.private('charging.global');
                
                // Listen for service updates from admin
                globalChannel.listen('.service.updated', (event: any) => {
                    console.log('Service updated by admin:', event);
                    router.reload({ only: ['services'] });
                    
                    // Show notification for service changes
                    if (event.action === 'deactivated') {
                        alert(`Service "${event.service.name}" has been deactivated`);
                    } else if (event.action === 'activated') {
                        console.log(`Service "${event.service.name}" is now available`);
                    }
                });
                
                // Listen for charge point management from admin
                globalChannel.listen('.charge_point.managed', (event: any) => {
                    console.log('Charge point managed by admin:', event);
                    const updatedChargePoint = event.charge_point;
                    
                    setLiveChargePoints(prev => 
                        prev.map(cp => 
                            cp.id === updatedChargePoint.id 
                                ? { ...cp, status: updatedChargePoint.status }
                                : cp
                        )
                    );
                    
                    // Reload charge points from server
                    router.reload({ only: ['chargePoints'] });
                    
                    // Show notification for maintenance/disable actions
                    if (event.action === 'maintenance') {
                        alert(`Charge point "${event.charge_point.name}" is under maintenance`);
                    } else if (event.action === 'disable') {
                        alert(`Charge point "${event.charge_point.name}" has been disabled`);
                    }
                });
                
                // Listen for charge point status updates
                globalChannel.listen('.charge_point.status_updated', (event: any) => {
                    console.log('Charge point status updated:', event);
                    const updatedChargePoint = event.charge_point;
                    
                    // Update the local charge points state
                    setLiveChargePoints(prev => 
                        prev.map(cp => 
                            cp.id === updatedChargePoint.id 
                                ? { ...cp, status: updatedChargePoint.status }
                                : cp
                        )
                    );
                    
                    // Also reload charge points from server to ensure consistency
                    router.reload({ only: ['chargePoints'] });
                });
                
                console.log('WebSocket listeners registered for user charging');
            } catch (error) {
                console.warn('WebSocket failed, falling back to polling:', error);
                wsConnected = false;
            }
        }
        
        // POLLING DISABLED - WebSocket only
        // Setup polling with delayed start to allow WebSocket to connect
        // setTimeout(() => {
        //     if (!wsConnected || activeSession) {
        //         console.log('Starting polling for user panel...');
        //         interval = setInterval(() => {
        //             router.reload({ only: ['activeSession', 'user', 'recentTransactions', 'chargePoints'] });
        //         }, 8000); // Reduced from 2 seconds to 8 seconds
        //     }
        // }, 2000); // Wait 2 seconds for WebSocket to connect

        return () => {
            if (window.Echo && user) {
                window.Echo.leaveChannel(`user.charging.${user.id}`);
            }
            if (interval) {
                clearInterval(interval);
            }
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
        if (!activeSession) return;
        setProcessing(true);
        router.post(`/user/charging/session/${activeSession.id}/pause`, {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const resumeSession = () => {
        if (!activeSession) return;
        
        if (safeNumber(user.balance) < 5) {
            alert('Insufficient credits to resume session');
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

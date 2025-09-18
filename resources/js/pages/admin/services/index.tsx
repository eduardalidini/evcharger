import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as servicesIndex, show as servicesShow } from '@/routes/admin/services';
import { start as simulationStart, stop as simulationStop } from '@/routes/admin/services/simulation';
import { useState, useEffect } from 'react';
import { Play, Square, Users, Zap, Activity, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChargingService {
    id: number;
    name: string;
    description: string;
    rate_per_kwh: number | string;
    currency: string;
    is_active: boolean;
    sort_order: number;
}

interface ChargePoint {
    id: number;
    identifier: string;
    name: string;
    location: string;
    status: string;
    connector_count: number;
    max_power: number;
    is_simulation: boolean;
}

interface ActiveSession {
    id: number;
    user_name: string;
    user_id: number;
    service_name: string;
    charge_point_name: string;
    connector_id: number;
    status: string;
    started_at: string;
    duration_minutes: number;
    energy_consumed: number;
    credits_reserved: number;
    credits_used: number;
}

interface RecentTransaction {
    id: number;
    transaction_reference: string;
    user_name: string;
    service_name: string;
    charge_point_name: string;
    energy_consumed: number | string;
    total_amount: number | string;
    duration_minutes: number;
    session_started_at: string;
    created_at: string;
}

interface Stats {
    total_services: number;
    active_sessions: number;
    available_charge_points: number;
    total_charge_points: number;
}

interface ServicesIndexProps {
    services: ChargingService[];
    chargePoints: ChargePoint[];
    activeSessions: ActiveSession[];
    recentTransactions: RecentTransaction[];
    stats: Stats;
}

export default function ServicesIndex({ 
    services, 
    chargePoints, 
    activeSessions, 
    recentTransactions, 
    stats 
}: ServicesIndexProps) {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [selectedChargePointId, setSelectedChargePointId] = useState<string>('');

    const [processing, setProcessing] = useState(false);
    const [liveActiveSessions, setLiveActiveSessions] = useState<ActiveSession[]>(activeSessions);
    const [liveRecentTransactions, setLiveRecentTransactions] = useState<RecentTransaction[]>(recentTransactions);
    const [liveStats, setLiveStats] = useState(stats);
    const [liveChargePoints, setLiveChargePoints] = useState<ChargePoint[]>(() => {
        console.log('Initial chargePoints:', chargePoints);
        return chargePoints;
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Services',
            href: servicesIndex().url,
        },
    ];

    const startSimulation = () => {
        if (!selectedUserId || !selectedServiceId || !selectedChargePointId) {
            alert('Please select user, service, and charge point');
            return;
        }

        setProcessing(true);
        router.post(simulationStart().url, {
            user_id: parseInt(selectedUserId),
            charging_service_id: parseInt(selectedServiceId),
            charge_point_id: parseInt(selectedChargePointId),
            connector_id: 1,
        }, {
            onSuccess: () => {
                setSelectedUserId('');
                setSelectedServiceId('');
                setSelectedChargePointId('');
                // WebSocket events will handle real-time updates
            },
            onFinish: () => setProcessing(false),
            preserveScroll: true,
        });
    };

    // WebSocket listeners for real-time updates
    useEffect(() => {
        if (!window.Echo) {
            console.error('❌ Echo not available - WebSocket connection required');
            return;
        }

        try {
            console.log('🔗 Setting up WebSocket connection for admin charging...');
            const channel = window.Echo.private('admin.charging');
            
            // Debug channel subscription
            channel.subscribed(() => {
                console.log('✅ Successfully subscribed to admin charging channel');
            });
            
            channel.error((error: any) => {
                console.error('❌ Admin channel subscription error:', error);
            });
                
            channel.listen('.session.started', (event: any) => {
                console.log('🚀 ADMIN: Session started event received:', event);
                const session = event.session;
                    
                    // Update charge point status immediately
                    setLiveChargePoints(prev => {
                        const updated = prev.map(cp => {
                            return Number(cp.id) === Number(session?.charge_point_id)
                                ? { ...cp, status: 'Occupied' }
                                : cp;
                        });
                        console.log('🚀 ADMIN: Charge points after session started:', updated);
                        return updated;
                    });
                    
                    // Add to active sessions
                    setLiveActiveSessions(prev => [...prev, {
                        id: session.id,
                        user_name: session.user_name,
                        user_id: session.user_id,
                        service_name: session.service_name,
                        charge_point_name: session.charge_point_name,
                        connector_id: session.connector_id,
                        status: session.status,
                        started_at: session.started_at,
                        duration_minutes: 0,
                        energy_consumed: 0,
                        credits_reserved: session.credits_reserved || 0,
                        credits_used: 0
                    }]);
                    
                    // Update stats
                    setLiveStats(prev => ({
                        ...prev,
                        active_sessions: prev.active_sessions + 1,
                        available_charge_points: prev.available_charge_points - 1
                    }));
                });
                
                channel.listen('.session.stopped', (event: any) => {
                    console.log('🛑 ADMIN: Session stopped:', event);
                    const session = event.session;
                    
                    // Update charge point status immediately
                    setLiveChargePoints(prev => {
                        const updated = prev.map(cp => 
                            Number(cp.id) === Number(session?.charge_point_id)
                                ? { ...cp, status: 'Available' }
                                : cp
                        );
                        console.log('🛑 ADMIN: Charge points after session stopped:', updated);
                        return updated;
                    });
                    
                    // Remove from active sessions
                    setLiveActiveSessions(prev => prev.filter(s => s.id !== session.id));
                    
                    // Add to recent transactions if transaction data is available
                    if (event.transaction) {
                        setLiveRecentTransactions(prev => [event.transaction, ...prev.slice(0, 9)]);
                    }
                    
                    // Update stats
                    setLiveStats(prev => ({
                        ...prev,
                        active_sessions: Math.max(0, prev.active_sessions - 1),
                        available_charge_points: prev.available_charge_points + 1
                    }));
                });
                
                channel.listen('.session.updated', (event: any) => {
                    console.log('Session updated:', event);
                    const session = event.session;
                    
                    // Update the specific session in active sessions
                    setLiveActiveSessions(prev => 
                        prev.map(s => 
                            s.id === session.id 
                                ? {
                                    ...s,
                                    status: session.status,
                                    duration_minutes: session.duration_minutes || s.duration_minutes,
                                    energy_consumed: session.energy_consumed || s.energy_consumed,
                                    credits_used: session.credits_used || s.credits_used
                                }
                                : s
                        )
                    );
                });
                
                channel.listen('.charge_point.status_updated', (event: any) => {
                    console.log('🔋 ADMIN: Charge point status updated:', event);
                    const updatedChargePoint = event.charge_point;
                    console.log('🔋 ADMIN: CP ID:', updatedChargePoint?.id, 'Status:', updatedChargePoint?.status);
                    
                    // Update the local charge points state
                    setLiveChargePoints(prev => {
                        const updated = prev.map(cp => {
                            return Number(cp.id) === Number(updatedChargePoint.id)
                                ? { ...cp, status: updatedChargePoint.status }
                                : cp;
                        });
                        console.log('🔋 ADMIN: Updated charge points:', updated);
                        
                        // Update stats with the new charge points array
                        setLiveStats(prevStats => ({
                            ...prevStats,
                            available_charge_points: updated.filter(cp => cp.status === 'Available').length
                        }));
                        
                        return updated;
                    });
                });
                
            console.log('✅ WebSocket connected for admin charging');
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
        }

        return () => {
            if (window.Echo) {
                window.Echo.leaveChannel('admin.charging');
            }
        };
    }, []);

    // Update local state when props change
    useEffect(() => {
        console.log('Props changed - updating local state');
        console.log('New chargePoints from props:', chargePoints);
        setLiveActiveSessions(activeSessions);
        setLiveRecentTransactions(recentTransactions);
        setLiveStats(stats);
        setLiveChargePoints(chargePoints);
    }, [activeSessions, recentTransactions, stats, chargePoints]);

    const stopSession = (sessionId: number) => {
        router.post(simulationStop(sessionId).url);
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
            <Head title="Charging Services" />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Services</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_services}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{liveStats.active_sessions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Stations</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {liveChargePoints.filter(cp => cp.status === 'Available').length}/{liveChargePoints.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {liveRecentTransactions.reduce((sum, t) => sum + safeNumber(t.total_amount), 0).toFixed(2)} ALL
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="stations">Charge Points</TabsTrigger>
                    <TabsTrigger value="simulation">Simulation</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Active Sessions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Active Sessions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {liveActiveSessions.length === 0 ? (
                                    <p className="text-muted-foreground">No active sessions</p>
                                ) : (
                                    <div className="space-y-2">
                                        {liveActiveSessions.map((session) => (
                                            <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <div className="font-medium">{session.user_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {session.charge_point_name} • {formatDuration(session.duration_minutes)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(session.status)}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => stopSession(session.id)}
                                                        disabled={processing}
                                                    >
                                                        <Square className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {liveRecentTransactions.length === 0 ? (
                                    <p className="text-muted-foreground">No recent transactions</p>
                                ) : (
                                    <div className="space-y-2">
                                        {liveRecentTransactions.slice(0, 5).map((transaction) => (
                                            <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <div className="font-medium">{transaction.user_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {safeNumber(transaction.energy_consumed).toFixed(2)} kWh • {formatDuration(transaction.duration_minutes)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium">{safeNumber(transaction.total_amount).toFixed(2)} ALL</div>
                                                    <div className="text-sm text-muted-foreground">{transaction.transaction_reference}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Charging Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Rate</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
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
                                                {getStatusBadge(service.is_active ? 'Active' : 'Inactive')}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={servicesShow(service.id).url}>
                                                    <Button variant="outline" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Charge Points</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Connectors</TableHead>
                                        <TableHead>Max Power</TableHead>
                                        <TableHead>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {liveChargePoints.map((station) => (
                                        <TableRow key={station.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{station.name}</div>
                                                    <div className="text-sm text-muted-foreground">{station.identifier}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{station.location}</TableCell>
                                            <TableCell>{getStatusBadge(station.status)}</TableCell>
                                            <TableCell>{station.connector_count}</TableCell>
                                            <TableCell>{station.max_power} kW</TableCell>
                                            <TableCell>
                                                <Badge variant={station.is_simulation ? 'secondary' : 'default'}>
                                                    {station.is_simulation ? 'Simulation' : 'Real'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="simulation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Start Simulation Session</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium">User ID</label>
                                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select user ID" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">User ID: 1</SelectItem>
                                            <SelectItem value="2">User ID: 2</SelectItem>
                                            <SelectItem value="3">User ID: 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Service</label>
                                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select service" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.filter(s => s.is_active).map((service) => (
                                                <SelectItem key={service.id} value={service.id.toString()}>
                                                    {service.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Charge Point</label>
                                    <Select value={selectedChargePointId} onValueChange={setSelectedChargePointId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select charge point" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {liveChargePoints.filter(cp => cp.status === 'Available' && cp.is_simulation).map((chargePoint) => (
                                                <SelectItem key={chargePoint.id} value={chargePoint.id.toString()}>
                                                    {chargePoint.name} ({chargePoint.status})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button 
                                onClick={startSimulation} 
                                disabled={processing || !selectedUserId || !selectedServiceId || !selectedChargePointId}
                                className="w-full"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Start Simulation
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}

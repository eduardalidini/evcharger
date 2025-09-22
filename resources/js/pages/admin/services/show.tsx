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
import { ArrowLeft, Zap, Activity, DollarSign, Clock, Edit, Trash2 } from 'lucide-react';

interface ChargingService {
    id: number;
    name: string;
    description: string;
    rate_per_kwh: number;
    currency: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

interface Session {
    id: number;
    user_id: number;
    status: string;
    started_at: string;
    stopped_at: string;
    energy_consumed: number;
    credits_used: number;
    charge_point: {
        name: string;
        identifier: string;
    };
}

interface Transaction {
    id: number;
    transaction_reference: string;
    user_id: number;
    energy_consumed: number;
    total_amount: number;
    duration_minutes: number;
    session_started_at: string;
    charge_point: {
        name: string;
        identifier: string;
    };
}

interface Stats {
    total_sessions: number;
    active_sessions: number;
    total_energy: number;
    total_revenue: number;
}

interface ServiceShowProps {
    service: ChargingService;
    sessions: {
        data: Session[];
        total: number;
        per_page: number;
        current_page: number;
    };
    transactions: {
        data: Transaction[];
        total: number;
        per_page: number;
        current_page: number;
    };
    stats: Stats;
}

export default function ServiceShow({ service, sessions, transactions, stats }: ServiceShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Services',
            href: servicesIndex().url,
        },
        {
            title: service.name,
            href: servicesShow(service.id).url,
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            'Active': 'default',
            'Paused': 'secondary',
            'Starting': 'outline',
            'Completed': 'default',
            'Faulted': 'destructive',
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${service.name} - Charging Service`} />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Link href={servicesIndex().url}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Services
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{service.name}</h1>
                        <p className="text-muted-foreground">{service.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button asChild>
                        <Link href={`/admin/services/${service.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button 
                        variant="destructive"
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
                                router.delete(`/admin/services/${service.id}`);
                            }
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Service Details Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Rate per kWh</label>
                            <div className="text-2xl font-bold">
                                {Number(service.rate_per_kwh).toFixed(4)} {service.currency}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                    {service.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className={service.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to ${service.is_active ? 'deactivate' : 'activate'} this service?`)) {
                                            router.post(`/admin/services/${service.id}/toggle-status`);
                                        }
                                    }}
                                >
                                    {service.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
                            <div className="text-2xl font-bold">{service.sort_order}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Created</label>
                            <div className="text-sm">{formatDate(service.created_at)}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_sessions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_sessions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Energy</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_energy.toFixed(2)} kWh</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_revenue.toFixed(2)} {service.currency}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="sessions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="sessions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Charging Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Charge Point</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Started</TableHead>
                                        <TableHead>Energy</TableHead>
                                        <TableHead>Credits Used</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.data.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell>{session.user_id}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{session.charge_point.name}</div>
                                                    <div className="text-sm text-muted-foreground">{session.charge_point.identifier}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(session.status)}</TableCell>
                                            <TableCell>{formatDate(session.started_at)}</TableCell>
                                            <TableCell>{session.energy_consumed.toFixed(3)} kWh</TableCell>
                                            <TableCell>{session.credits_used.toFixed(2)} {service.currency}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {sessions.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No sessions found for this service.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Completed Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Charge Point</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Energy</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.data.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-mono text-sm">
                                                {transaction.transaction_reference}
                                            </TableCell>
                                            <TableCell>{transaction.user_id}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{transaction.charge_point.name}</div>
                                                    <div className="text-sm text-muted-foreground">{transaction.charge_point.identifier}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDuration(transaction.duration_minutes)}</TableCell>
                                            <TableCell>{transaction.energy_consumed.toFixed(3)} kWh</TableCell>
                                            <TableCell className="font-medium">
                                                {transaction.total_amount.toFixed(2)} {service.currency}
                                            </TableCell>
                                            <TableCell>{formatDate(transaction.session_started_at)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {transactions.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No transactions found for this service.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}

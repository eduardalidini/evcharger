import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as usersIndex, show as usersShow, edit as usersEdit } from '@/routes/admin/users';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, Zap, AlertCircle, Activity } from 'lucide-react';

interface User {
    id: number;
    name: string;
    surname: string;
    id_number: string;
    phone_no: string;
    email: string;
    nipt: string | null;
    balance: number;
    email_verified_at?: string | null;
    created_at?: string;
    user_type: 'individual' | 'business';
}

interface TransactionItem { id: number; kind: 'top_up'; title: string; description?: string | null; amount: number; sign: '+' | '-'; currency: string; created_at: string | null }

interface ChargingService {
    id: number;
    name: string;
    description: string;
    rate_per_kwh: number;
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
    energy_consumed: number;
    credits_used: number;
}

interface ShowUserProps {
    user: User;
    transactions?: TransactionItem[];
    creditProducts?: Array<{ id: number; name: string; credit_value: number }>;
    chargingServices?: ChargingService[];
    availableChargePoints?: ChargePoint[];
    activeSession?: ActiveSession | null;
}

export default function ShowUser({ 
    user, 
    transactions = [], 
    creditProducts = [],
    chargingServices = [],
    availableChargePoints = [],
    activeSession = null
}: ShowUserProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'services'>('overview');
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [selectedChargePointId, setSelectedChargePointId] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.users'),
            href: usersIndex().url,
        },
        {
            title: t('users.viewUser', { name: `${user.name} ${user.surname}` }),
            href: usersShow(user.id).url,
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('users.user')} • ${user.name} ${user.surname}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('users.userDetails')}</h1>
                    <div className="flex items-center gap-2">
                        <Link href={usersEdit(user.id, { query: { from: 'view', type: user.user_type } }).url}>
                            <Button variant="outline">{t('common.edit')}</Button>
                        </Link>
                        <Link href={usersIndex().url}>
                            <Button variant="outline">{t('common.back')}</Button>
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-sidebar-border/60 dark:border-sidebar-border">
                    <div className="-mb-px flex gap-6 overflow-x-auto">
                        {(
                            [
                                { key: 'overview', label: t('users.tabs.overview') },
                                { key: 'payments', label: t('users.tabs.payments') },
                                { key: 'services', label: 'Charging Services' },
                            ] as const
                        ).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap border-b-2 px-1.5 py-2 text-sm transition-colors ${
                                    activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Panels */}
                {activeTab === 'overview' && (
                    <div className="max-w-2xl">
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('users.firstName')}</div>
                                    <div className="font-medium">{user.name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('users.lastName')}</div>
                                    <div className="font-medium">{user.surname}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('users.idNumber')}</div>
                                    <div className="font-medium">{user.id_number}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('users.phone')}</div>
                                    <div className="font-medium">{user.phone_no}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('users.email')}</div>
                                    <div className="font-medium">{user.email}</div>
                                </div>
                                {user.user_type === 'business' && (
                                    <div>
                                        <div className="text-sm text-muted-foreground">NIPT</div>
                                        <div className="font-medium">{user.nipt ?? '-'}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-sm text-muted-foreground">{t('users.balance')}</div>
                                    <div className="font-medium">{Number(user.balance ?? 0).toFixed(2)} ALL</div>
                                </div>
                                {typeof user.email_verified_at !== 'undefined' && (
                                    <div>
                                        <div className="text-sm text-muted-foreground">{t('users.emailVerification')}</div>
                                        <div className="font-medium">{user.email_verified_at ? t('users.verified') : t('users.notVerified')}</div>
                                    </div>
                                )}
                                {typeof user.created_at !== 'undefined' && (
                                    <div>
                                        <div className="text-sm text-muted-foreground">{t('users.createdAt')}</div>
                                        <div className="font-medium">{user.created_at}</div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 border-t border-sidebar-border/60 dark:border-sidebar-border pt-4 space-y-4">
                                <div className="pt-2">
                                    <div className="text-sm font-semibold mb-2">{t('users.addCredits')}</div>
                                    <form method="post" action="/admin/users/products/buy" className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                        <input type="hidden" name="_token" value={(window as any).Laravel?.csrfToken || (document.querySelector('meta[name=csrf-token]') as HTMLMetaElement)?.content} />
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">{t('users.creditProduct')}</label>
                                            <select name="product_id" className="border rounded px-3 py-2">
                                                {creditProducts.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name} (+{Number(p.credit_value).toFixed(2)} cr)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">{t('users.quantity')}</label>
                                            <input name="quantity" type="number" min={1} defaultValue={1} className="border rounded px-3 py-2" />
                                        </div>
                                        <input type="hidden" name="user_id" value={user.id} />
                                        <input type="hidden" name="user_type" value={user.user_type} />
                                        <Button type="submit" variant="secondary">{t('users.buyCredits')}</Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6">
                        {transactions.length === 0 ? (
                            <div className="text-sm text-muted-foreground">{t('users.paymentsPlaceholder')}</div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={`${tx.kind}-${tx.id}`} className="flex items-center justify-between text-sm">
                                        <div className="truncate">
                                            <span className="font-medium">{tx.sign}{Number(tx.amount).toFixed(2)} ALL</span>
                                            <span className="ml-2 text-muted-foreground">Top up</span>
                                            {tx.title && <span className="ml-2 text-muted-foreground">({tx.title})</span>}
                                            {tx.description && <span className="ml-2 text-muted-foreground">• {tx.description}</span>}
                                        </div>
                                        <div className="whitespace-nowrap">{tx.created_at}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        {/* User Balance */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('users.availableCredits')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">
                                    {user.balance.toFixed(2)} ALL
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('users.creditDescription')}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Active Session */}
                        {activeSession && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-green-500" />
                                        {t('users.activeChargingSession')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">{t('charging.service')}</div>
                                            <div className="font-medium">{activeSession.service_name}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">{t('charging.chargePoint')}</div>
                                            <div className="font-medium">{activeSession.charge_point_name}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">{t('common.status')}</div>
                                            <Badge variant="default">{activeSession.status}</Badge>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">{t('users.energyConsumed')}</div>
                                            <div className="font-medium">{activeSession.energy_consumed.toFixed(3)} kWh</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">{t('users.creditsUsed')}</div>
                                            <div className="font-medium">{activeSession.credits_used.toFixed(2)} ALL</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">{t('users.started')}</div>
                                            <div className="font-medium">
                                                {new Date(activeSession.started_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Button 
                                            variant="destructive" 
                                            onClick={() => stopUserSession(activeSession.id)}
                                            disabled={processing}
                                        >
                                            <Square className="h-4 w-4 mr-2" />
                                            {t('users.stopSession')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Start New Session */}
                        {!activeSession && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-blue-500" />
                                        {t('users.startChargingSession')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {user.balance < 10 ? (
                                        <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <div className="font-medium text-yellow-800">{t('users.insufficientCredits')}</div>
                                                <div className="text-sm text-yellow-600">
                                                    {t('users.insufficientCreditsDesc')}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">{t('charging.service')}</label>
                                                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('users.selectChargingService')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {chargingServices.filter(s => s.is_active).map((service) => (
                                                                <SelectItem key={service.id} value={service.id.toString()}>
                                                                    {service.name} ({service.rate_per_kwh.toFixed(2)} {service.currency}/kWh)
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">{t('charging.chargePoint')}</label>
                                                    <Select value={selectedChargePointId} onValueChange={setSelectedChargePointId}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('users.selectChargePoint')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableChargePoints.filter(cp => cp.status === 'Available').map((chargePoint) => (
                                                                <SelectItem key={chargePoint.id} value={chargePoint.id.toString()}>
                                                                    {chargePoint.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={startUserSession} 
                                                disabled={processing || !selectedServiceId || !selectedChargePointId}
                                                className="w-full"
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                {t('users.startChargingSession')}
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Available Services */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('users.availableServices')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {chargingServices.map((service) => (
                                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{service.name}</div>
                                                <div className="text-sm text-muted-foreground">{service.description}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{service.rate_per_kwh.toFixed(2)} {service.currency}/kWh</div>
                                                <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                                    {service.is_active ? 'Available' : 'Unavailable'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AdminLayout>
    );

    function startUserSession() {
        if (!selectedServiceId || !selectedChargePointId) {
            alert(t('charging.selectBothRequired'));
            return;
        }

        setProcessing(true);
        router.post('/admin/services/simulation/start', {
            user_id: user.id,
            charging_service_id: parseInt(selectedServiceId),
            charge_point_id: parseInt(selectedChargePointId),
            connector_id: 1,
        }, {
            onSuccess: () => {
                setSelectedServiceId('');
                setSelectedChargePointId('');
            },
            onFinish: () => setProcessing(false),
            preserveScroll: true,
        });
    }

    function stopUserSession(sessionId: number) {
        setProcessing(true);
        router.post(`/admin/services/simulation/${sessionId}/stop`, {}, {
            onFinish: () => setProcessing(false),
            preserveScroll: true,
        });
    }
}






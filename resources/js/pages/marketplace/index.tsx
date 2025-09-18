import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

type Product = {
    id: number;
    name: string;
    description?: string | null;
    sku: string;
    price: number;
    currency: string;
    credit_value: number;
    image_url?: string | null;
};

type ActiveSession = null;

interface PageProps {
    products: Product[];
    balance: number;
}

export default function MarketplaceIndex({ products, balance }: PageProps) {

    const buyProduct = (id: number) => {
        router.post(`/marketplace/product/${id}/buy`);
    };

    const formatSeconds = (total: number) => {
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <AppLayout>
            <Head title="Marketplace" />
            <SettingsLayout>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Marketplace</h2>
                        <div className="text-sm">Balance: <span className="font-semibold">{Number(balance).toFixed(2)} cr</span> <Link className="ml-3 text-primary underline" href="/receipts">Receipts</Link></div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Credit Products</h3>
                            <div className="grid gap-3">
                                {products.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-sm text-muted-foreground">{Number(p.credit_value).toFixed(2)} cr · {Number(p.price).toFixed(2)} {p.currency}</div>
                                        </div>
                                        <Button variant="secondary" onClick={() => buyProduct(p.id)}>Buy</Button>
                                    </div>
                                ))}
                                {products.length === 0 && <div className="text-sm text-muted-foreground">No products available.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}



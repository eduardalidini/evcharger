import { Head, Link } from '@inertiajs/react';
import { index as productsIndex, edit as productsEdit } from '@/routes/admin/products';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Package, DollarSign, Settings, Truck, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dashboard } from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';

interface Currency {
    id: number;
    currency_code: string;
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    sku: string;
    type: 'credit';
    price: number;
    currency: Currency | null;
    credit_value: number | null;
    credit_to_currency_rate: number;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    track_quantity: boolean;
    quantity: number | null;
    min_quantity: number | null;
    max_per_user: number | null;
    max_per_transaction: number | null;
    image_url: string | null;
    metadata: any;
    created_at: string;
    updated_at: string;
}

interface ProductShowProps {
    product: Product;
}

export default function ProductShow({ product }: ProductShowProps) {
    const { t } = useTranslation();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('admin.navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('admin.navigation.products'),
            href: productsIndex().url,
        },
        {
            title: product.name,
            href: `/admin/products/${product.id}`,
        },
    ];

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'credit':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'credit':
                return <DollarSign className="h-4 w-4" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const getTypeExplanation = (type: string) => {
        switch (type) {
            case 'credit':
                return 'This product adds credits to the user\'s account balance. Users can use these credits to pay for EV charging sessions.';
            default:
                return 'Unknown product type';
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${product.name} - ${t('products.show')}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={productsIndex().url}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('common.back')}
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                {product.name}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('products.show')} • SKU: {product.sku}
                            </p>
                        </div>
                    </div>
                    <Link href={productsEdit({ product: product.id }).url}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {t('products.labels.basicInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('products.name')}
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                    {product.name}
                                </p>
                            </div>

                            {product.description && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('products.description')}
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('products.sku')}
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono">
                                    {product.sku}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('products.type')}
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge className={`${getTypeColor(product.type)} flex items-center gap-1`}>
                                        {getTypeIcon(product.type)}
                                        {t(`products.types.${product.type}`)}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {getTypeExplanation(product.type)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Credits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                {t('products.labels.pricing')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('products.price')}
                                </label>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                    {product.price.toFixed(2)} {product.currency?.currency_code || 'ALL'}
                                </p>
                            </div>

                            {product.type === 'credit' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('products.creditValue')}
                                        </label>
                                        <p className="text-xl font-semibold text-green-600 dark:text-green-400 mt-1">
                                            {product.credit_value?.toFixed(2)} Credits
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Users will receive this amount in their account balance
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('products.creditToCurrencyRate')}
                                        </label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                            1 Credit = {product.credit_to_currency_rate.toFixed(4)} {product.currency?.currency_code || 'ALL'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Conversion rate for charging calculations
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-1">
                                            <HelpCircle className="h-4 w-4" />
                                            How Credit Products Work
                                        </h4>
                                        <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                                            When a user buys this product, they pay {product.price.toFixed(2)} {product.currency?.currency_code || 'ALL'} 
                                            and receive {product.credit_value?.toFixed(2)} credits in their account. 
                                            They can then use these credits to pay for EV charging sessions.
                                        </p>
                                    </div>
                                </>
                            )}

                            
                        </CardContent>
                    </Card>

                    {/* Product Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('products.labels.settings')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                </span>
                                <Badge
                                    variant={product.is_active ? 'default' : 'secondary'}
                                    className={
                                        product.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                    }
                                >
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Featured
                                </span>
                                <Badge
                                    variant={product.is_featured ? 'default' : 'outline'}
                                    className={
                                        product.is_featured
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                            : ''
                                    }
                                >
                                    {product.is_featured ? 'Yes' : 'No'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('products.sortOrder')}
                                </span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {product.sort_order}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory & Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('products.labels.inventory')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Track Quantity
                                </span>
                                <Badge variant={product.track_quantity ? 'default' : 'outline'}>
                                    {product.track_quantity ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </div>

                            {product.track_quantity && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Current Stock
                                        </span>
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {product.quantity ?? 'Unlimited'}
                                        </span>
                                    </div>

                                    {product.min_quantity && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Minimum Stock
                                            </span>
                                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                                {product.min_quantity}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {product.max_per_user && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Max per User
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {product.max_per_user}
                                    </span>
                                </div>
                            )}

                            {product.max_per_transaction && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Max per Transaction
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {product.max_per_transaction}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    {(product.image_url || product.metadata) && (
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Additional Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {product.image_url && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Product Image
                                        </label>
                                        <div className="mt-2">
                                            <img 
                                                src={product.image_url} 
                                                alt={product.name}
                                                className="max-w-xs rounded-md border border-gray-200 dark:border-gray-700"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {product.image_url}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {product.metadata && Object.keys(product.metadata).length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Metadata
                                        </label>
                                        <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border overflow-x-auto">
                                            {JSON.stringify(product.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Timestamps */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Product History</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Created At
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                    {new Date(product.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Last Updated
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                    {new Date(product.updated_at).toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes/admin';
import { index as productsIndex, create as productsCreate, show as productsShow, edit as productsEdit, destroy as productsDestroy } from '@/routes/admin/products';
import { Edit, Eye, Plus, Search, Trash2, Package2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

interface ProductsIndexProps {
    products: Product[];
}

export default function ProductsIndex({ products }: ProductsIndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('admin.navigation.dashboard'), href: dashboard().url },
        { title: t('admin.navigation.products'), href: productsIndex().url },
    ];

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (productId: number) => {
        if (confirm(t('products.messages.confirmDelete'))) {
            router.delete(productsDestroy({ product: productId }).url);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'credit':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('products.title')} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {t('products.title')}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Manage your products, credits, and services
                        </p>
                    </div>
                    <Link href={productsCreate().url}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('products.create')}
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('products.name')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('products.sku')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('products.type')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('products.price')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('products.creditValue')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('products.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <Package2 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                                            <p className="mt-2 text-sm">No products found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {product.name}
                                                    </div>
                                                    {product.description && (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                            {product.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {product.sku}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={getTypeColor(product.type)}>
                                                    {t(`products.types.${product.type}`)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {product.price.toFixed(2)} {product.currency?.currency_code || 'ALL'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {product.credit_value ? product.credit_value.toFixed(2) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
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
                                                    {product.is_featured && (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                        >
                                                            Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={productsShow({ product: product.id }).url}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={productsEdit({ product: product.id }).url}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(product.id)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

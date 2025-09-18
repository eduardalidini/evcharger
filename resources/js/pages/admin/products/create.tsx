import { Head, Link, useForm } from '@inertiajs/react';
import { index as productsIndex, store as productsStore } from '@/routes/admin/products';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Package, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dashboard } from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
import InputError from '@/components/input-error';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Currency {
    id: number;
    currency_code: string;
}

interface ProductCreateProps {
    currencies: Currency[];
}

export default function ProductCreate({ currencies }: ProductCreateProps) {
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
            title: t('products.create'),
            href: '/admin/products/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        sku: '',
        type: 'credit' as 'credit',
        price: '',
        currency: 'ALL',
        currency_id: currencies.find(c => c.currency_code === 'ALL')?.id || '',
        credit_value: '',
        credit_to_currency_rate: '1.0000',
        is_active: true,
        is_featured: false,
        sort_order: '0',
        track_quantity: false,
        quantity: '',
        min_quantity: '',
        max_per_user: '',
        max_per_transaction: '',
        image_url: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(productsStore().url);
    };

    const handleTypeChange = (value: string) => {
        setData(prev => ({
            ...prev,
            type: value as 'credit',
        }));
    };

    const handleCurrencyChange = (value: string) => {
        const currency = currencies.find(c => c.currency_code === value);
        setData(prev => ({
            ...prev,
            currency: value,
            currency_id: currency?.id || '',
        }));
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('products.create')} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={productsIndex().url}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('common.back')}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {t('products.create')}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Create a new product for your store
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    {t('products.labels.basicInfo')}
                                </CardTitle>
                                <CardDescription>
                                    Enter the basic details for your product
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="name">{t('products.name')} *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={t('products.placeholders.name')}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <Label htmlFor="description">{t('products.description')}</Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                        placeholder={t('products.placeholders.description')}
                                        rows={3}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div>
                                    <Label htmlFor="sku" className="flex items-center gap-2">
                                        {t('products.sku')} *
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-4 w-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('products.help.sku')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input
                                        id="sku"
                                        type="text"
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                        placeholder={t('products.placeholders.sku')}
                                        required
                                    />
                                    <InputError message={errors.sku} />
                                </div>

                                <div>
                                    <Label htmlFor="type">{t('products.type')} *</Label>
                                    <Select value={data.type} onValueChange={handleTypeChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="credit">{t('products.types.credit')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing & Credits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('products.labels.pricing')}</CardTitle>
                                <CardDescription>
                                    Set pricing and credit information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="price">{t('products.price')} *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.price}
                                            onChange={(e) => setData('price', e.target.value)}
                                            placeholder={t('products.placeholders.price')}
                                            required
                                        />
                                        <InputError message={errors.price} />
                                    </div>

                                    <div>
                                        <Label htmlFor="currency">{t('products.currency')} *</Label>
                                        <Select value={data.currency} onValueChange={handleCurrencyChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencies.map((currency) => (
                                                    <SelectItem key={currency.id} value={currency.currency_code}>
                                                        {currency.currency_code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.currency} />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="credit_value" className="flex items-center gap-2">
                                        {t('products.creditValue')} *
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-4 w-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('products.help.creditValue')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input
                                        id="credit_value"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.credit_value}
                                        onChange={(e) => setData('credit_value', e.target.value)}
                                        placeholder={t('products.placeholders.creditValue')}
                                        required
                                    />
                                    <InputError message={errors.credit_value} />
                                </div>

                                <div>
                                    <Label htmlFor="credit_to_currency_rate" className="flex items-center gap-2">
                                        {t('products.creditToCurrencyRate')}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-4 w-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('products.help.creditToCurrencyRate')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input
                                        id="credit_to_currency_rate"
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        value={data.credit_to_currency_rate}
                                        onChange={(e) => setData('credit_to_currency_rate', e.target.value)}
                                        placeholder={t('products.placeholders.creditToCurrencyRate')}
                                    />
                                    <InputError message={errors.credit_to_currency_rate} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Product Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('products.labels.settings')}</CardTitle>
                                <CardDescription>
                                    Configure product behavior and visibility
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', !!checked)}
                                    />
                                    <Label htmlFor="is_active">{t('products.isActive')}</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_featured"
                                        checked={data.is_featured}
                                        onCheckedChange={(checked) => setData('is_featured', !!checked)}
                                    />
                                    <Label htmlFor="is_featured">{t('products.isFeatured')}</Label>
                                </div>

                                <div>
                                    <Label htmlFor="sort_order" className="flex items-center gap-2">
                                        {t('products.sortOrder')}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-4 w-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('products.help.sortOrder')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min="0"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', e.target.value)}
                                        placeholder={t('products.placeholders.sortOrder')}
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('products.labels.limits')}</CardTitle>
                                <CardDescription>
                                    Set purchase limits and inventory settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="track_quantity"
                                        checked={data.track_quantity}
                                        onCheckedChange={(checked) => setData('track_quantity', !!checked)}
                                    />
                                    <Label htmlFor="track_quantity" className="flex items-center gap-2">
                                        {t('products.trackQuantity')}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-4 w-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('products.help.trackQuantity')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                </div>

                                {data.track_quantity && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="quantity">{t('products.quantity')}</Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                min="0"
                                                value={data.quantity}
                                                onChange={(e) => setData('quantity', e.target.value)}
                                                placeholder={t('products.placeholders.quantity')}
                                            />
                                            <InputError message={errors.quantity} />
                                        </div>

                                        <div>
                                            <Label htmlFor="min_quantity">{t('products.minQuantity')}</Label>
                                            <Input
                                                id="min_quantity"
                                                type="number"
                                                min="0"
                                                value={data.min_quantity}
                                                onChange={(e) => setData('min_quantity', e.target.value)}
                                                placeholder={t('products.placeholders.minQuantity')}
                                            />
                                            <InputError message={errors.min_quantity} />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="max_per_user">{t('products.maxPerUser')}</Label>
                                        <Input
                                            id="max_per_user"
                                            type="number"
                                            min="1"
                                            value={data.max_per_user}
                                            onChange={(e) => setData('max_per_user', e.target.value)}
                                            placeholder={t('products.placeholders.maxPerUser')}
                                        />
                                        <InputError message={errors.max_per_user} />
                                    </div>

                                    <div>
                                        <Label htmlFor="max_per_transaction">{t('products.maxPerTransaction')}</Label>
                                        <Input
                                            id="max_per_transaction"
                                            type="number"
                                            min="1"
                                            value={data.max_per_transaction}
                                            onChange={(e) => setData('max_per_transaction', e.target.value)}
                                            placeholder={t('products.placeholders.maxPerTransaction')}
                                        />
                                        <InputError message={errors.max_per_transaction} />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="image_url">{t('products.imageUrl')}</Label>
                                    <Input
                                        id="image_url"
                                        type="url"
                                        value={data.image_url}
                                        onChange={(e) => setData('image_url', e.target.value)}
                                        placeholder={t('products.placeholders.imageUrl')}
                                    />
                                    <InputError message={errors.image_url} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link href={productsIndex().url}>
                            <Button variant="outline">{t('common.cancel')}</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('common.loading') : t('common.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

import { NavFooter } from '@/components/nav-footer';
import { AdminNavUser } from '@/components/admin/admin-nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes/admin';
import { index as usersIndex } from '@/routes/admin/users';
import { index as receiptsIndex } from '@/routes/admin/receipts';
import { index as businessIndex } from '@/routes/admin/business';
import { index as currenciesIndex } from '@/routes/admin/currencies';
import { index as productsIndex } from '@/routes/admin/products';
import { index as servicesIndex } from '@/routes/admin/services';
import { index as sessionsIndex } from '@/routes/admin/sessions';
import { index as chargePointsIndex } from '@/routes/admin/charge-points';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Receipt, Building2, IndianRupee, Package, Settings, Wrench, Zap, Activity } from 'lucide-react';
import AppLogo from '../app-logo';
import { AdminNavMain } from './admin-nav-main';
import { useTranslation } from 'react-i18next';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AdminSidebar() {
    const { t } = useTranslation();

    const mainNavItems: NavItem[] = [
        {
            title: t('admin.navigation.users'),
            href: usersIndex(),
            icon: Users,
        },
        {
            title: t('admin.navigation.receipts'),
            href: receiptsIndex(),
            icon: Receipt,
        },
        {
            title: t('admin.navigation.sessionManagement'),
            href: sessionsIndex(),
            icon: Activity,
        },
        {
            title: t('admin.navigation.services'),
            href: servicesIndex(),
            icon: Zap,
        },
        {
            title: t('admin.navigation.chargePoints'),
            href: chargePointsIndex(),
            icon: Wrench,
        },
        {
            title: t('admin.navigation.products'),
            href: productsIndex(),
            icon: Package,
        },
        {
            title: t('admin.navigation.business'),
            href: businessIndex(),
            icon: Building2,
        },
        {
            title: t('admin.navigation.currencies'),
            href: currenciesIndex(),
            icon: IndianRupee,
        },
    ];
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                                <span className="ml-2 text-sm">{t('admin.navigation.adminPanel')}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <AdminNavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <AdminNavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

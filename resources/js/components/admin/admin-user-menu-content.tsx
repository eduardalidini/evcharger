import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { logout } from '@/routes/admin';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminUserMenuContentProps {
    admin: {
        id: number;
        email: string;
    } | null;
}

export function AdminUserMenuContent({ admin }: AdminUserMenuContentProps) {
    const { t } = useTranslation();
    
    const handleLogout = () => {
        router.post(logout().url);
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Admin Panel</span>
                        <span className="truncate text-xs">{admin?.email || 'admin@admin.com'}</span>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="flex cursor-pointer items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('navigation.settings')}</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('navigation.logout')}</span>
            </DropdownMenuItem>
        </>
    );
}

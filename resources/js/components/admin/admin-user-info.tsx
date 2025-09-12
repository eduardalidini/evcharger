import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface AdminUserInfoProps {
    admin: {
        id: number;
        email: string;
    } | null;
}

export function AdminUserInfo({ admin }: AdminUserInfoProps) {
    const getInitials = useInitials();

    if (!admin) {
        return (
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">AD</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Admin</span>
                    <span className="truncate text-xs">admin@admin.com</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{getInitials(admin?.email || 'Admin')}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Admin</span>
                <span className="truncate text-xs">{admin.email}</span>
            </div>
        </div>
    );
}

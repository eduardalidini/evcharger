import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface AdminNavMainProps {
    items: NavItem[];
}

export function AdminNavMain({ items }: AdminNavMainProps) {
    const { url } = usePage();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = typeof item.href === 'string' 
                        ? url === item.href || url.startsWith(item.href + '/') 
                        : url === item.href.url || url.startsWith(item.href.url + '/');
                    
                    const href = typeof item.href === 'string' ? item.href : item.href.url;
                    
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={href}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

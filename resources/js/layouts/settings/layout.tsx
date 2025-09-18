import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { appearance } from '@/routes';
import { edit as editPassword } from '@/routes/password';
import { edit } from '@/routes/profile';
import { Link as InertiaLink } from '@inertiajs/react';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { t } = useTranslation();

    const sidebarNavItems: NavItem[] = [
        {
            title: t('navigation.profile'),
            href: edit(),
            icon: null,
        },
        {
            title: t('navigation.password'),
            href: editPassword(),
            icon: null,
        },
        {
            title: t('navigation.appearance'),
            href: appearance(),
            icon: null,
        },
        {
            title: t('common.language'),
            href: '/settings/language',
            icon: null,
        },
        {
            title: 'Marketplace',
            href: '/marketplace',
            icon: null,
        },
    ];
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <Heading title={t('navigation.settings')} description={t('settings.profile.description')} />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full lg:w-48">
                    <nav className="mb-6 flex flex-row overflow-x-auto space-x-2 space-y-0 pb-2 lg:mb-0 lg:flex-col lg:space-x-0 lg:space-y-1 lg:overflow-x-visible lg:pb-0">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${typeof item.href === 'string' ? item.href : item.href.url}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('flex-shrink-0 justify-start whitespace-nowrap lg:w-full', {
                                    'bg-muted': currentPath === (typeof item.href === 'string' ? item.href : item.href.url),
                                })}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 lg:max-w-2xl">
                    <section className="w-full max-w-xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}

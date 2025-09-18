import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { router, usePage } from '@inertiajs/react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface LanguageSelectorProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    showLabel?: boolean;
}

const getLanguages = (t: any) => [
    { code: 'en', name: t('common.english'), nativeName: 'English' },
    { code: 'sq', name: t('common.albanian'), nativeName: 'Shqip' },
];

export default function LanguageSelector({ 
    variant = 'ghost', 
    size = 'default',
    showLabel = false 
}: LanguageSelectorProps) {
    const { i18n, t } = useTranslation();
    const { props } = usePage();
    const currentLocale = (props as any).locale || 'en';

    // Sync i18n with Laravel locale when it changes
    useEffect(() => {
        if (i18n.language !== currentLocale) {
            i18n.changeLanguage(currentLocale);
        }
    }, [currentLocale, i18n]);

    const languages = getLanguages(t);
    const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

    const changeLanguage = (languageCode: string) => {
        // Store in localStorage for persistence
        localStorage.setItem('language', languageCode);
        
        // Sync with Laravel backend by visiting current page with lang parameter
        // This will trigger the SetLocale middleware to update the session
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('lang', languageCode);
        
        router.visit(currentUrl.toString(), {
            preserveState: true,
            preserveScroll: true,
            only: ['locale'], // Only refresh the locale prop
        });
        
        // The useEffect in the component will handle syncing i18n when currentLocale changes
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className="gap-2">
                    <Languages className="h-4 w-4" />
                    {showLabel && <span>{t('common.language')}</span>}
                    <span className="text-sm font-medium">
                        {currentLanguage.nativeName}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {languages.map((language) => (
                    <DropdownMenuItem
                        key={language.code}
                        onClick={() => changeLanguage(language.code)}
                        className={`cursor-pointer ${
                            currentLocale === language.code 
                                ? 'bg-accent text-accent-foreground' 
                                : ''
                        }`}
                    >
                        <div className="flex flex-col">
                            <span className="font-medium">{language.nativeName}</span>
                            <span className="text-xs text-muted-foreground">
                                {language.name}
                            </span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

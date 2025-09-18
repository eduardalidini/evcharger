import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const getLanguages = (t: any) => [
    { code: 'en', name: t('common.english'), nativeName: 'English' },
    { code: 'sq', name: t('common.albanian'), nativeName: 'Shqip' },
];

export default function LanguageSettings() {
    const { t, i18n } = useTranslation();
    const { props } = usePage();
    const currentLocale = (props as any).locale || 'en';

    // We rely on i18n.language as the SINGLE source of truth for the UI
    // pendingLanguage: language selected in the dropdown but not yet confirmed
    const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    // Whenever the locale from backend changes, ensure i18n is synced
    useEffect(() => {
        if (i18n.language !== currentLocale) {
            i18n.changeLanguage(currentLocale);
        }
        // Clear any pending state because change is now authoritative
        setPendingLanguage(null);
        setIsChanging(false);
    }, [currentLocale, i18n]);

    const languages = getLanguages(t);
    const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];
    const pendingLanguageData = pendingLanguage ? languages.find((lang) => lang.code === pendingLanguage) : null;

    const handleLanguageSelect = (languageCode: string) => {
        if (languageCode !== i18n.language) {
            setPendingLanguage(languageCode);
        } else {
            setPendingLanguage(null);
        }
    };

    const confirmLanguageChange = async () => {
        if (!pendingLanguage) return;
        
        setIsChanging(true);
        
        try {
            // Store in localStorage for persistence
            localStorage.setItem('language', pendingLanguage);
            
            // Sync with Laravel backend
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('lang', pendingLanguage);
            
            await router.visit(currentUrl.toString(), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['locale'], // Only refresh the locale prop
            });
            
            // The backend response will update the locale prop => triggers useEffect above
        } catch (error) {
            console.error('Language change failed:', error);
            // Revert localStorage on error
            localStorage.setItem('language', i18n.language);
        } finally {
            setIsChanging(false);
        }
    };

    const cancelLanguageChange = () => {
        setPendingLanguage(null);
    };

    return (
        <Card key={`language-settings-${i18n.language}`}>
            <CardHeader>
                <CardTitle>{t('settings.language.title')}</CardTitle>
                <CardDescription>
                    {t('settings.language.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="language-select">{t('settings.language.select')}</Label>
                    <Select
                        value={pendingLanguage || i18n.language}
                        onValueChange={handleLanguageSelect}
                    >
                        <SelectTrigger id="language-select" className="w-full max-w-xs">
                            <SelectValue placeholder={t('settings.language.select')} />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map((language) => (
                                <SelectItem 
                                    key={language.code} 
                                    value={language.code}
                                    className="flex flex-col items-start"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{language.nativeName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {language.name}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                        {t('settings.language.current')}: <strong>{currentLanguage.nativeName}</strong>
                    </p>
                    {pendingLanguageData && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            {t('settings.language.pending')}: <strong>{pendingLanguageData.nativeName}</strong>
                        </p>
                    )}
                </div>

                {pendingLanguage && (
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                            onClick={confirmLanguageChange}
                            disabled={isChanging}
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Check className="h-4 w-4" />
                            {isChanging ? t('common.saving') : t('common.confirm')}
                        </Button>
                        <Button
                            onClick={cancelLanguageChange}
                            disabled={isChanging}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            {t('common.cancel')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

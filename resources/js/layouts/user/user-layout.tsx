import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Home, Zap, Receipt, User, Settings, LogOut } from 'lucide-react';

interface UserLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function UserLayout({ children, title }: UserLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={title} />
            
            {/* Navigation Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and Navigation */}
                        <div className="flex items-center space-x-8">
                            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                                EVCharger
                            </Link>
                            
                            <nav className="hidden md:flex space-x-6">
                                <Link 
                                    href="/dashboard" 
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                                >
                                    <Home className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <Link 
                                    href="/user/charging" 
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                                >
                                    <Zap className="h-4 w-4" />
                                    Charging
                                </Link>
                                <Link 
                                    href="/receipts" 
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                                >
                                    <Receipt className="h-4 w-4" />
                                    Receipts
                                </Link>
                                <Link 
                                    href="/marketplace" 
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                                >
                                    <User className="h-4 w-4" />
                                    Buy Credits
                                </Link>
                            </nav>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <Link href="/settings">
                                <Button variant="ghost" size="sm">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </Link>
                            <form method="POST" action="/logout" className="inline">
                                <input type="hidden" name="_token" value={(window as any).Laravel?.csrfToken} />
                                <Button variant="ghost" size="sm" type="submit">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {children}
            </main>
        </div>
    );
}

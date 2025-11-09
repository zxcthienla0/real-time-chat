import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Мессенджер</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.nickname}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={logout}
                                className="hover:bg-gray-300"
                            >
                                Выйти
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>

        </div>
    );
};
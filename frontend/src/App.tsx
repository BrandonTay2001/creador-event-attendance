import { useState, useEffect } from 'react';
import { QRScanner } from './components/QRScanner';
import { AttendancePage } from './components/AttendancePage';
import { EventSelector } from './components/EventSelector';
import { AdminDashboard } from './components/AdminDashboard';
import { EventManagement } from './components/EventManagement';
import { UserManagement } from './components/UserManagement';
import { LoginPage } from './components/LoginPage';
import { AppSidebar } from './components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isAdmin, type UserRole } from './lib/roles';

type AppState = 'home' | 'attendance' | 'admin' | 'event-management' | 'user-management';

interface User {
  username: string;
  isAdmin: boolean;
  role?: UserRole | null;
}

function AppContent() {
  const { user, loading, signOut, getUserRole } = useAuth();
  const [appUser, setAppUser] = useState<User | null>(null);
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [currentEventId, setCurrentEventId] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    const handleUserAuth = async () => {
      if (user) {
        // Get user role and set up app user
        const role = await getUserRole();
        const userIsAdmin = isAdmin(role);
        
        setAppUser({
          username: user.email || 'User',
          isAdmin: userIsAdmin,
          role
        });
      } else {
        setAppUser(null);
      }
    };

    if (!loading) {
      handleUserAuth();
    }
  }, [user, loading, getUserRole]);

  const handleLogin = (userData: User) => {
    setAppUser(userData);
    setCurrentState('home');
  };

  const handleLogout = async () => {
    await signOut();
    setAppUser(null);
    setCurrentState('home');
    setCurrentEventId('');
    setQrData('');
  };

  const handleQRScanSuccess = (result: string) => {
    console.log('QR Code scanned:', result);
    setQrData(result);
    setCurrentEventId(''); // Clear eventId since we're using QR data
    setCurrentState('attendance');
  };

  const handleEventSelect = (eventId: string) => {
    console.log('Event selected:', eventId);
    setCurrentEventId(eventId);
    setQrData(''); // Clear QR data since we're using manual selection
    setCurrentState('attendance');
  };

  const handleBackToHome = () => {
    setCurrentState('home');
    setCurrentEventId('');
    setQrData('');
  };

  const handleGoToAdmin = () => {
    setCurrentState('admin');
  };

  const handleEventManagement = (eventId: string) => {
    setCurrentEventId(eventId);
    setCurrentState('event-management');
  };

  const handleBackToAdmin = () => {
    setCurrentState('admin');
    setCurrentEventId('');
  };

  const handleGoToUserManagement = () => {
    setCurrentState('user-management');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!appUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          user={appUser}
          onAdminClick={handleGoToAdmin}
          onUserManagementClick={handleGoToUserManagement}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 flex flex-col">
          <div className="flex items-center p-4 border-b">
            <SidebarTrigger />
          </div>
          
          <div className="flex-1 p-4">
            <div className="container mx-auto py-8">
              {currentState === 'home' && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h1>Event Management</h1>
                    <p className="text-muted-foreground">
                      Choose an event or scan a QR code to manage attendance
                    </p>
                  </div>
                  
                  <EventSelector onEventSelect={handleEventSelect} />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  
                  <QRScanner onScanSuccess={handleQRScanSuccess} />
                </div>
              )}

              {currentState === 'attendance' && (
                <AttendancePage 
                  eventId={currentEventId || undefined} 
                  qrData={qrData || undefined}
                  onBack={handleBackToHome}
                />
              )}

              {currentState === 'admin' && appUser.isAdmin && (
                <AdminDashboard 
                  onBack={handleBackToHome}
                  onEventClick={handleEventManagement}
                />
              )}

              {currentState === 'event-management' && appUser.isAdmin && (
                <EventManagement 
                  eventId={currentEventId}
                  onBack={handleBackToAdmin}
                />
              )}

              {currentState === 'user-management' && appUser.isAdmin && (
                <UserManagement 
                  onBack={handleBackToHome}
                />
              )}

              {/* Fallback for non-admin users trying to access admin pages */}
              {(currentState === 'admin' || currentState === 'event-management' || currentState === 'user-management') && !appUser.isAdmin && (
                <div className="text-center py-12">
                  <h2 className="text-lg mb-2">Access Denied</h2>
                  <p className="text-muted-foreground mb-4">
                    You don't have permission to access this page.
                  </p>
                  <button 
                    onClick={handleBackToHome}
                    className="text-primary hover:underline"
                  >
                    Return to Home
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import { useState } from 'react';
import { QRScanner } from './components/QRScanner';
import { AttendancePage } from './components/AttendancePage';
import { EventSelector } from './components/EventSelector';
import { AdminDashboard } from './components/AdminDashboard';
import { EventManagement } from './components/EventManagement';
import { LoginPage } from './components/LoginPage';
import { AppSidebar } from './components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';

type AppState = 'home' | 'attendance' | 'admin' | 'event-management';

interface User {
  username: string;
  isAdmin: boolean;
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [currentEventId, setCurrentEventId] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentState('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentState('home');
    setCurrentEventId('');
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

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          user={user}
          onAdminClick={handleGoToAdmin}
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

              {currentState === 'admin' && user.isAdmin && (
                <AdminDashboard 
                  onBack={handleBackToHome}
                  onEventClick={handleEventManagement}
                />
              )}

              {currentState === 'event-management' && user.isAdmin && (
                <EventManagement 
                  eventId={currentEventId}
                  onBack={handleBackToAdmin}
                />
              )}

              {/* Fallback for non-admin users trying to access admin pages */}
              {(currentState === 'admin' || currentState === 'event-management') && !user.isAdmin && (
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

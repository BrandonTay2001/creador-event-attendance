import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LogIn, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onLogin: (userData: { username: string; isAdmin: boolean }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithMicrosoft, getUserRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { user, error: authError } = await signIn(formData.email, formData.password);
      
      if (authError) {
        setError(authError.message);
        return;
      }

      if (user) {
        // Get user role from the database
        const role = await getUserRole();
        const isAdmin = role === 'admin';
        console.log(role);
        
        onLogin({
          username: user.email || 'User',
          isAdmin
        });
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { error: authError } = await signInWithMicrosoft();
      
      if (authError) {
        setError(authError.message);
      }
      // Note: OAuth redirects, so we won't handle success here
      // The auth state change will be handled by the AuthContext
    } catch (err) {
      setError('Microsoft sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (type: 'user' | 'admin') => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        username: type === 'admin' ? 'Admin User' : 'Regular User',
        isAdmin: type === 'admin'
      });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-6 h-6" />
            <CardTitle>Event Management</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Sign in to access the event management system
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !formData.email || !formData.password}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            onClick={handleMicrosoftSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            Sign in with Microsoft
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Demo Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleDemoLogin('user')}
              disabled={isLoading}
              className="w-full"
            >
              Demo User
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="w-full"
            >
              Demo Admin
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p><strong>Demo credentials:</strong></p>
            <p>Email: admin@example.com</p>
            <p>Password: Admin2025!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
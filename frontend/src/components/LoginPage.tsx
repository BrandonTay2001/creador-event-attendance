import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LogIn, Calendar, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../lib/roles';

interface LoginPageProps {
  onLogin: (userData: { username: string; isAdmin: boolean }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, signInWithMicrosoft, getUserRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match for sign-up
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up new user
        const { user, error: authError } = await signUp(formData.email, formData.password);
        
        if (authError) {
          setError(authError.message);
          return;
        }

        if (user) {
          if (user.email_confirmed_at) {
            // User is immediately confirmed (email confirmation disabled)
            const role = await getUserRole();
            const userIsAdmin = isAdmin(role);
            
            onLogin({
              username: user.email || 'User',
              isAdmin: userIsAdmin
            });
          } else {
            // Email confirmation required
            setSuccess('Account created! Please check your email to verify your account before signing in.');
            setIsSignUp(false); // Switch to sign-in mode
            setFormData(prev => ({ ...prev, confirmPassword: '' }));
          }
        }
      } else {
        // Sign in existing user
        const { user, error: authError } = await signIn(formData.email, formData.password);
        
        if (authError) {
          setError(authError.message);
          return;
        }

        if (user) {
          // Get user role from the database
          const role = await getUserRole();
          const userIsAdmin = isAdmin(role);
          console.log(role);
          
          onLogin({
            username: user.email || 'User',
            isAdmin: userIsAdmin
          });
        }
      }
    } catch (err) {
      setError(isSignUp ? 'Sign up failed. Please try again.' : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const toggleMode = () => {
    setIsSignUp(prev => !prev);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
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

  

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-6 h-6" />
            <CardTitle>Event Management</CardTitle>
          </div>
          <p className="text-muted-foreground">
            {isSignUp ? 'Create an account to access the event management system' : 'Sign in to access the event management system'}
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

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-md">
                {success}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !formData.email || !formData.password || (isSignUp && !formData.confirmPassword)}
            >
              {isSignUp ? (
                <UserPlus className="w-4 h-4 mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
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

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-primary underline disabled:opacity-50"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
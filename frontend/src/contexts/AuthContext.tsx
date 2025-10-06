import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  microsoftAccessToken: string | null
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signInWithMicrosoft: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  getUserRole: () => Promise<string | null>
  getMicrosoftAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [microsoftAccessToken, setMicrosoftAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Restore Microsoft access token from sessionStorage if available
      const storedToken = sessionStorage.getItem('microsoft_access_token')
      if (storedToken && session?.user) {
        console.log('🔄 Restoring Microsoft access token from session storage')
        console.log('Restored token preview:', storedToken.substring(0, 50) + '...')
        setMicrosoftAccessToken(storedToken)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle OAuth sign-in success and extract Microsoft access token
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in:', session.user.email)
        console.log('Session data:', {
          provider: session?.user.app_metadata?.provider,
          hasProviderToken: !!session?.provider_token,
          tokenLength: session?.provider_token?.length || 0
        })
        
        // Check if this is a Microsoft OAuth sign-in and extract the access token
        if (session?.provider_token && session?.user.app_metadata?.provider === 'azure') {
          console.log('✅ Microsoft OAuth detected, storing access token')
          console.log('Access token preview:', session.provider_token.substring(0, 50) + '...')
          setMicrosoftAccessToken(session.provider_token)
          
          // Store in sessionStorage for persistence across page reloads
          sessionStorage.setItem('microsoft_access_token', session.provider_token)
          console.log('✅ Microsoft access token stored in session storage')
        } else {
          console.log('ℹ️ Not a Microsoft OAuth sign-in or no provider token')
        }
      }
      
      // Clear tokens on sign out
      if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing Microsoft access token')
        setMicrosoftAccessToken(null)
        sessionStorage.removeItem('microsoft_access_token')
        console.log('✅ Microsoft access token cleared from session storage')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { user: data?.user ?? null, error }
  }

  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'openid email profile User.Read Mail.Send'
      }
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const getUserRole = async (): Promise<string | null> => {
    if (!user) return null
    
    try {
      // Query the user_roles table to get the user's role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        console.error('Error fetching user role:', error)
        return 'staff' // Default to staff if role not found
      }
      
      return data?.role ?? 'staff'
    } catch (error) {
      console.error('Error in getUserRole:', error)
      return 'staff' // Default to staff on error
    }
  }

  const getMicrosoftAccessToken = (): string | null => {
    if (microsoftAccessToken) {
      console.log('🔑 Microsoft access token requested - available')
      console.log('Token preview:', microsoftAccessToken.substring(0, 50) + '...')
    } else {
      console.log('❌ Microsoft access token requested - not available')
    }
    return microsoftAccessToken
  }

  const value = {
    user,
    session,
    loading,
    microsoftAccessToken,
    signIn,
    signInWithMicrosoft,
    signOut,
    getUserRole,
    getMicrosoftAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
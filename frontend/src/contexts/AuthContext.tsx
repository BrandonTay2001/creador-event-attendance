import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  getUserRole: () => Promise<string | null>
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
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

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    getUserRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
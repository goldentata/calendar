import { createContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Use getSession() to retrieve the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session || null)  // Store full session instead of just user
  
      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session || null)  // Store full session instead of just user
      })
  
      return () => {
        authListener.subscription.unsubscribe()
      }
    })
  }, [])

  const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        })
        if (error) {
            console.log('Sign in error details:', error)
            throw error
        }
        console.log('Sign in successful:', data)
        setUser(data.session) // Store the full session instead of just user
    } catch (error) {
        console.error('Full sign in error:', error)
        throw error
    }
}
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) throw error
    setUser(data.user)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
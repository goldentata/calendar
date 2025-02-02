import { createContext, useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey, { auth: {
  persistSession: true,
  autoRefreshToken: true,
},
})

export const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const initRef = useRef(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
  
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
  
        const savedSession = localStorage.getItem('session');
        if (savedSession) {
            setUser(JSON.parse(savedSession));
            setShowLoginModal(false);
            return;
        }
  
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                localStorage.setItem('session', JSON.stringify(session));
                setUser(session);
                setShowLoginModal(false);
            } else {
                setShowLoginModal(true);
            }
        });
    }, []);

    useEffect(() => {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          localStorage.setItem('session', JSON.stringify(session));
          setUser(session);
          setShowLoginModal(false);
        } else {
          setUser(null);
          setShowLoginModal(true);
        }
      });
      return () => authListener.subscription.unsubscribe();
    }, []);

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      })
      if (error) throw error
      if (data.session) {
        localStorage.setItem('session', JSON.stringify(data.session))
        setUser(data.session)
      }
      return data
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }
  
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      localStorage.setItem('session', JSON.stringify(data.session))
      setUser(data.session)
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('session')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
        user, 
        signIn, 
        signOut, 
        signUp,
        showLoginModal,
        setShowLoginModal,
        showSignupModal,
        setShowSignupModal
      }}>
        {children}
      </AuthContext.Provider>
  )
}
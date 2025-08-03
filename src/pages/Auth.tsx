import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, UserPlus } from 'lucide-react'

export default function Auth() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in')

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-yellow-500 to-red-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Time Publishers</h1>
              <p className="text-sm text-gray-600">Private Limited</p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setView('sign_in')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'sign_in'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </button>
            <button
              onClick={() => setView('sign_up')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'sign_up'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </button>
          </div>
        </div>

        <SupabaseAuth
          supabaseClient={supabase}
          view={view}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#f3f4f6',
                  defaultButtonBackgroundHover: '#e5e7eb',
                  inputBackground: 'white',
                  inputBorder: '#d1d5db',
                  inputBorderHover: '#2563eb',
                  inputBorderFocus: '#2563eb',
                }
              }
            },
            className: {
              container: 'space-y-4',
              button: 'w-full px-4 py-3 rounded-lg font-medium transition-colors',
              input: 'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              label: 'block text-sm font-medium text-gray-700 mb-2',
              message: 'text-sm text-red-600 mt-1',
            }
          }}
          providers={['google', 'microsoft']}
          redirectTo={`${window.location.origin}/dashboard`}
          onlyThirdPartyProviders={false}
          magicLink={false}
          showLinks={false}
        />

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
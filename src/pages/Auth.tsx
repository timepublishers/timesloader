import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithCustomToken
} from 'firebase/auth'
import { auth, googleProvider, microsoftProvider } from '../lib/firebase'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, UserPlus, Eye, EyeOff, Mail, User, Building, Phone, Shield } from 'lucide-react'

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  company: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const verificationSchema = z.object({
  pin: z.string().length(6, 'PIN must be exactly 6 digits'),
})

type SignUpFormData = z.infer<typeof signUpSchema>
type SignInFormData = z.infer<typeof signInSchema>
type VerificationFormData = z.infer<typeof verificationSchema>

export default function Auth() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'verify_email'>('sign_in')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [registrationEmail, setRegistrationEmail] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  })

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Register user in our backend (this will send verification email)
      const response = await api.register(null, {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        company: data.company
      })
      
      setRegistrationEmail(data.email)
      setSuccess('Registration successful! Please check your email for the verification PIN.')
      setView('verify_email')
      signUpForm.reset()
    } catch (error: any) {
      console.error('Sign up error:', error)
      setError(error.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (data: VerificationFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await api.verifyEmail(registrationEmail, data.pin)
      
      if (response.customToken) {
        // Sign in with custom token
        await signInWithCustomToken(auth, response.customToken)
        setSuccess('Email verified successfully! Welcome to Time Publishers!')
        navigate('/dashboard')
      } else {
        setSuccess('Email verified successfully! You can now sign in.')
        setView('sign_in')
      }
      
      verificationForm.reset()
    } catch (error: any) {
      console.error('Verification error:', error)
      setError(error.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendPin = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      await api.resendPin(registrationEmail)
      setSuccess('New verification PIN sent to your email!')
    } catch (error: any) {
      console.error('Resend PIN error:', error)
      setError(error.message || 'Failed to resend PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (data: SignInFormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      
      // Get Firebase ID token and login to our backend
      const idToken = await userCredential.user.getIdToken()
      await api.login(idToken)
      
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      // Provide specific error messages for common Firebase errors
      if (error.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled. Please contact support.')
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError(error.message || 'An error occurred during sign in')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'microsoft') => {
    setLoading(true)
    setError(null)
    
    try {
      const authProvider = provider === 'google' ? googleProvider : microsoftProvider
      const result = await signInWithPopup(auth, authProvider)
      
      // Get Firebase ID token and login to our backend
      const idToken = await result.user.getIdToken()
      await api.login(idToken)
      
      navigate('/dashboard')
    } catch (error: any) {
      console.error('OAuth error:', error)
      
      // Provide specific error messages for common OAuth errors
      if (error.code === 'auth/operation-not-allowed') {
        setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication is not enabled. Please contact support.`)
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for authentication. Please contact support or check Firebase configuration.')
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.')
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked by your browser. Please allow pop-ups and try again.')
      } else {
        setError(error.message || `An error occurred during ${provider} sign in`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-yellow-500 to-red-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
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
          
          {view !== 'verify_email' && (
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
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {view === 'verify_email' ? (
          <div>
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
              <p className="text-gray-600">
                We've sent a 6-digit PIN to <strong>{registrationEmail}</strong>
              </p>
            </div>

            <form onSubmit={verificationForm.handleSubmit(handleVerifyEmail)} className="space-y-4">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification PIN
                </label>
                <input
                  type="text"
                  id="pin"
                  maxLength={6}
                  {...verificationForm.register('pin')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
                {verificationForm.formState.errors.pin && (
                  <p className="mt-1 text-sm text-red-600">{verificationForm.formState.errors.pin.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Didn't receive the PIN?</p>
              <button
                onClick={handleResendPin}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
              >
                Resend PIN
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setView('sign_up')
                  setError(null)
                  setSuccess(null)
                }}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                ← Back to Sign Up
              </button>
            </div>
          </div>
        ) : view === 'sign_in' ? (
          <div>
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    {...signInForm.register('email')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{signInForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    {...signInForm.register('password')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {signInForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button
                  onClick={() => handleOAuthSignIn('microsoft')}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z"/>
                    <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                    <path fill="#7fba00" d="M1 13h10v10H1z"/>
                    <path fill="#ffb900" d="M13 13h10v10H13z"/>
                  </svg>
                  <span className="ml-2">Microsoft</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="fullName"
                  {...signUpForm.register('fullName')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              {signUpForm.formState.errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{signUpForm.formState.errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  {...signUpForm.register('email')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              {signUpForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{signUpForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  id="phone"
                  {...signUpForm.register('phone')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+92-XXX-XXXXXXX"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company/Organization
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="company"
                  {...signUpForm.register('company')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your company name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  {...signUpForm.register('password')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {signUpForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{signUpForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  {...signUpForm.register('confirmPassword')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {signUpForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{signUpForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {view !== 'verify_email' && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
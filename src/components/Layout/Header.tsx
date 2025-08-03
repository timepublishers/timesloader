import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User, LogOut, Settings, MessageSquare } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Domain & Hosting', href: '/hosting' },
    { name: 'Contact', href: '/contact' },
  ]

  const isActive = (path: string) => location.pathname === path

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Time Publishers</h1>
              <p className="text-sm text-gray-600">Private Limited</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to="/chat"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      AI Assistant
                    </Link>
                    {profile?.is_admin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user ? (
                <div className="pt-2 border-t border-gray-200">
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/chat"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AI Assistant
                  </Link>
                  {profile?.is_admin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
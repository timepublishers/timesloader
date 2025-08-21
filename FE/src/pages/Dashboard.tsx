import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Globe, 
  Server, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  MessageSquare,
  FileText,
  Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { formatCurrency, formatDate, getDaysUntil } from '../lib/utils'

interface UserDomain {
  id: string
  domain_name: string
  extension: string
  price_paid: number
  registration_date: string
  expiry_date: string
  payment_due_date: string
  status: 'active' | 'expired' | 'pending'
  auto_renew: boolean
}

interface UserHosting {
  id: string
  domain_name: string
  price_paid: number
  start_date: string
  expiry_date: string
  payment_due_date: string
  status: 'active' | 'suspended' | 'expired'
  auto_renew: boolean
  hosting_packages: {
    name: string
    storage: string
    bandwidth: string
  }
}

interface UserComplaint {
  id: string
  subject: string
  category: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [hosting, setHosting] = useState<UserHosting[]>([])
  const [complaints, setComplaints] = useState<UserComplaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const [domains, hosting, complaints] = await Promise.all([
        api.getUserDomains(),
        api.getUserHosting(),
        api.getUserComplaints()
      ])

      setDomains(domains)
      setHosting(hosting)
      setComplaints(complaints.slice(0, 5)) // Show only recent 5
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'expired': return 'text-red-600 bg-red-100'
      case 'suspended': return 'text-yellow-600 bg-yellow-100'
      case 'pending': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your domains, hosting services, and account settings
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/hosting"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">New Service</h3>
                <p className="text-sm text-gray-600">Domain or Hosting</p>
              </div>
            </div>
          </Link>

          <Link
            to="/chat"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-sm text-gray-600">Get instant help</p>
              </div>
            </div>
          </Link>

          <button className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow group">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">New Complaint</h3>
                <p className="text-sm text-gray-600">Report an issue</p>
              </div>
            </div>
          </button>

          <button className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow group">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                <p className="text-sm text-gray-600">Update profile</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Domains Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Globe className="w-6 h-6 text-blue-600 mr-2" />
                My Domains ({domains.length})
              </h2>
              <Link
                to="/hosting"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Register New
              </Link>
            </div>

            {domains.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No domains registered yet</p>
                <Link
                  to="/hosting"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register Your First Domain
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div key={domain.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {domain.domain_name}{domain.extension}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(domain.status)}`}>
                        {domain.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Expires:</strong> {formatDate(domain.expiry_date)}</p>
                        <p><strong>Days left:</strong> {getDaysUntil(domain.expiry_date)}</p>
                      </div>
                      <div>
                        <p><strong>Price:</strong> {formatCurrency(domain.price_paid)}</p>
                        <p><strong>Auto-renew:</strong> {domain.auto_renew ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    {getDaysUntil(domain.expiry_date) <= 30 && (
                      <div className="mt-2 flex items-center text-orange-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        <span className="text-xs">Renewal required soon</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hosting Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Server className="w-6 h-6 text-green-600 mr-2" />
                My Hosting ({hosting.length})
              </h2>
              <Link
                to="/hosting"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add Hosting
              </Link>
            </div>

            {hosting.length === 0 ? (
              <div className="text-center py-8">
                <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No hosting services yet</p>
                <Link
                  to="/hosting"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Get Hosting
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {hosting.map((host) => (
                  <div key={host.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{host.domain_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(host.status)}`}>
                        {host.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{host.hosting_packages?.name}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Expires:</strong> {formatDate(host.expiry_date)}</p>
                        <p><strong>Storage:</strong> {host.hosting_packages?.storage}</p>
                      </div>
                      <div>
                        <p><strong>Price:</strong> {formatCurrency(host.price_paid)}</p>
                        <p><strong>Bandwidth:</strong> {host.hosting_packages?.bandwidth}</p>
                      </div>
                    </div>
                    {getDaysUntil(host.expiry_date) <= 30 && (
                      <div className="mt-2 flex items-center text-orange-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        <span className="text-xs">Renewal required soon</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Complaints */}
        {complaints.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 text-red-600 mr-2" />
              Recent Complaints
            </h2>
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{complaint.subject}</h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Category: {complaint.category}</span>
                    <span>{formatDate(complaint.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
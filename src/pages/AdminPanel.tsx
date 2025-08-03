import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Globe, 
  Server, 
  MessageSquare, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'

interface HostingPackage {
  id: string
  name: string
  description: string
  price: number
  storage: string
  bandwidth: string
  email_accounts: number
  databases: number
  features: string[]
  is_active: boolean
}

interface DomainPricing {
  id: string
  extension: string
  price: number
  is_active: boolean
}

interface ContactInquiry {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  subject: string
  message: string
  status: 'new' | 'contacted' | 'resolved'
  created_at: string
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [hostingPackages, setHostingPackages] = useState<HostingPackage[]>([])
  const [domainPricing, setDomainPricing] = useState<DomainPricing[]>([])
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [hostingResponse, domainResponse, contactResponse] = await Promise.all([
        supabase.from('hosting_packages').select('*').order('price'),
        supabase.from('domain_pricing').select('*').order('price'),
        supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false })
      ])

      if (hostingResponse.data) setHostingPackages(hostingResponse.data)
      if (domainResponse.data) setDomainPricing(domainResponse.data)
      if (contactResponse.data) setContactInquiries(contactResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Settings },
    { id: 'hosting', name: 'Hosting Packages', icon: Server },
    { id: 'domains', name: 'Domain Pricing', icon: Globe },
    { id: 'inquiries', name: 'Contact Inquiries', icon: MessageSquare },
    { id: 'users', name: 'Users', icon: Users },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage your hosting business</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                  <p className="text-2xl font-bold text-blue-600">1,234</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Domains</h3>
                  <p className="text-2xl font-bold text-green-600">856</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Hosting Services</h3>
                  <p className="text-2xl font-bold text-yellow-600">642</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">New Inquiries</h3>
                  <p className="text-2xl font-bold text-red-600">{contactInquiries.filter(i => i.status === 'new').length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hosting' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Hosting Packages</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandwidth</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hostingPackages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                          <div className="text-sm text-gray-500">{pkg.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(pkg.price)}/month
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.storage}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.bandwidth}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pkg.is_active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Domain Pricing</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Domain Extension
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extension</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {domainPricing.map((domain) => (
                    <tr key={domain.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {domain.extension}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(domain.price)}/year
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          domain.is_active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {domain.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Contact Inquiries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contactInquiries.map((inquiry) => (
                    <tr key={inquiry.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{inquiry.name}</div>
                          <div className="text-sm text-gray-500">{inquiry.email}</div>
                          {inquiry.company && (
                            <div className="text-sm text-gray-500">{inquiry.company}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{inquiry.subject}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{inquiry.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(inquiry.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inquiry.status === 'new' ? 'text-blue-600 bg-blue-100' :
                          inquiry.status === 'contacted' ? 'text-yellow-600 bg-yellow-100' :
                          'text-green-600 bg-green-100'
                        }`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
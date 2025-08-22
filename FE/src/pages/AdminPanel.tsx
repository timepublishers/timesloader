import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Server, 
  Globe, 
  FileText, 
  Plus, 
  Eye,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

interface AdminStats {
  totalUsers: number
  activeDomains: number
  activeHosting: number
  newInquiries: number
  pendingInvoices: number
}

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  company: string
  is_admin: boolean
  created_at: string
  domain_count: number
  hosting_count: number
  other_services_count: number
}

interface Service {
  id: string
  user_id: string
  user_name: string
  user_email: string
  service_type: 'domain' | 'hosting' | 'other'
  service_name: string
  domain_name?: string
  tld?: string
  package_name?: string
  period?: string
  status: string
  auto_renew?: boolean
  registration_date: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

interface Invoice {
  id: string
  user_id: string
  full_name: string
  email: string
  invoice_number: string
  total_amount: number
  status: 'pending' | 'paid' | 'overdue'
  due_date: string
  payment_proof_url?: string
  payment_message?: string
  user_marked_paid_at?: string
  admin_marked_paid_at?: string
  created_at: string
}

export default function AdminPanel() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  
  // Dashboard data
  const [stats, setStats] = useState<AdminStats | null>(null)
  
  // Users data
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<any>(null)
  
  // Services data
  const [services, setServices] = useState<Service[]>([])
  const [serviceFilters, setServiceFilters] = useState({
    user_id: '',
    service_type: '',
    sort_by: 'created_at',
    sort_order: 'DESC'
  })
  
  // Invoices data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  
  // Forms data
  const [serviceForm, setServiceForm] = useState({
    type: 'domain',
    user_id: '',
    domain_name: '',
    tld: '',
    registration_date: '',
    expiry_date: '',
    auto_renew: false,
    package_id: '',
    start_date: '',
    title: '',
    description: '',
    period: 'one_time'
  })
  
  const [invoiceForm, setInvoiceForm] = useState({
    user_id: '',
    services: [] as any[],
    total_amount: 0,
    due_date: ''
  })
  
  const [hostingPackages, setHostingPackages] = useState([])
  const [userServices, setUserServices] = useState([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'services') {
      fetchServices()
    }
  }, [activeTab, serviceFilters])

  const fetchInitialData = async () => {
    try {
      const [statsData, usersData, invoicesData, packagesData] = await Promise.all([
        api.getAdminStats(),
        api.getAllUsers(),
        api.getAllInvoices(),
        api.getAllHostingPackages()
      ])
      
      setStats(statsData)
      setUsers(usersData)
      setInvoices(invoicesData)
      setHostingPackages(packagesData)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const servicesData = await api.getAllUserServices(serviceFilters)
      setServices(servicesData)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      const details = await api.getUserDetails(userId)
      setUserDetails(details)
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const fetchUserServices = async (userId: string) => {
    try {
      const services = await api.getUserServices(userId)
      setUserServices(services)
    } catch (error) {
      console.error('Error fetching user services:', error)
    }
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let response
      if (serviceForm.type === 'domain') {
        response = await api.createDomainService({
          user_id: serviceForm.user_id,
          domain_name: serviceForm.domain_name,
          tld: serviceForm.tld,
          registration_date: serviceForm.registration_date,
          expiry_date: serviceForm.expiry_date,
          auto_renew: serviceForm.auto_renew
        })
      } else if (serviceForm.type === 'hosting') {
        response = await api.createHostingService({
          user_id: serviceForm.user_id,
          package_id: serviceForm.package_id,
          domain_name: serviceForm.domain_name,
          tld: serviceForm.tld,
          start_date: serviceForm.start_date,
          expiry_date: serviceForm.expiry_date,
          auto_renew: serviceForm.auto_renew
        })
      } else {
        response = await api.createOtherService({
          user_id: serviceForm.user_id,
          title: serviceForm.title,
          description: serviceForm.description,
          period: serviceForm.period
        })
      }
      
      alert('Service created successfully!')
      setServiceForm({
        type: 'domain',
        user_id: '',
        domain_name: '',
        tld: '',
        registration_date: '',
        expiry_date: '',
        auto_renew: false,
        package_id: '',
        start_date: '',
        title: '',
        description: '',
        period: 'one_time'
      })
      fetchServices()
    } catch (error: any) {
      console.error('Error creating service:', error)
      alert('Error creating service: ' + error.message)
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (invoiceForm.services.length === 0) {
      alert('Please select at least one service')
      return
    }
    
    try {
      await api.createInvoice(invoiceForm)
      alert('Invoice created successfully!')
      setInvoiceForm({
        user_id: '',
        services: [],
        total_amount: 0,
        due_date: ''
      })
      fetchInitialData()
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice: ' + error.message)
    }
  }

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    try {
      await api.markInvoicePaid(invoiceId)
      alert('Invoice marked as paid!')
      fetchInitialData()
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error)
      alert('Error marking invoice as paid: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'expired': return 'text-red-600 bg-red-100'
      case 'suspended': return 'text-yellow-600 bg-yellow-100'
      case 'pending': return 'text-blue-600 bg-blue-100'
      case 'paid': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Welcome back, {profile?.full_name}!</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: Users },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'services', name: 'All Services', icon: Server },
              { id: 'user-services', name: 'User Services', icon: Plus },
              { id: 'invoices', name: 'Invoices', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <Globe className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Domains</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeDomains}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <Server className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Hosting</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeHosting}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.newInquiries}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
                <div className="space-y-4">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">{invoice.full_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Users</h3>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {user.domain_count} domains • {user.hosting_count} hosting • {user.other_services_count} other
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Admin</span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            fetchUserDetails(user.id)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Details Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>
              {selectedUser && userDetails ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedUser.full_name}</h4>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    {selectedUser.phone && <p className="text-sm text-gray-600">{selectedUser.phone}</p>}
                    {selectedUser.company && <p className="text-sm text-gray-600">{selectedUser.company}</p>}
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Domains ({userDetails.domains.length})</h5>
                    {userDetails.domains.map((domain: any) => (
                      <div key={domain.id} className="text-sm text-gray-600 mb-1">
                        {domain.domain_name}{domain.tld} - {domain.status}
                      </div>
                    ))}
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Hosting ({userDetails.hosting.length})</h5>
                    {userDetails.hosting.map((host: any) => (
                      <div key={host.id} className="text-sm text-gray-600 mb-1">
                        {host.domain_name} - {host.package_name}
                      </div>
                    ))}
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Other Services ({userDetails.otherServices.length})</h5>
                    {userDetails.otherServices.map((service: any) => (
                      <div key={service.id} className="text-sm text-gray-600 mb-1">
                        {service.title} - {service.period}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Select a user to view details</p>
              )}
            </div>
          </div>
        )}

        {/* All Services Tab */}
        {activeTab === 'services' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                  <select
                    value={serviceFilters.user_id}
                    onChange={(e) => setServiceFilters({...serviceFilters, user_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Users</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                  <select
                    value={serviceFilters.service_type}
                    onChange={(e) => setServiceFilters({...serviceFilters, service_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="domain">Domain</option>
                    <option value="hosting">Hosting</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={serviceFilters.sort_by}
                    onChange={(e) => setServiceFilters({...serviceFilters, sort_by: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="updated_at">Updated Date</option>
                    <option value="user_name">User Name</option>
                    <option value="service_name">Service Name</option>
                    <option value="service_type">Service Type</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    value={serviceFilters.sort_order}
                    onChange={(e) => setServiceFilters({...serviceFilters, sort_order: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DESC">Newest First</option>
                    <option value="ASC">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Services List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Services ({services.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Service</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={`${service.service_type}-${service.id}`} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{service.user_name}</p>
                            <p className="text-sm text-gray-600">{service.user_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{service.service_name}</p>
                            {service.package_name && (
                              <p className="text-sm text-gray-600">{service.package_name}</p>
                            )}
                            {service.period && (
                              <p className="text-sm text-gray-600">Period: {service.period}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            service.service_type === 'domain' ? 'text-blue-600 bg-blue-100' :
                            service.service_type === 'hosting' ? 'text-green-600 bg-green-100' :
                            'text-purple-600 bg-purple-100'
                          }`}>
                            {service.service_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                            {service.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(service.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {service.expiry_date ? formatDate(service.expiry_date) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Services Tab */}
        {activeTab === 'user-services' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Service</h3>
            
            <form onSubmit={handleCreateService} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                  <select
                    value={serviceForm.type}
                    onChange={(e) => setServiceForm({...serviceForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="domain">Domain</option>
                    <option value="hosting">Hosting</option>
                    <option value="other">Other Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                  <select
                    value={serviceForm.user_id}
                    onChange={(e) => setServiceForm({...serviceForm, user_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Domain Fields */}
              {serviceForm.type === 'domain' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
                    <input
                      type="text"
                      value={serviceForm.domain_name}
                      onChange={(e) => setServiceForm({...serviceForm, domain_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TLD</label>
                    <select
                      value={serviceForm.tld}
                      onChange={(e) => setServiceForm({...serviceForm, tld: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select TLD</option>
                      <option value=".com">.com</option>
                      <option value=".pk">.pk</option>
                      <option value=".net">.net</option>
                      <option value=".org">.org</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date</label>
                    <input
                      type="date"
                      value={serviceForm.registration_date}
                      onChange={(e) => setServiceForm({...serviceForm, registration_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={serviceForm.expiry_date}
                      onChange={(e) => setServiceForm({...serviceForm, expiry_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_renew"
                      checked={serviceForm.auto_renew}
                      onChange={(e) => setServiceForm({...serviceForm, auto_renew: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="auto_renew" className="text-sm text-gray-700">Auto Renew</label>
                  </div>
                </div>
              )}

              {/* Hosting Fields */}
              {serviceForm.type === 'hosting' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hosting Package</label>
                    <select
                      value={serviceForm.package_id}
                      onChange={(e) => setServiceForm({...serviceForm, package_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Package</option>
                      {hostingPackages.map((pkg: any) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - {formatCurrency(pkg.price)}/month
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
                    <input
                      type="text"
                      value={serviceForm.domain_name}
                      onChange={(e) => setServiceForm({...serviceForm, domain_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TLD</label>
                    <select
                      value={serviceForm.tld}
                      onChange={(e) => setServiceForm({...serviceForm, tld: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select TLD</option>
                      <option value=".com">.com</option>
                      <option value=".pk">.pk</option>
                      <option value=".net">.net</option>
                      <option value=".org">.org</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={serviceForm.start_date}
                      onChange={(e) => setServiceForm({...serviceForm, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={serviceForm.expiry_date}
                      onChange={(e) => setServiceForm({...serviceForm, expiry_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hosting_auto_renew"
                      checked={serviceForm.auto_renew}
                      onChange={(e) => setServiceForm({...serviceForm, auto_renew: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="hosting_auto_renew" className="text-sm text-gray-700">Auto Renew</label>
                  </div>
                </div>
              )}

              {/* Other Service Fields */}
              {serviceForm.type === 'other' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Title</label>
                    <input
                      type="text"
                      value={serviceForm.title}
                      onChange={(e) => setServiceForm({...serviceForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Website Development"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                    <select
                      value={serviceForm.period}
                      onChange={(e) => setServiceForm({...serviceForm, period: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="one_time">One Time</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Detailed description of the service..."
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Service
              </button>
            </form>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-8">
            {/* Create Invoice Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Invoice</h3>
              
              <form onSubmit={handleCreateInvoice} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                    <select
                      value={invoiceForm.user_id}
                      onChange={(e) => {
                        setInvoiceForm({...invoiceForm, user_id: e.target.value, services: []})
                        if (e.target.value) {
                          fetchUserServices(e.target.value)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Services Selection */}
                {invoiceForm.user_id && userServices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Services</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4">
                      {userServices.map((service: any) => (
                        <div key={`${service.service_type}-${service.id}`} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`service-${service.service_type}-${service.id}`}
                              checked={invoiceForm.services.some(s => s.id === service.id && s.service_type === service.service_type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const newService = {
                                    ...service,
                                    description: service.service_type === 'domain' ? `${service.domain_name}${service.tld}` :
                                                service.service_type === 'hosting' ? `${service.domain_name} - ${service.package_name}` :
                                                service.title,
                                    amount: 0
                                  }
                                  setInvoiceForm({
                                    ...invoiceForm,
                                    services: [...invoiceForm.services, newService]
                                  })
                                } else {
                                  setInvoiceForm({
                                    ...invoiceForm,
                                    services: invoiceForm.services.filter(s => !(s.id === service.id && s.service_type === service.service_type))
                                  })
                                }
                              }}
                              className="mr-3"
                            />
                            <label htmlFor={`service-${service.service_type}-${service.id}`} className="text-sm">
                              <span className="font-medium">
                                {service.service_type === 'domain' ? `${service.domain_name}${service.tld}` :
                                 service.service_type === 'hosting' ? `${service.domain_name} - ${service.package_name}` :
                                 service.title}
                              </span>
                              <span className="text-gray-500 ml-2">({service.service_type})</span>
                            </label>
                          </div>
                          {invoiceForm.services.some(s => s.id === service.id && s.service_type === service.service_type) && (
                            <input
                              type="number"
                              placeholder="Amount"
                              min="0"
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              onChange={(e) => {
                                const amount = parseInt(e.target.value) || 0
                                setInvoiceForm({
                                  ...invoiceForm,
                                  services: invoiceForm.services.map(s => 
                                    s.id === service.id && s.service_type === service.service_type 
                                      ? {...s, amount} 
                                      : s
                                  )
                                })
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                  <input
                    type="number"
                    value={invoiceForm.total_amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, total_amount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Invoice
                </button>
              </form>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Invoices</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{invoice.invoice_number}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{invoice.full_name}</p>
                            <p className="text-sm text-gray-600">{invoice.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(invoice.due_date)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {invoice.user_marked_paid_at && invoice.status !== 'paid' && (
                              <button
                                onClick={() => handleMarkInvoicePaid(invoice.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                            {invoice.payment_proof_url && (
                              <a
                                href={invoice.payment_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-xs"
                              >
                                View Proof
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
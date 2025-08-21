import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Users, 
  Globe, 
  Server, 
  MessageSquare, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'
import { api } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().min(1, 'Icon is required'),
  features: z.string().min(1, 'Features are required'),
  price_starting: z.number().min(0).optional(),
  is_active: z.boolean(),
  display_order: z.number().min(0)
})

const hostingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  storage: z.string().min(1, 'Storage is required'),
  bandwidth: z.string().min(1, 'Bandwidth is required'),
  email_accounts: z.number().min(-1),
  databases: z.number().min(-1),
  features: z.string().min(1, 'Features are required'),
  is_active: z.boolean()
})

const domainSchema = z.object({
  extension: z.string().min(1, 'Extension is required'),
  price: z.number().min(0, 'Price must be positive'),
  is_active: z.boolean()
})

const domainServiceSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  domain_name: z.string().min(1, 'Domain name is required'),
  tld: z.string().min(1, 'TLD is required'),
  price_paid: z.number().min(0, 'Price must be positive'),
  registration_date: z.string().min(1, 'Registration date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  auto_renew: z.boolean()
})

const hostingServiceSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  package_id: z.string().min(1, 'Package is required'),
  domain_name: z.string().min(1, 'Domain name is required'),
  tld: z.string().min(1, 'TLD is required'),
  price_paid: z.number().min(0, 'Price must be positive'),
  start_date: z.string().min(1, 'Start date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  auto_renew: z.boolean()
})

const otherServiceSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  period: z.enum(['one_time', 'monthly', 'yearly'])
})

const invoiceSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  services: z.array(z.object({
    id: z.string(),
    service_type: z.string(),
    description: z.string(),
    amount: z.number()
  })).min(1, 'At least one service is required'),
  total_amount: z.number().min(1, 'Total amount must be positive'),
  due_date: z.string().min(1, 'Due date is required')
})

interface Service {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
  price_starting: number | null
  is_active: boolean
  display_order: number
}

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

interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  company: string | null
  is_admin: boolean
  created_at: string
}

interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  total_amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  payment_proof_url: string | null
  payment_message: string | null
  user_marked_paid_at: string | null
  admin_marked_paid_at: string | null
  created_at: string
  full_name: string
  email: string
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [services, setServices] = useState<Service[]>([])
  const [hostingPackages, setHostingPackages] = useState<HostingPackage[]>([])
  const [domainPricing, setDomainPricing] = useState<DomainPricing[]>([])
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<any>({})
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [serviceType, setServiceType] = useState<'domain' | 'hosting' | 'other'>('domain')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [userServices, setUserServices] = useState<any[]>([])
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [services, hostingPackages, domainPricing, contactInquiries, users, invoices, stats] = await Promise.all([
        api.getAllServices(),
        api.getAllHostingPackages(),
        api.getAllDomainPricing(),
        api.getContactInquiries(),
        api.getAllUsers(),
        api.getAllInvoices(),
        api.getAdminStats()
      ])

      setServices(services)
      setHostingPackages(hostingPackages)
      setDomainPricing(domainPricing)
      setContactInquiries(contactInquiries)
      setUsers(users)
      setInvoices(invoices)
      setStats(stats)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Settings },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'services', name: 'Services', icon: Settings },
    { id: 'hosting', name: 'Hosting Packages', icon: Server },
    { id: 'domains', name: 'Domain Pricing', icon: Globe },
    { id: 'user-services', name: 'User Services', icon: FileText },
    { id: 'invoices', name: 'Invoices', icon: DollarSign },
    { id: 'inquiries', name: 'Contact Inquiries', icon: MessageSquare },
  ]

  const handleSaveService = async (data: any) => {
    try {
      const serviceData = {
        ...data,
        features: data.features.split('\n').filter((f: string) => f.trim())
      }

      if (editingItem) {
        await api.updateService(editingItem.id, serviceData)
      } else {
        await api.createService(serviceData)
      }

      await fetchData()
      setEditingItem(null)
      setShowAddForm(false)
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Error saving service')
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      await api.deleteService(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Error deleting service')
    }
  }

  const handleCreateService = async (data: any) => {
    try {
      if (serviceType === 'domain') {
        await api.createDomainService(data)
      } else if (serviceType === 'hosting') {
        await api.createHostingService(data)
      } else {
        await api.createOtherService(data)
      }
      
      await fetchData()
      setShowServiceForm(false)
      setSelectedUser('')
    } catch (error) {
      console.error('Error creating service:', error)
      alert('Error creating service')
    }
  }

  const handleUserChange = async (userId: string) => {
    setSelectedUser(userId)
    if (userId) {
      try {
        const services = await api.getUserServices(userId)
        setUserServices(services)
      } catch (error) {
        console.error('Error fetching user services:', error)
      }
    } else {
      setUserServices([])
    }
    setSelectedServices([])
  }

  const handleServiceSelection = (service: any, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, service])
    } else {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id))
    }
  }

  const handleCreateInvoice = async (data: any) => {
    try {
      await api.createInvoice({
        ...data,
        services: selectedServices
      })
      
      await fetchData()
      setShowInvoiceForm(false)
      setSelectedUser('')
      setSelectedServices([])
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice')
    }
  }

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    if (!confirm('Mark this invoice as paid?')) return
    
    try {
      await api.markInvoicePaid(invoiceId)
      await fetchData()
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      alert('Error marking invoice as paid')
    }
  }

  const ServiceForm = ({ service, onSave, onCancel }: any) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(serviceSchema),
      defaultValues: service ? {
        ...service,
        features: service.features.join('\n'),
        price_starting: service.price_starting || 0
      } : {
        title: '',
        description: '',
        icon: 'Server',
        features: '',
        price_starting: 0,
        is_active: true,
        display_order: 0
      }
    })

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">
            {service ? 'Edit Service' : 'Add New Service'}
          </h3>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                {...register('title')}
                className="w-full border rounded-lg px-3 py-2"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full border rounded-lg px-3 py-2"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <select {...register('icon')} className="w-full border rounded-lg px-3 py-2">
                <option value="Server">Server</option>
                <option value="Globe">Globe</option>
                <option value="Code">Code</option>
                <option value="Smartphone">Smartphone</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Features (one per line)</label>
              <textarea
                {...register('features')}
                rows={5}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              />
              {errors.features && <p className="text-red-500 text-sm">{errors.features.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Starting Price (PKR)</label>
                <input
                  type="number"
                  {...register('price_starting', { valueAsNumber: true })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  {...register('display_order', { valueAsNumber: true })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('is_active')}
                className="mr-2"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const ServiceCreationForm = ({ type, onSave, onCancel }: any) => {
    const schema = type === 'domain' ? domainServiceSchema : 
                   type === 'hosting' ? hostingServiceSchema : otherServiceSchema
    
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        user_id: selectedUser,
        auto_renew: false,
        period: 'one_time'
      }
    })

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">
            Create New {type.charAt(0).toUpperCase() + type.slice(1)} Service
          </h3>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
              <select {...register('user_id')} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.user_id && <p className="text-red-500 text-sm">{errors.user_id.message}</p>}
            </div>

            {type === 'domain' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Domain Name</label>
                    <input {...register('domain_name')} className="w-full border rounded-lg px-3 py-2" placeholder="example" />
                    {errors.domain_name && <p className="text-red-500 text-sm">{errors.domain_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">TLD</label>
                    <select {...register('tld')} className="w-full border rounded-lg px-3 py-2">
                      <option value=".com">.com</option>
                      <option value=".pk">.pk</option>
                    </select>
                    {errors.tld && <p className="text-red-500 text-sm">{errors.tld.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Registration Date</label>
                    <input type="date" {...register('registration_date')} className="w-full border rounded-lg px-3 py-2" />
                    {errors.registration_date && <p className="text-red-500 text-sm">{errors.registration_date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                    <input type="date" {...register('expiry_date')} className="w-full border rounded-lg px-3 py-2" />
                    {errors.expiry_date && <p className="text-red-500 text-sm">{errors.expiry_date.message}</p>}
                  </div>
                </div>
              </>
            )}

            {type === 'hosting' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Hosting Package</label>
                  <select {...register('package_id')} className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select Package</option>
                    {hostingPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - {formatCurrency(pkg.price)}/month
                      </option>
                    ))}
                  </select>
                  {errors.package_id && <p className="text-red-500 text-sm">{errors.package_id.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Domain Name</label>
                    <input {...register('domain_name')} className="w-full border rounded-lg px-3 py-2" placeholder="example" />
                    {errors.domain_name && <p className="text-red-500 text-sm">{errors.domain_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">TLD</label>
                    <select {...register('tld')} className="w-full border rounded-lg px-3 py-2">
                      <option value=".com">.com</option>
                      <option value=".pk">.pk</option>
                    </select>
                    {errors.tld && <p className="text-red-500 text-sm">{errors.tld.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input type="date" {...register('start_date')} className="w-full border rounded-lg px-3 py-2" />
                    {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                    <input type="date" {...register('expiry_date')} className="w-full border rounded-lg px-3 py-2" />
                    {errors.expiry_date && <p className="text-red-500 text-sm">{errors.expiry_date.message}</p>}
                  </div>
                </div>
              </>
            )}

            {type === 'other' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input {...register('title')} className="w-full border rounded-lg px-3 py-2" placeholder="Service title" />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea {...register('description')} rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Service description" />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Period</label>
                  <select {...register('period')} className="w-full border rounded-lg px-3 py-2">
                    <option value="one_time">One Time</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  {errors.period && <p className="text-red-500 text-sm">{errors.period.message}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Price (PKR)</label>
              <input 
                type="number" 
                {...register(type === 'other' ? 'amount' : 'price_paid', { valueAsNumber: true })} 
                className="w-full border rounded-lg px-3 py-2" 
              />
              {(errors.price_paid || errors.amount) && (
                <p className="text-red-500 text-sm">{errors.price_paid?.message || errors.amount?.message}</p>
              )}
            </div>

            {(type === 'domain' || type === 'hosting') && (
              <div className="flex items-center">
                <input type="checkbox" {...register('auto_renew')} className="mr-2" />
                <label className="text-sm font-medium">Auto Renew</label>
              </div>
            )}

            <div className="flex space-x-4">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Create Service
              </button>
              <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const InvoiceForm = ({ onSave, onCancel }: any) => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
      resolver: zodResolver(invoiceSchema),
      defaultValues: {
        user_id: selectedUser,
        services: selectedServices,
        total_amount: selectedServices.reduce((sum, s) => sum + s.amount, 0)
      }
    })

    const totalAmount = selectedServices.reduce((sum, service) => sum + service.amount, 0)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">Create Invoice</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Select User & Services</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">User</label>
                <select 
                  value={selectedUser} 
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {userServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Available Services</label>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {userServices.map(service => (
                      <div key={service.id} className="flex items-center p-2 border rounded">
                        <input
                          type="checkbox"
                          checked={selectedServices.some(s => s.id === service.id)}
                          onChange={(e) => handleServiceSelection({
                            ...service,
                            description: service.service_type === 'domain' 
                              ? `Domain: ${service.domain_name}${service.tld}`
                              : service.service_type === 'hosting'
                              ? `Hosting: ${service.domain_name}${service.tld} (${service.package_name})`
                              : `${service.title}`,
                            amount: service.price_paid || service.amount
                          }, e.target.checked)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {service.service_type === 'domain' && `${service.domain_name}${service.tld}`}
                            {service.service_type === 'hosting' && `${service.domain_name}${service.tld} (${service.package_name})`}
                            {service.service_type === 'other' && service.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(service.price_paid || service.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3">Invoice Details</h4>
              
              <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <input type="hidden" {...register('user_id')} value={selectedUser} />
                
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="date" {...register('due_date')} className="w-full border rounded-lg px-3 py-2" />
                  {errors.due_date && <p className="text-red-500 text-sm">{errors.due_date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount (PKR)</label>
                  <input 
                    type="number" 
                    {...register('total_amount', { valueAsNumber: true })} 
                    value={totalAmount}
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                  {errors.total_amount && <p className="text-red-500 text-sm">{errors.total_amount.message}</p>}
                </div>

                {selectedServices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Selected Services</label>
                    <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {selectedServices.map(service => (
                        <div key={service.id} className="flex justify-between items-center text-sm">
                          <span>{service.description}</span>
                          <span className="font-medium">{formatCurrency(service.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between items-center font-semibold">
                        <span>Total:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button 
                    type="submit" 
                    disabled={selectedServices.length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Invoice
                  </button>
                  <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
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
                  <p className="text-2xl font-bold text-blue-600">{stats.totalUsers || 0}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.activeDomains || 0}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{stats.activeHosting || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pending Invoices</h3>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingInvoices || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Users Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{user.company || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_admin ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.domain_count || 0} Domains, {user.hosting_count || 0} Hosting, {user.other_services_count || 0} Other
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
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

        {activeTab === 'services' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Services Management</h2>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.title}</div>
                          <div className="text-sm text-gray-500">{service.description.substring(0, 100)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.price_starting ? formatCurrency(service.price_starting) : 'Contact'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.display_order}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.is_active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setEditingItem(service)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-900"
                          >
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

        {activeTab === 'user-services' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">User Services Management</h2>
                <div className="flex space-x-2">
                  <select 
                    value={serviceType} 
                    onChange={(e) => setServiceType(e.target.value as 'domain' | 'hosting' | 'other')}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="domain">Domain</option>
                    <option value="hosting">Hosting</option>
                    <option value="other">Other Service</option>
                  </select>
                  <button 
                    onClick={() => setShowServiceForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                Create new services for users. Select the service type and fill in the required details.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Invoice Management</h2>
                <button 
                  onClick={() => setShowInvoiceForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Proof</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                          <div className="text-sm text-gray-500">{formatDate(invoice.created_at)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{invoice.full_name}</div>
                          <div className="text-sm text-gray-500">{invoice.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'text-green-600 bg-green-100' :
                          invoice.status === 'overdue' ? 'text-red-600 bg-red-100' :
                          'text-yellow-600 bg-yellow-100'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.payment_proof_url ? (
                          <div>
                            <a href={invoice.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              View Proof
                            </a>
                            {invoice.payment_message && (
                              <div className="text-xs text-gray-500 mt-1">{invoice.payment_message}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No proof</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {invoice.status !== 'paid' && invoice.user_marked_paid_at && (
                          <button 
                            onClick={() => handleMarkInvoicePaid(invoice.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Mark Paid
                          </button>
                        )}
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

        {/* Forms */}
        {showAddForm && (
          <ServiceForm
            service={null}
            onSave={handleSaveService}
            onCancel={() => setShowAddForm(false)}
          />
        )}
        
        {editingItem && (
          <ServiceForm
            service={editingItem}
            onSave={handleSaveService}
            onCancel={() => setEditingItem(null)}
          />
        )}
        
        {showServiceForm && (
          <ServiceCreationForm
            type={serviceType}
            onSave={handleCreateService}
            onCancel={() => setShowServiceForm(false)}
          />
        )}
        
        {showInvoiceForm && (
          <InvoiceForm
            onSave={handleCreateInvoice}
            onCancel={() => setShowInvoiceForm(false)}
          />
        )}
      </div>
    </div>
  )
}
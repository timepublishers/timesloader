import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Server, 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  Database,
  Mail,
  Shield,
  Zap,
  Users,
  HardDrive
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'

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

export default function Hosting() {
  const [hostingPackages, setHostingPackages] = useState<HostingPackage[]>([])
  const [domainPricing, setDomainPricing] = useState<DomainPricing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [hostingResponse, domainResponse] = await Promise.all([
        supabase.from('hosting_packages').select('*').eq('is_active', true).order('price'),
        supabase.from('domain_pricing').select('*').eq('is_active', true).order('price')
      ])

      if (hostingResponse.data) setHostingPackages(hostingResponse.data)
      if (domainResponse.data) setDomainPricing(domainResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-yellow-500 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Domain & Hosting Services
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Professional web hosting and domain registration services with competitive pricing and reliable support
          </p>
        </div>
      </section>

      {/* Domain Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Domain Registration
            </h2>
            <p className="text-xl text-gray-600">
              Secure your perfect domain name with competitive pricing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {domainPricing.map((domain) => (
              <div key={domain.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border-2 border-gray-100 hover:border-blue-200">
                <div className="text-center">
                  <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{domain.extension}</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-4">
                    {formatCurrency(domain.price)}
                    <span className="text-lg text-gray-500">/year</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-gray-600">
                    <li className="flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Free DNS Management
                    </li>
                    <li className="flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Domain Forwarding
                    </li>
                    <li className="flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      24/7 Support
                    </li>
                    <li className="flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Easy Management Panel
                    </li>
                  </ul>
                  <Link
                    to="/contact"
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                  >
                    Register Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hosting Packages Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Web Hosting Packages
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect hosting solution for your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hostingPackages.map((pkg, index) => (
              <div key={pkg.id} className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 relative ${index === 1 ? 'ring-2 ring-yellow-500 scale-105' : ''}`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <Server className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 mb-4">{pkg.description}</p>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {formatCurrency(pkg.price)}
                    <span className="text-lg text-gray-500">/month</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <HardDrive className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-600">Storage</span>
                    </div>
                    <span className="font-semibold text-gray-900">{pkg.storage}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-600">Bandwidth</span>
                    </div>
                    <span className="font-semibold text-gray-900">{pkg.bandwidth}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-600">Email Accounts</span>
                    </div>
                    <span className="font-semibold text-gray-900">{pkg.email_accounts === -1 ? 'Unlimited' : pkg.email_accounts}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-600">Databases</span>
                    </div>
                    <span className="font-semibold text-gray-900">{pkg.databases === -1 ? 'Unlimited' : pkg.databases}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3">Features Included:</h4>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/contact"
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors inline-flex items-center justify-center ${
                    index === 1
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Hosting?
            </h2>
            <p className="text-xl text-gray-600">
              Premium features and reliable service for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">99.9% Uptime</h3>
              <p className="text-gray-600">Guaranteed uptime with enterprise-grade infrastructure</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SSD Storage</h3>
              <p className="text-gray-600">Lightning-fast SSD storage for optimal performance</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock technical support from experts</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Free SSL</h3>
              <p className="text-gray-600">Free SSL certificates for secure connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Online?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Start your online journey with Time Publishers' reliable hosting and domain services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
            >
              Get Free Quote
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/auth"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
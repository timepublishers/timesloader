import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Globe, 
  Server, 
  Shield, 
  Mail, 
  Code, 
  TrendingUp, 
  Database,
  Smartphone,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export default function Services() {
  const services = [
    {
      icon: Globe,
      title: 'Domain Registration',
      description: 'Secure your perfect domain name with our comprehensive domain registration services.',
      features: [
        'Wide range of domain extensions (.com, .pk, .org, .net)',
        'Competitive pricing starting from PKR 3,750',
        'Free DNS management and domain forwarding',
        'Domain privacy protection available',
        'Easy domain transfer services',
        'Bulk domain registration discounts'
      ],
      price: 'Starting from PKR 3,750/year',
      popular: false
    },
    {
      icon: Server,
      title: 'Web Hosting',
      description: 'Reliable, fast, and secure web hosting solutions for businesses of all sizes.',
      features: [
        'SSD storage for lightning-fast performance',
        '99.9% uptime guarantee',
        'Free SSL certificates included',
        'Daily automated backups',
        'cPanel control panel',
        '24/7 technical support',
        'One-click app installations',
        'Unlimited email accounts'
      ],
      price: 'Starting from PKR 2,500/month',
      popular: true
    },
    {
      icon: Mail,
      title: 'Email Solutions',
      description: 'Professional email hosting with advanced features and security.',
      features: [
        'Custom email addresses (@yourdomain.com)',
        'Advanced spam and virus protection',
        'Mobile device synchronization',
        'Large mailbox storage (up to 50GB)',
        'Webmail access from anywhere',
        'Email forwarding and auto-responders',
        'Calendar and contacts integration'
      ],
      price: 'Starting from PKR 500/month',
      popular: false
    },
    {
      icon: Shield,
      title: 'SSL Certificates',
      description: 'Secure your website and build customer trust with SSL certificates.',
      features: [
        'Domain validated (DV) certificates',
        'Organization validated (OV) certificates',
        'Extended validation (EV) certificates',
        'Wildcard SSL for subdomains',
        '256-bit encryption',
        'Browser compatibility guarantee',
        'Free installation and setup'
      ],
      price: 'Starting from PKR 1,500/year',
      popular: false
    },
    {
      icon: Code,
      title: 'Website Development',
      description: 'Custom website development tailored to your business needs.',
      features: [
        'Responsive web design',
        'Content management systems (CMS)',
        'E-commerce solutions',
        'Custom web applications',
        'SEO-friendly development',
        'Cross-browser compatibility',
        'Mobile optimization',
        'Ongoing maintenance and support'
      ],
      price: 'Starting from PKR 25,000',
      popular: false
    },
    {
      icon: TrendingUp,
      title: 'Digital Marketing',
      description: 'Comprehensive digital marketing solutions to grow your online presence.',
      features: [
        'Search engine optimization (SEO)',
        'Pay-per-click (PPC) advertising',
        'Social media marketing',
        'Content marketing strategy',
        'Email marketing campaigns',
        'Analytics and reporting',
        'Brand identity development'
      ],
      price: 'Starting from PKR 15,000/month',
      popular: false
    },
    {
      icon: Database,
      title: 'Database Solutions',
      description: 'Robust database hosting and management services.',
      features: [
        'MySQL and PostgreSQL hosting',
        'Database optimization',
        'Regular backups and recovery',
        'Performance monitoring',
        'Security hardening',
        'Remote database access',
        'Database migration services'
      ],
      price: 'Starting from PKR 3,000/month',
      popular: false
    },
    {
      icon: Smartphone,
      title: 'Mobile App Development',
      description: 'Native and cross-platform mobile app development services.',
      features: [
        'iOS and Android development',
        'Cross-platform solutions (React Native, Flutter)',
        'UI/UX design',
        'App store optimization',
        'Push notifications',
        'In-app purchases integration',
        'App maintenance and updates'
      ],
      price: 'Starting from PKR 150,000',
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Our Services
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Comprehensive digital solutions to power your business growth and online success
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 relative ${service.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {service.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                
                <div className="mb-6">
                  <div className="text-2xl font-bold text-blue-600 mb-4">{service.price}</div>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link
                  to="/contact"
                  className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                    service.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Quote
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Our Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Services?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine cutting-edge technology with exceptional customer service to deliver results that exceed expectations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">Enterprise-grade security and 99.9% uptime guarantee</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scalable Solutions</h3>
              <p className="text-gray-600">Grow your business with our flexible and scalable services</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock technical support from our expert team</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proven Track Record</h3>
              <p className="text-gray-600">15+ years of experience serving 10,000+ satisfied clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Let's discuss how our services can help you achieve your digital goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
            >
              Get Free Consultation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/hosting"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
            >
              View Hosting Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
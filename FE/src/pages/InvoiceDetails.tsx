import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

const paymentProofSchema = z.object({
  payment_message: z.string().min(1, 'Payment message is required'),
})

type PaymentProofFormData = z.infer<typeof paymentProofSchema>

export default function InvoiceDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentProofFormData>({
    resolver: zodResolver(paymentProofSchema),
  })

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails()
    }
  }, [id])

  const fetchInvoiceDetails = async () => {
    try {
      const response = await api.getInvoiceDetails(id!)
      setInvoice(response.invoice)
      setItems(response.items)
    } catch (error) {
      console.error('Error fetching invoice details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed')
        return
      }
      setSelectedFile(file)
    }
  }

  const onSubmit = async (data: PaymentProofFormData) => {
    if (!selectedFile) {
      alert('Please select a payment proof image')
      return
    }

    setSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('payment_proof', selectedFile)
      formData.append('payment_message', data.payment_message)

      await api.submitPaymentProof(id!, formData)
      
      alert('Payment proof submitted successfully!')
      await fetchInvoiceDetails()
      reset()
      setSelectedFile(null)
    } catch (error) {
      console.error('Error submitting payment proof:', error)
      alert('Failed to submit payment proof. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h2>
                <p className="text-gray-600">Created on {formatDate(invoice.created_at)}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  invoice.status === 'paid' ? 'text-green-600 bg-green-100' :
                  invoice.status === 'overdue' ? 'text-red-600 bg-red-100' :
                  'text-yellow-600 bg-yellow-100'
                }`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Due Date:</span>
                <span className="text-gray-900">{formatDate(invoice.due_date)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Invoice Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.description}</div>
                      <div className="text-sm text-gray-600 capitalize">{item.service_type} Service</div>
                    </div>
                    <div className="font-semibold text-gray-900">{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Status */}
            {invoice.user_marked_paid_at && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Payment Submitted</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  You submitted payment proof on {formatDate(invoice.user_marked_paid_at)}
                </p>
                {invoice.payment_message && (
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Message:</strong> {invoice.payment_message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Payment Proof Form */}
          {invoice.status !== 'paid' && !invoice.user_marked_paid_at && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Payment Proof</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="payment-proof"
                    />
                    <label htmlFor="payment-proof" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {selectedFile ? selectedFile.name : 'Click to upload payment proof'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="payment_message" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Message *
                  </label>
                  <textarea
                    id="payment_message"
                    rows={4}
                    {...register('payment_message')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide details about your payment (transaction ID, bank details, etc.)"
                  />
                  {errors.payment_message && (
                    <p className="mt-1 text-sm text-red-600">{errors.payment_message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit Payment Proof
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Payment Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Upload a clear image of your payment receipt or screenshot</li>
                      <li>Include transaction details in the message</li>
                      <li>Our team will verify and mark the invoice as paid</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Already Submitted */}
          {invoice.user_marked_paid_at && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Proof Submitted</h2>
              
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Proof Submitted Successfully
                </h3>
                <p className="text-gray-600 mb-4">
                  Our team will review your payment and update the invoice status.
                </p>
                
                {invoice.payment_proof_url && (
                  <div className="mb-4">
                    <a
                      href={invoice.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Submitted Proof
                    </a>
                  </div>
                )}
                
                {invoice.payment_message && (
                  <div className="bg-gray-50 p-4 rounded-lg text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Message:</p>
                    <p className="text-sm text-gray-600">{invoice.payment_message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
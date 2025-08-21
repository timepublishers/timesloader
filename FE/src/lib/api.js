import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getAuthToken() {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(idToken, userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async verifyEmail(email, pin) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: { email, pin },
    });
  }

  async resendPin(email) {
    return this.request('/auth/resend-pin', {
      method: 'POST',
      body: { email },
    });
  }

  async login(idToken) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { idToken },
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: data,
    });
  }

  // Services endpoints
  async getServices() {
    return this.request('/services');
  }

  async getAllServices() {
    return this.request('/services/all');
  }

  async createService(data) {
    return this.request('/services', {
      method: 'POST',
      body: data,
    });
  }

  async updateService(id, data) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteService(id) {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Hosting endpoints
  async getHostingPackages() {
    return this.request('/hosting/packages');
  }

  async getAllHostingPackages() {
    return this.request('/hosting/packages/all');
  }

  async createHostingPackage(data) {
    return this.request('/hosting/packages', {
      method: 'POST',
      body: data,
    });
  }

  async updateHostingPackage(id, data) {
    return this.request(`/hosting/packages/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteHostingPackage(id) {
    return this.request(`/hosting/packages/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserHosting() {
    return this.request('/hosting/user');
  }

  // Domain endpoints
  async getDomainPricing() {
    return this.request('/domains/pricing');
  }

  async getAllDomainPricing() {
    return this.request('/domains/pricing/all');
  }

  async createDomainPricing(data) {
    return this.request('/domains/pricing', {
      method: 'POST',
      body: data,
    });
  }

  async updateDomainPricing(id, data) {
    return this.request(`/domains/pricing/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteDomainPricing(id) {
    return this.request(`/domains/pricing/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserDomains() {
    return this.request('/domains/user');
  }

  // Contact endpoints
  async submitContactForm(data) {
    return this.request('/contact', {
      method: 'POST',
      body: data,
    });
  }

  async getContactInquiries() {
    return this.request('/contact');
  }

  async updateContactInquiry(id, data) {
    return this.request(`/contact/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // Complaints endpoints
  async createComplaint(data) {
    return this.request('/complaints', {
      method: 'POST',
      body: data,
    });
  }

  async getUserComplaints() {
    return this.request('/complaints/user');
  }

  async getAllComplaints() {
    return this.request('/complaints');
  }

  async updateComplaint(id, data) {
    return this.request(`/complaints/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAllUsers() {
    return this.request('/admin/users');
  }

  async getUserDetails(id) {
    return this.request(`/admin/users/${id}`);
  }

  // Services management
  async createDomainService(data) {
    return this.request('/admin/services/domain', {
      method: 'POST',
      body: data,
    });
  }

  async createHostingService(data) {
    return this.request('/admin/services/hosting', {
      method: 'POST',
      body: data,
    });
  }

  async createOtherService(data) {
    return this.request('/admin/services/other', {
      method: 'POST',
      body: data,
    });
  }

  async getUserServices(userId) {
    return this.request(`/admin/users/${userId}/services`);
  }

  // Invoice management
  async createInvoice(data) {
    return this.request('/admin/invoices', {
      method: 'POST',
      body: data,
    });
  }

  async getAllInvoices() {
    return this.request('/admin/invoices');
  }

  async markInvoicePaid(id) {
    return this.request(`/admin/invoices/${id}/mark-paid`, {
      method: 'PUT',
    });
  }

  async getUserInvoices() {
    return this.request('/invoices/user');
  }

  async getInvoiceDetails(id) {
    return this.request(`/invoices/${id}`);
  }

  async submitPaymentProof(id, formData) {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseURL}/invoices/${id}/mark-paid`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient();
export default api;
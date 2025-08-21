@@ .. @@
   async getUserDetails(id) {
     return this.request(`/admin/users/${id}`);
   }
+
+  // Services management
+  async createDomainService(data) {
+    return this.request('/admin/services/domain', {
+      method: 'POST',
+      body: data,
+    });
+  }
+
+  async createHostingService(data) {
+    return this.request('/admin/services/hosting', {
+      method: 'POST',
+      body: data,
+    });
+  }
+
+  async createOtherService(data) {
+    return this.request('/admin/services/other', {
+      method: 'POST',
+      body: data,
+    });
+  }
+
+  async getUserServices(userId) {
+    return this.request(`/admin/users/${userId}/services`);
+  }
+
+  // Invoice management
+  async createInvoice(data) {
+    return this.request('/admin/invoices', {
+      method: 'POST',
+      body: data,
+    });
+  }
+
+  async getAllInvoices() {
+    return this.request('/admin/invoices');
+  }
+
+  async markInvoicePaid(id) {
+    return this.request(`/admin/invoices/${id}/mark-paid`, {
+      method: 'PUT',
+    });
+  }
+
+  async getUserInvoices() {
+    return this.request('/invoices/user');
+  }
+
+  async getInvoiceDetails(id) {
+    return this.request(`/invoices/${id}`);
+  }
+
+  async submitPaymentProof(id, formData) {
+    return this.request(`/invoices/${id}/mark-paid`, {
+      method: 'PUT',
+      body: formData,
+      headers: {}, // Remove Content-Type to let browser set it for FormData
+    });
+  }
 }
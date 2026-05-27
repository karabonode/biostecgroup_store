import { API_BASE_URL } from '../context/AuthContext';

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  compare_at_price?: number;
  specs: Record<string, string>;
  images?: string[];
  featured_image?: string;
  stock_quantity: number;
  grade: 'A' | 'B' | 'C';
  condition_notes?: string;
  brand?: string;
  model?: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  category_name?: string;
  category_id?: number;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  specs: Record<string, string>;
  images?: string[];
  featured_image?: string;
  stock_quantity: number;
  grade?: 'A' | 'B' | 'C';
  condition_notes?: string;
  brand?: string;
  model?: string;
  rating?: number;
  is_featured?: boolean;
  category_id?: number;
}

export async function getProducts(filters?: {
  grade?: string;
  category?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  featured?: boolean;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(`${API_BASE_URL}/products/list.php?${params}`);
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch products');
  }
  
  return data.data;
}

export async function getProduct(id: string | number): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/detail.php?id=${id}`);
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch product');
  }
  
  return data.data;
}

// Order types
export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  customer_email: string;
  customer_phone: string;
  customer_name: string;
  shipping_address: any;
  tracking_number?: string;
  admin_notes?: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  product_image: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  specs_snapshot: any;
}

// Repair types
export interface RepairTicket {
  id: number;
  ticket_number: string;
  user_id: number | null;
  user_first_name?: string;
  user_last_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  device_type: 'laptop' | 'desktop' | 'tablet' | 'phone' | 'other';
  device_brand: string;
  device_model: string;
  device_serial: string;
  issue_description: string;
  issue_category: string;
  status: 'pending' | 'diagnosing' | 'waiting_parts' | 'repairing' | 'ready' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_cost?: number;
  final_cost?: number;
  technician_notes?: string;
  internal_notes?: string;
  assigned_technician_id?: number;
  created_at: string;
}

// Order API functions
export async function getOrders(token: string, filters?: {
  status?: string;
  payment_status?: string;
  search?: string;
}): Promise<Order[]> {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(`${API_BASE_URL}/orders/list.php?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch orders');
  }
  
  return data.data;
}

export async function updateOrder(orderId: number, updates: {
  status?: string;
  payment_status?: string;
  tracking_number?: string;
  admin_notes?: string;
}, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/update.php?id=${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to update order');
  }
}

// Repair API functions
export async function getRepairTickets(token: string, filters?: {
  status?: string;
  priority?: string;
  search?: string;
}): Promise<RepairTicket[]> {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(`${API_BASE_URL}/repairs/list.php?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch repair tickets');
  }
  
  return data.data;
}

export async function updateRepairTicket(ticketId: number, updates: {
  status?: string;
  priority?: string;
  estimated_cost?: number;
  final_cost?: number;
  technician_notes?: string;
  internal_notes?: string;
}, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/repairs/update.php?id=${ticketId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to update repair ticket');
  }
}

export async function createProduct(product: ProductInput, token: string): Promise<{ product_id: number; sku: string }> {
  const response = await fetch(`${API_BASE_URL}/products/create.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to create product');
  }
  
  return { product_id: data.product_id, sku: data.sku };
}

export async function updateProduct(id: number, product: Partial<ProductInput>, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products/update.php?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to update product');
  }
}

export async function uploadImage(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`${API_BASE_URL}/products/upload.php`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to upload image');
  }
  
  return data.url;
}

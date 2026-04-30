// Format price to USD format
export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '$0.00';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format date to Spanish locale
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Format date and time
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Get status label in Spanish
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'En preparación',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#F39C12',
    confirmed: '#3498DB',
    preparing: '#9B59B6',
    shipped: '#2ECC71',
    delivered: '#27AE60',
    cancelled: '#E94560',
  };
  return colors[status] || '#7F8C8D';
}

// Get status CSS class
export function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    preparing: 'status-preparing',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  };
  return classes[status] || '';
}

// Get product image from various field names
export function getProductImage(product: any): string {
  return product?.image || product?.thumbnail || product?.image_url || product?.imageUrl || '';
}

// Get all product images as array (for carousel/gallery)
export function getProductImages(product: any): string[] {
  if (!product) return [];
  const primaryImage = getProductImage(product);
  let galleryImages: string[] = [];

  // Parse the images field — could be a JSON string or already an array
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) {
          galleryImages = parsed.filter((url: any) => typeof url === 'string' && url.trim() !== '');
        }
      } catch {
        // Not valid JSON, ignore
      }
    } else if (Array.isArray(product.images)) {
      galleryImages = product.images.filter((url: any) => typeof url === 'string' && url.trim() !== '');
    }
  }

  // Ensure primary image is first if it's not already in the gallery
  if (primaryImage && !galleryImages.includes(primaryImage)) {
    return [primaryImage, ...galleryImages];
  }

  return galleryImages.length > 0 ? galleryImages : (primaryImage ? [primaryImage] : []);
}

// Get role label in Spanish
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    editor: 'Editor',
    delivery: 'Repartidor',
    customer: 'Cliente',
  };
  return labels[role] || role;
}

// Get role badge color
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    admin: '#E94560',
    editor: '#3498DB',
    delivery: '#F39C12',
    customer: '#2ECC71',
  };
  return colors[role] || '#7F8C8D';
}

// Show toast notification
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (typeof window === 'undefined') return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// Get initials from name
export function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

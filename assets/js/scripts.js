// Backend API base URL
const API_BASE_URL = 'https://your-backend-api.com/api';

// Utility functions for token management
function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

function clearAuthToken() {
  localStorage.removeItem('authToken');
}

// Fetch products from backend API
async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Render featured products on home page
async function renderFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  const products = await fetchProducts();
  const featured = products.filter(p => p.recommended);
  container.innerHTML = '';
  featured.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'bg-white rounded-lg shadow-md p-4 flex flex-col';
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="rounded mb-4" />
      <h4 class="font-semibold text-lg mb-2">${product.name}</h4>
      <p class="text-gray-600 mb-4">${product.description}</p>
      <p class="font-bold text-indigo-600 mb-4">$${product.price.toFixed(2)}</p>
      <button onclick="addToCart(${product.id})" class="mt-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition" ${product.availability !== 'available' ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Add to Cart</button>
    `;
    container.appendChild(productCard);
  });
}

// Render product list on products page
async function renderProductList(filter = 'all') {
  const container = document.getElementById('product-list');
  if (!container) return;
  const products = await fetchProducts();
  let filteredProducts = products;
  if (filter === 'available') {
    filteredProducts = products.filter(p => p.availability === 'available');
  } else if (filter === 'outofstock') {
    filteredProducts = products.filter(p => p.availability === 'outofstock');
  }
  container.innerHTML = '';
  filteredProducts.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'bg-white rounded-lg shadow-md p-4 flex flex-col';
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="rounded mb-4" />
      <h4 class="font-semibold text-lg mb-2">${product.name}</h4>
      <p class="text-gray-600 mb-2">${product.description}</p>
      <p class="font-bold text-indigo-600 mb-2">$${product.price.toFixed(2)}</p>
      <p class="mb-4 ${product.availability === 'available' ? 'text-green-600' : 'text-red-600'} font-semibold">
        ${product.availability === 'available' ? 'In Stock' : 'Out of Stock'}
      </p>
      <a href="product-detail.html?id=${product.id}" class="mb-4 text-indigo-600 hover:underline">View Details</a>
      <button onclick="addToCart(${product.id})" class="mt-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition" ${product.availability !== 'available' ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Add to Cart</button>
    `;
    container.appendChild(productCard);
  });
}

// Fetch product detail by ID
async function fetchProductById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    const product = await response.json();
    return product;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Render product detail on product-detail page
async function renderProductDetail() {
  const container = document.getElementById('product-detail');
  if (!container) return;
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  if (!productId) return;
  const product = await fetchProductById(productId);
  if (!product) {
    container.innerHTML = '<p>Product not found.</p>';
    return;
  }
  container.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="rounded mb-4 max-w-full" />
    <h2 class="text-2xl font-bold mb-4">${product.name}</h2>
    <p class="mb-4">${product.description}</p>
    <p class="text-indigo-600 font-bold mb-4">$${product.price.toFixed(2)}</p>
    <button onclick="addToCart(${product.id})" class="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition" ${product.availability !== 'available' ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>Add to Cart</button>
  `;
}

// Fetch cart from backend API
async function fetchCart() {
  try {
    const token = getAuthToken();
    if (!token) return [];
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch cart');
    const data = await response.json();
    return data.cart;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Save cart item to backend API
async function addToCart(productId) {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to add items to cart.');
      window.location.href = 'login.html';
      return;
    }
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    updateCartCount();
    alert('Product added to cart!');
  } catch (error) {
    console.error(error);
    alert('Error adding product to cart.');
  }
}

// Update cart count in header
async function updateCartCount() {
  try {
    const cart = await fetchCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('span.absolute').forEach(span => {
      span.textContent = count;
    });
  } catch (error) {
    console.error(error);
  }
}

// Render cart items on cart page
async function renderCart() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  const cart = await fetchCart();
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('cart-total').textContent = '0.00';
    return;
  }
  let total = 0;
  for (const item of cart) {
    const product = await fetchProductById(item.productId);
    if (!product) continue;
    const itemTotal = product.price * item.quantity;
    total += itemTotal;
    const cartItem = document.createElement('div');
    cartItem.className = 'flex items-center justify-between bg-white p-4 rounded shadow';
    cartItem.innerHTML = `
      <div>
        <h4 class="font-semibold">${product.name}</h4>
        <p>$${product.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</p>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="changeQuantity(${product.id}, -1)" class="bg-gray-300 px-2 rounded hover:bg-gray-400">-</button>
        <span>${item.quantity}</span>
        <button onclick="changeQuantity(${product.id}, 1)" class="bg-gray-300 px-2 rounded hover:bg-gray-400">+</button>
        <button onclick="removeFromCart(${product.id})" class="text-red-600 hover:text-red-800 ml-4"><i class="fas fa-trash"></i></button>
      </div>
    `;
    container.appendChild(cartItem);
  }
  document.getElementById('cart-total').textContent = total.toFixed(2);
}

// Change quantity of cart item
async function changeQuantity(productId, delta) {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to update cart.');
      window.location.href = 'login.html';
      return;
    }
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId, delta })
    });
    if (!response.ok) throw new Error('Failed to update cart');
    renderCart();
    updateCartCount();
  } catch (error) {
    console.error(error);
    alert('Error updating cart.');
  }
}

// Remove item from cart
async function removeFromCart(productId) {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to update cart.');
      window.location.href = 'login.html';
      return;
    }
    const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to remove from cart');
    renderCart();
    updateCartCount();
  } catch (error) {
    console.error(error);
    alert('Error removing item from cart.');
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || 'Login failed');
      return;
    }
    const data = await response.json();
    setAuthToken(data.token);
    alert('Login successful!');
    window.location.href = 'index.html';
  } catch (error) {
    console.error(error);
    alert('Error during login.');
  }
}

// Handle register form submission
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || 'Registration failed');
      return;
    }
    alert('Registration successful! Please login.');
    window.location.href = 'login.html';
  } catch (error) {
    console.error(error);
    alert('Error during registration.');
  }
}

// Fetch and render user profile
async function fetchUserProfile() {
  try {
    const token = getAuthToken();
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    const profile = await response.json();
    document.getElementById('name').value = profile.name || '';
    document.getElementById('email').value = profile.email || '';
  } catch (error) {
    console.error(error);
    alert('Error fetching profile.');
  }
}

// Handle profile form submission
async function handleProfileUpdate(event) {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  try {
    const token = getAuthToken();
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email })
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || 'Profile update failed');
      return;
    }
    alert('Profile updated successfully!');
  } catch (error) {
    console.error(error);
    alert('Error updating profile.');
  }
}

// Handle checkout form submission
async function handleCheckout(event) {
  event.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const address = document.getElementById('address').value.trim();
  const cardNumber = document.getElementById('cardNumber').value.trim();
  const expiry = document.getElementById('expiry').value.trim();
  const cvv = document.getElementById('cvv').value.trim();
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to place an order.');
      window.location.href = 'login.html';
      return;
    }
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fullName, address, cardNumber, expiry, cvv })
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || 'Order placement failed');
      return;
    }
    alert('Order placed successfully!');
    window.location.href = 'orders.html';
  } catch (error) {
    console.error(error);
    alert('Error placing order.');
  }
}

// Fetch and render orders
async function fetchOrders() {
  try {
    const token = getAuthToken();
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    return data.orders;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function renderOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;
  const orders = await fetchOrders();
  container.innerHTML = '';
  if (orders.length === 0) {
    container.innerHTML = '<p>No orders found.</p>';
    return;
  }
  orders.forEach(order => {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'bg-white p-4 rounded shadow';
    orderDiv.innerHTML = `
      <h4 class="font-semibold mb-2">Order #${order.id}</h4>
      <p>Status: ${order.status}</p>
      <p>Total: $${order.total.toFixed(2)}</p>
      <p>Date: ${new Date(order.date).toLocaleDateString()}</p>
    `;
    container.appendChild(orderDiv);
  });
}

// Initialize page based on URL and elements
function init() {
  updateCartCount();

  if (document.getElementById('featured-products')) {
    renderFeaturedProducts();
  }

  if (document.getElementById('product-list')) {
    const filterSelect = document.getElementById('filter-availability');
    renderProductList(filterSelect.value);
    filterSelect.addEventListener('change', () => {
      renderProductList(filterSelect.value);
    });
  }

  if (document.getElementById('product-detail')) {
    renderProductDetail();
  }

  if (document.getElementById('cart-items')) {
    renderCart();
  }

  if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
  }

  if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', handleRegister);
  }

  if (document.getElementById('profile-form')) {
    fetchUserProfile();
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
  }

  if (document.getElementById('checkout-form')) {
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
  }

  if (document.getElementById('orders-list')) {
    renderOrders();
  }
}

document.addEventListener('DOMContentLoaded', init);

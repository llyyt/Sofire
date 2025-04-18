class CartItem {
  constructor(pid, name, price, image, quantity = 1) {
    this.pid = pid;
    this.name = name;
    this.price = price;
    this.image = image;
    this.quantity = quantity;
  }

  get total() {
    return this.price * this.quantity;
  }
}

class ShoppingCart {
  constructor() {
    this.items = new Map();
    this.loadFromStorage();
    this.initEventListeners();
    this.updateCartUI();
  }

  loadFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
      JSON.parse(saved).forEach(item => {
        this.items.set(item.pid, new CartItem(
          item.pid,
          item.name,
          item.price,
          item.image,
          item.quantity
        ));
      });
    }
  }

  saveToStorage() {
    const data = Array.from(this.items.values()).map(item => ({
      pid: item.pid,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    }));
    localStorage.setItem('cart', JSON.stringify(data));
  }

  initEventListeners() {
    document.body.addEventListener('click', e => {
      const addButton = e.target.closest('.add-to-cart');
      if (addButton) {
        const pid = addButton.dataset.pid;
        this.addItem(pid);
      }
    });

    document.querySelector('.cart-dropdown').addEventListener('click', e => {
      const itemEl = e.target.closest('.cart-item');
      if (!itemEl) return;
      
      const pid = itemEl.dataset.pid;
      if (e.target.closest('.decrement')) this.updateQuantity(pid, -1);
      if (e.target.closest('.increment')) this.updateQuantity(pid, 1);
      if (e.target.closest('.delete-item')) this.removeItem(pid);
    });
  }

  async addItem(pid) {
    try {
      const response = await fetch(`/api/products/${pid}`, {
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      });
      
      if (!response.ok) throw new Error('商品不存在');
      const product = await response.json();

      if (this.items.has(pid)) {
        this.items.get(pid).quantity++;
      } else {
        this.items.set(pid, new CartItem(
          pid,
          product.name,
          product.price,
          product.image
        ));
      }
      
      this.updateCartUI();
      this.saveToStorage();
    } catch (err) {
      console.error('添加商品失败:', err);
      alert('操作失败，请刷新页面后重试');
    }
  }

  updateQuantity(pid, delta) {
    const item = this.items.get(pid);
    if (!item) return;
    
    item.quantity = Math.max(1, item.quantity + delta);
    this.updateCartUI();
    this.saveToStorage();
  }

  removeItem(pid) {
    this.items.delete(pid);
    this.updateCartUI();
    this.saveToStorage();
  }

  createSafeElement(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  updateCartUI() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.querySelector('.cart-total');
    const badge = document.querySelector('.cart-badge');
    const countEl = document.querySelector('.cart-count');

    container.innerHTML = '';
    let total = 0;

    this.items.forEach(item => {
      const itemEl = this.createSafeElement('div', 'cart-item d-flex p-3 border-bottom');
      itemEl.dataset.pid = item.pid;

      const imgWrapper = this.createSafeElement('div', 'flex-shrink-0');
      const img = this.createSafeElement('img', 'cart-item-img');
      img.src = `/uploads/thumbnails/${item.image}`;
      img.alt = item.name;
      img.onerror = () => img.src = '/images/placeholder.png';
      imgWrapper.appendChild(img);

      const contentWrapper = this.createSafeElement('div', 'ms-3 flex-grow-1');
      
      const nameEl = this.createSafeElement('h6', 'mb-1 fs-7 text-sm', item.name);
      
      const quantityControls = this.createSafeElement('div', 'quantity-controls d-flex align-items-center mb-2');
      const decrementBtn = this.createSafeElement('button', 'btn btn-sm btn-outline-secondary decrement');
      decrementBtn.textContent = '-';
      const input = this.createSafeElement('input', 'form-control form-control-sm mx-2 quantity-input');
      input.type = 'number';
      input.value = item.quantity;
      input.min = '1';
      const incrementBtn = this.createSafeElement('button', 'btn btn-sm btn-outline-secondary increment');
      incrementBtn.textContent = '+';
      
      quantityControls.append(decrementBtn, input, incrementBtn);
      
      const priceRow = this.createSafeElement('div', 'd-flex justify-content-between');
      const priceEl = this.createSafeElement('span', 'text-danger', `$${item.total.toFixed(2)}`);
      const deleteBtn = this.createSafeElement('button', 'btn btn-sm btn-link text-danger delete-item');
      deleteBtn.textContent = '删除';
      
      priceRow.append(priceEl, deleteBtn);
      
      contentWrapper.append(nameEl, quantityControls, priceRow);
      itemEl.append(imgWrapper, contentWrapper);
      container.appendChild(itemEl);
      
      total += item.total;
    });

    totalEl.textContent = `$${total.toFixed(2)}`;
    badge.textContent = this.items.size;
    countEl.textContent = this.items.size;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cart = new ShoppingCart();
});
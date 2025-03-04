// public/js/cart.js
export class CartManager {
    static init() {
      document.addEventListener('click', this.handleCartActions.bind(this));
    }
  
    static handleCartActions(event) {
      const target = event.target;
      
      // 打开购物车
      if (target.closest('.cart-toggle')) {
        this.toggleCart(true);
      }
  
      // 关闭购物车
      if (target.closest('.cart-close')) {
        this.toggleCart(false);
      }
  
      // 数量操作
      if (target.closest('[data-action="update-quantity"]')) {
        const button = target.closest('[data-action="update-quantity"]');
        const pid = button.dataset.pid;
        const delta = parseInt(button.dataset.delta);
        this.updateQuantity(pid, delta);
      }
  
      // 删除商品
      if (target.closest('[data-action="remove-item"]')) {
        const button = target.closest('[data-action="remove-item"]');
        const pid = button.dataset.pid;
        this.removeItem(pid);
      }
    }
  
    static toggleCart(show) {
      document.querySelector('.cart-dropdown').classList.toggle('show', show);
    }
  
    static async updateQuantity(pid, delta) {
      try {
        const response = await fetch(`/cart/${pid}?delta=${delta}`, {
          method: 'PATCH'
        });
        if (response.ok) location.reload();
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  
    static async removeItem(pid) {
      try {
        const response = await fetch(`/cart/${pid}`, {
          method: 'DELETE'
        });
        if (response.ok) location.reload();
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  }
  
  // 初始化购物车功能
  document.addEventListener('DOMContentLoaded', () => CartManager.init());
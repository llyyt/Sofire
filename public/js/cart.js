// // public/js/cart.js
// class CartUI {
//   constructor() {
//     this.dom = {
//       counter: document.querySelector('.cart-counter'),
//       dropdown: document.querySelector('.cart-dropdown'),
//       itemsContainer: document.querySelector('.cart-items'),
//       totalEl: document.querySelector('.cart-total'),
//       countEl: document.querySelector('.cart-count')
//     }
//   }

//   update(cart) {
//     // 更新数量显示
//     this.dom.counter.textContent = cart.items.size
//     this.dom.countEl.textContent = cart.items.size

//     // 清空现有内容
//     this.dom.itemsContainer.innerHTML = ''

//     // 动态生成商品项
//     cart.items.forEach(item => {
//       const itemEl = document.createElement('div')
//       itemEl.className = 'cart-item d-flex p-3 border-bottom'
//       itemEl.innerHTML = this._createItemHTML(item)
//       this.dom.itemsContainer.appendChild(itemEl)
//     })

//     // 更新总金额
//     this.dom.totalEl.textContent = `$${cart.total.toFixed(2)}`
//   }

//   _createItemHTML(item) {
//     return `
//       <div class="flex-shrink-0">
//         <img src="/uploads/thumbnails/${item.image}" 
//              class="cart-item-img" 
//              alt="${item.name}"
//              onerror="this.src='/images/placeholder.png'">
//       </div>
//       <div class="ms-3 flex-grow-1">
//         <h6 class="mb-1 fs-7 text-sm">${item.name}</h6>
//         <div class="quantity-controls d-flex align-items-center mb-2">
//           <button class="btn btn-sm btn-outline-secondary decrement">-</button>
//           <input type="number" 
//                 class="form-control form-control-sm mx-2 quantity-input" 
//                 value="${item.quantity}" 
//                 min="1">
//           <button class="btn btn-sm btn-outline-secondary increment">+</button>
//         </div>
//         <div class="d-flex justify-content-between">
//           <span class="text-danger">$${item.total.toFixed(2)}</span>
//           <button class="btn btn-sm btn-link text-danger delete">删除</button>
//         </div>
//       </div>
//     `
//   }
// }


class CartItem {
  constructor(pid, name, price, image, quantity = 1) {
    this.pid = pid
    this.name = name
    this.price = price
    this.image = image
    this.quantity = quantity
  }

  get total() {
    return this.price * this.quantity
  }
}

class ShoppingCart {
  constructor() {
    this.items = new Map()
    this.loadFromStorage()
    this.initEventListeners()
    this.updateCartUI()
  }

  // 从localStorage加载数据
  loadFromStorage() {
    const saved = localStorage.getItem('cart')
    if (saved) {
      JSON.parse(saved).forEach(item => {
        this.items.set(item.pid, new CartItem(
          item.pid,
          item.name,
          item.price,
          item.image,
          item.quantity
        ))
      })
    }
  }

  // 保存到localStorage
  saveToStorage() {
    const data = Array.from(this.items.values()).map(item => ({
      pid: item.pid,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    }))
    localStorage.setItem('cart', JSON.stringify(data))
  }

  // 事件监听初始化
  initEventListeners() {
    // 加入购物车按钮
    document.body.addEventListener('click', e => {
      if (e.target.closest('.add-to-cart')) {
        const pid = e.target.closest('.add-to-cart').dataset.pid
        this.addItem(pid)
      }
    })

    // 购物车内部操作
    document.querySelector('.cart-dropdown').addEventListener('click', e => {
      const itemEl = e.target.closest('.cart-item')
      if (!itemEl) return
      
      const pid = itemEl.dataset.pid
      if (e.target.closest('.decrement')) this.updateQuantity(pid, -1)
      if (e.target.closest('.increment')) this.updateQuantity(pid, 1)
      if (e.target.closest('.delete-item')) this.removeItem(pid)
    })
  }

  // 添加商品
  async addItem(pid) {
    try {
      // 获取商品详情
      const product = await this.fetchProductInfo(pid)

      if (this.items.has(pid)) {
        this.items.get(pid).quantity++
      } else {
        this.items.set(pid, new CartItem(
          pid,
          product.name,
          product.price,
          product.image
        ))
      }
      
      this.updateCartUI()
      this.saveToStorage()
    } catch (err) {
      console.error('添加商品失败:', err)
      alert('无法获取商品信息')
    }
  }

  // 获取商品信息
  async fetchProductInfo(pid) {
    const response = await fetch(`/api/products/${pid}`)
    if (!response.ok) throw new Error('商品不存在')
    return await response.json()
  }

  // 更新数量
  updateQuantity(pid, delta) {
    const item = this.items.get(pid)
    item.quantity = Math.max(1, item.quantity + delta)
    this.updateCartUI()
    this.saveToStorage()
  }

  // 删除商品
  removeItem(pid) {
    this.items.delete(pid)
    this.updateCartUI()
    this.saveToStorage()
  }

  // 更新购物车UI
  updateCartUI() {
    const container = document.querySelector('.cart-items')
    const totalEl = document.querySelector('.cart-total')
    const badge = document.querySelector('.cart-badge')
    const countEl = document.querySelector('.cart-count')

    // 清空现有内容
    container.innerHTML = ''

    // 生成新内容
    let total = 0
    this.items.forEach(item => {
      console.log('Current item:', {
        pid: item.pid,
        name: item.name,
        image: item.image // 验证值
      })
      const itemHTML = `
        <div class="cart-item d-flex p-3 border-bottom" data-pid="${item.pid}">
          <img src="/uploads/thumbnails/${item.image}" 
               class="cart-item-img" 
               alt="${item.name}"
               onerror="this.src='/images/placeholder.png'">
          <div class="ms-3 flex-grow-1">
            <h6 class="mb-1 fs-7 text-sm">${item.name}</h6>
            <div class="quantity-controls d-flex align-items-center mb-2">
              <button class="btn btn-sm btn-outline-secondary decrement">-</button>
              <input type="number" 
                    class="form-control form-control-sm mx-2 quantity" 
                    value="${item.quantity}" 
                    min="1">
              <button class="btn btn-sm btn-outline-secondary increment">+</button>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-danger">$${item.total.toFixed(2)}</span>
              <button class="btn btn-sm btn-link text-danger delete-item">删除</button>
            </div>
          </div>
        </div>
      `
      container.insertAdjacentHTML('beforeend', itemHTML)
      total += item.total
    })

    // 更新总价和徽章
    totalEl.textContent = `$${total.toFixed(2)}`
    badge.textContent = this.items.size
    countEl.textContent = this.items.size
  }
}

// 初始化购物车
document.addEventListener('DOMContentLoaded', () => {
  window.cart = new ShoppingCart()
})
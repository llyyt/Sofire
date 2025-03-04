// public/js/cart.js
class CartUI {
  constructor() {
    this.dom = {
      counter: document.querySelector('.cart-counter'),
      dropdown: document.querySelector('.cart-dropdown'),
      itemsContainer: document.querySelector('.cart-items'),
      totalEl: document.querySelector('.cart-total'),
      countEl: document.querySelector('.cart-count')
    }
  }

  update(cart) {
    // 更新数量显示
    this.dom.counter.textContent = cart.items.size
    this.dom.countEl.textContent = cart.items.size

    // 清空现有内容
    this.dom.itemsContainer.innerHTML = ''

    // 动态生成商品项
    cart.items.forEach(item => {
      const itemEl = document.createElement('div')
      itemEl.className = 'cart-item d-flex p-3 border-bottom'
      itemEl.innerHTML = this._createItemHTML(item)
      this.dom.itemsContainer.appendChild(itemEl)
    })

    // 更新总金额
    this.dom.totalEl.textContent = `$${cart.total.toFixed(2)}`
  }

  _createItemHTML(item) {
    return `
      <div class="flex-shrink-0">
        <img src="/uploads/thumbnails/${item.image}" 
             class="cart-item-img" 
             alt="${item.name}"
             onerror="this.src='/images/placeholder.png'">
      </div>
      <div class="ms-3 flex-grow-1">
        <h6 class="mb-1 fs-7 text-sm">${item.name}</h6>
        <div class="quantity-controls d-flex align-items-center mb-2">
          <button class="btn btn-sm btn-outline-secondary decrement">-</button>
          <input type="number" 
                class="form-control form-control-sm mx-2 quantity-input" 
                value="${item.quantity}" 
                min="1">
          <button class="btn btn-sm btn-outline-secondary increment">+</button>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-danger">$${item.total.toFixed(2)}</span>
          <button class="btn btn-sm btn-link text-danger delete">删除</button>
        </div>
      </div>
    `
  }
}
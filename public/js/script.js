// 点击整个区域展开/收起的功能，用于about this item区域点击折叠部分展开
document.querySelector('.product-details').addEventListener('click', function (e) {
    if (!e.target.closest('.collapse')) {
        const collapseElement = this.querySelector('.collapse');
        bootstrap.Collapse.getOrCreateInstance(collapseElement).toggle();
    }
});
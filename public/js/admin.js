document.addEventListener('DOMContentLoaded', () => {
    // 分类编辑切换
    document.querySelectorAll('.edit-category').forEach(button => {
        button.addEventListener('click', (e) => {
          const row = e.target.closest('tr');
          const nameSpan = row.querySelector('.category-name');
          const input = row.querySelector('.edit-input');
          const button = e.target; // 获取当前按钮
      
          if (input.classList.contains('d-none')) {
            // 进入编辑模式
            nameSpan.classList.add('d-none');
            input.classList.remove('d-none');
            button.textContent = '保存';
          } else {
            // 提交修改
            const catid = button.dataset.catid; // 正确获取分类ID
            const newName = input.value.trim();
      
            fetch(`/admin/categories/update/${catid}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
              },
              credentials: 'same-origin',
              body: JSON.stringify({ name: newName })
            })
            .then(response => {
              if (response.ok) {
                window.location.reload();
              } else {
                alert('更新失败');
                // 失败时恢复界面状态
                nameSpan.classList.remove('d-none');
                input.classList.add('d-none');
                button.textContent = '编辑';
              }
            })
            .catch(error => {
              console.error('Error:', error);
              alert('请求发送失败');
            });
          }
        });
      });
  
    // 分类删除确认
    // document.querySelectorAll('.delete-category').forEach(button => {
    //   button.addEventListener('click', (e) => {
    //     if (!confirm('确定要删除此分类吗？')) {
    //       e.preventDefault();
    //     }
    //   });
    // });

    document.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const catid = button.dataset.catid;
          
          if (confirm('确定要删除此分类吗？')) {
            fetch(`/admin/categories/delete/${catid}`, {
              method: 'POST',
              headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
              }
            })
            .then(response => {
              if (response.ok) {
                window.location.reload();
              } else {
                return response.text().then(text => {
                  throw new Error(text || '删除失败');
                });
              }
            })
            .catch(error => {
              console.error('Error:', error);
              alert(error.message);
            });
          }
        });
      });
      
  });
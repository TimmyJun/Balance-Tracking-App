// 定義交易記錄的數據結構和管理
class TransactionManager {
  constructor() {
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.currentId = parseInt(localStorage.getItem('currentId')) || 1;
    this.initialBalance = parseFloat(localStorage.getItem('initialBalance')) || 0;
  }

  // 設定初始餘額
  setInitialBalance(amount) {
    this.initialBalance = parseFloat(amount)
    localStorage.setItem('initialBalance', amount.toString())
  }

  // 取得初始餘額
  getInitialBalance() {
    return this.initialBalance
  }

  // 新增交易
  addTransaction(transaction) {
    const newTransaction = {
      id: this.currentId++,
      title: transaction.title,
      amount: parseFloat(transaction.amount),
      category: transaction.category,
      type: transaction.type,
      date: transaction.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    this.transactions.unshift(newTransaction);
    this.saveToLocalStorage();

    return newTransaction;
  }

  // 編輯交易
  editTransaction(id, updatedData) {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.transactions[index] = {
        ...this.transactions[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  // 刪除交易
  deleteTransaction(id) {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.transactions.splice(index, 1);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  // 取得所有交易
  getAllTransactions() {
    return this.transactions;
  }

  // 儲存到 LocalStorage
  saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('currentId', this.currentId.toString());
  }

  // 計算總支出
  calculateTotalExpenses() {
    const total = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((total, transaction) => total + parseFloat(transaction.amount), 0);

    return parseFloat(total.toFixed(2))
  }

  // 計算總收入
  calculateTotalIncome() {
    const total = this.transactions
      .filter(t => t.type === 'income')
      .reduce((total, transaction) => total + parseFloat(transaction.amount), 0);
    return parseFloat(total.toFixed(2));
  }

  // 計算類別佔比
  calculateCategoryProportions(type) {
    const transactions = this.transactions.filter(t => t.type === type)
    const total = transactions.reduce((sum, t) => sum + t.amount, 0)

    const categories = {}
    transactions.forEach(t => {
      if (!categories[t.category]) {
        categories[t.category] = 0
      }
      categories[t.category] += t.amount
    })

    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / total) * 100).toFixed(1)
    })).sort((a, b) => b.amount - a.amount)
  }
}

// UI 相關的功能
class TransactionUI {
  constructor(transactionManager) {
    this.manager = transactionManager;
    this.initialBalance = this.manager.getInitialBalance()

    // 檢查是否為首次使用
    if (this.initialBalance === 0) {
      this.showInitialBalanceDialog()
    }

    this.sortOrder = 'desc';
    this.setupDateUpdate()
    this.initializeUI();
  }


  initializeUI() {
    // 初始化 DOM 元素
    this.transactionsList = document.querySelector('.transactions-list');
    this.addButton = document.querySelector('.add-transaction-btn');
    this.expenditureCard = document.querySelector('.balance-card:first-of-type');
    this.balanceCard = document.querySelector('.balance-card:last-of-type');
    this.expenditureAmount = this.expenditureCard.querySelector('.balance-amount');
    this.balanceAmount = this.balanceCard.querySelector('.balance-amount');
    this.dateSection = document.querySelector('.date-section');
    this.sortButton = document.querySelector('.sort-btn');
    this.settingsBtn = document.querySelector('.settings-btn');


    // 綁定排序按鈕事件
    this.sortButton.addEventListener("click", () => {
      this.sortOrder = this.sortOrder === "desc" ? "asc" : "desc"
      this.sortButton.classList.toggle("asc", this.sortOrder === "asc")
      this.renderTransactions()
    })

    // 綁定設定按鈕事件
    this.settingsBtn.addEventListener('click', () => {
      this.showInitialBalanceDialog();
    })

    // 初始化時間
    this.updateDateTime()

    // 初始化能量條
    this.setupEnergyBars()

    // 綁定設定按鈕事件
    this.addButton.addEventListener('click', () => this.showTransactionDialog());

    // 綁定餘額卡片點擊事件
    this.expenditureCard.addEventListener("click", () => {
      this.showCategoryAnalysis('expense')
    })

    this.balanceCard.addEventListener("click", () => {
      this.showCategoryAnalysis('income')
    })

    // 初始化顯示
    this.renderTransactions();
    this.updateTotalExpense();
    this.updateEnergyBar(this.expenditureCard, 0, true);
    this.updateEnergyBar(this.balanceCard, this.initialBalance, false);
  }

  // 新增初始餘額設定對話框
  showInitialBalanceDialog() {
    const dialog = document.createElement('dialog')
    dialog.className = "transaction-dialog"
    const isFirstTime = this.initialBalance === 0

    dialog.innerHTML = `
      <form class="transaction-form">
        <h3>${isFirstTime ? 'Welcome! Set Your Initial Balance' : 'Update Initial Balance'}</h3>
        <div class="form-group">
          <label for="initialBalance">Initial Balance Amount</label>
          <input type="number" id="initialBalance" name="initialBalance" 
                 step="0.01" required min="0" 
                 value="${isFirstTime ? '' : this.initialBalance}">
        </div>
        <div class="dialog-buttons">
          ${isFirstTime ? '' : '<button type="button" class="cancel-btn">Cancel</button>'}
          <button type="submit" class="submit-btn">Save</button>
        </div>
      </form>
    `
    const form = dialog.querySelector('form')

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const amount = parseFloat(form.initialBalance.value)
      this.manager.setInitialBalance(amount)
      this.initialBalance = amount
      dialog.close()
      dialog.remove()
      this.updateTotalExpense()
    })

    // 非首次使用時，添加取消和點擊外部關閉功能
    if (!isFirstTime) {
      const cancelBtn = dialog.querySelector('.cancel-btn')
      cancelBtn.addEventListener("click", () => {
        dialog.close()
        dialog.remove()
      })

      dialog.addEventListener('click', (e) => {
        const dialogDimensions = dialog.getBoundingClientRect();
        if (
          e.clientX < dialogDimensions.left ||
          e.clientX > dialogDimensions.right ||
          e.clientY < dialogDimensions.top ||
          e.clientY > dialogDimensions.bottom
        ) {
          dialog.close();
          dialog.remove();
        }
      })
    }

    // 防止關閉對話框
    dialog.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    document.body.appendChild(dialog)
    dialog.showModal()
  }

  setupDateUpdate() {
    // 更新日期時間
    this.updateDateTime();
    // 每分鐘更新一次
    setInterval(() => this.updateDateTime(), 60000);
  }

  updateDateTime() {
    const now = new Date();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = months[now.getMonth()];
    const date = now.getDate();
    const suffix = this.getDateSuffix(date);

    // 更新日期顯示
    if (this.dateSection) {
      this.dateSection.innerHTML = `
        <h2 class="date-month">${month}</h2>
        <p class="date-day">${date}${suffix}</p>
      `;
    }
  }

  getDateSuffix(date) {
    if (date > 3 && date < 21) return 'th';
    switch (date % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  setupEnergyBars() {
    const cards = [this.expenditureCard, this.balanceCard]

    cards.forEach(card => {
      // 檢查是否已經有能量條
      if (!card.querySelector('.energy-bar')) {
        // 創建能量條和內容容器
        const energyBar = document.createElement('div');
        energyBar.className = 'energy-bar'

        // 創建內容容器
        const content = document.createElement('div');
        content.className = 'balance-content';

        // 移動原有內容到新容器
        while (card.firstChild) {
          content.appendChild(card.firstChild);
        }

        // 添加新元素到卡片
        card.appendChild(energyBar);
        card.appendChild(content);
      }
    });
  }

  updateEnergyBar(element, value, isExpenditure = false) {
    const energyBar = element.querySelector('.energy-bar');
    if (!energyBar) {
      console.log("There's no energy bar")
      return
    }

    // 獲取當前總收入和支出
    const totalIncome = this.manager.calculateTotalIncome();
    const totalBalance = this.initialBalance + totalIncome;

    // 計算百分比
    let percentage
    if (isExpenditure) {
      // 支出百分比相對於當前總資產（初始餘額+總收入）
      percentage = (value / totalBalance) * 100
    } else {
      // 餘額百分比相對於當前總資產
      percentage = (value / totalBalance) * 100;
    }

    // 確保百分比在有效範圍內
    percentage = Math.min(Math.max(percentage, 0), 100)

    // 更新能量條百分比
    energyBar.style.setProperty('--percentage', `${percentage}%`);

    // 更新顏色
    energyBar.classList.remove('energy-low', 'energy-medium', 'energy-high');
    if (isExpenditure) {
      // 支出卡片的顏色邏輯
      if (percentage <= 30) {
        energyBar.classList.add('energy-high');
      } else if (percentage <= 70) {
        energyBar.classList.add('energy-medium');
      } else {
        energyBar.classList.add('energy-low');
      }
    } else {
      // 餘額卡片的顏色邏輯（反向）
      if (percentage >= 70) {
        energyBar.classList.add('energy-high');
      } else if (percentage >= 30) {
        energyBar.classList.add('energy-medium');
      } else {
        energyBar.classList.add('energy-low');
      }
    }
  }

  // 渲染所有交易記錄
  renderTransactions() {
    const transactions = this.manager.getAllTransactions()
      .sort((a, b) => {
        // 首先比較日期
        const dateComparison = new Date(b.date) - new Date(a.date)

        // 如果日期相同，則比較創建時間
        if (dateComparison === 0) {
          return new Date(b.createdAt) - new Date(a.createdAt)
        }

        return this.sortOrder === 'desc' ? dateComparison : -dateComparison
      })

    const existingItems = this.transactionsList.querySelectorAll('.transaction-item')

    this.transactionsList.innerHTML = transactions
      .map(transaction => this.createTransactionHTML(transaction))
      .join('');

    // 綁定編輯和刪除按鈕的事件
    this.transactionsList.querySelectorAll('.transaction-item').forEach(item => {
      const id = parseInt(item.dataset.id);
      item.querySelector('.edit-btn').addEventListener('click', () => this.showTransactionDialog(id));
      item.querySelector('.delete-btn').addEventListener('click', () => this.deleteTransaction(id));
    });
  }

  animateBalanceUpdate(element, newValue, isExpenditure = false) {
    // 清除之前的動畫計時器
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }

    let currentValue = parseFloat(element.dataset.amount || 0)
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = progress * (2 - progress);
      const animatedValue = currentValue + (newValue - currentValue) * easedProgress;

      // 格式化數字
      element.textContent = `$${parseFloat(animatedValue).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
      element.dataset.amount = animatedValue;

      const card = element.closest('.balance-card');
      if (card) {
        this.updateEnergyBar(card, animatedValue, isExpenditure);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate)
  }

  // 更新總支出顯示
  updateTotalExpense() {
    const totalExpenses = parseFloat(this.manager.calculateTotalExpenses())
    const totalIncome = parseFloat(this.manager.calculateTotalIncome())
    const newBalance = this.initialBalance - totalExpenses + totalIncome

    // 更新支出金額
    this.animateBalanceUpdate(this.expenditureAmount, totalExpenses, true);

    // 更新餘額
    this.animateBalanceUpdate(this.balanceAmount, newBalance, false);
  }

  // 創建交易記錄的 HTML
  createTransactionHTML(transaction) {
    return `
    <article class="transaction-item ${transaction.type}" data-id="${transaction.id}">
      <div class="transaction-details">
        <div class="transaction-icon">
          <i class="fa-solid ${transaction.type === 'income' ? 'fa-plus' : 'fa-minus'}"></i>
        </div>
        <div class="transaction-info">
          <span class="transaction-title">${transaction.title}</span>
          <span class="transaction-category">${transaction.category}</span>
          <time class="transaction-date">${this.formatDate(transaction.date)}</time>
        </div>
      </div>
      <div class="transaction-actions">
        <span class="transaction-amount ${transaction.type}">
          ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount}
        </span>
        <button class="edit-btn" aria-label="Edit transaction">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button class="delete-btn" aria-label="Delete transaction">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </article>
    `
  }

  // 顯示交易對話框
  showTransactionDialog(transactionId = null) {
    const transaction = transactionId
      ? this.manager.transactions.find(t => t.id === transactionId)
      : null;

    const dialog = document.createElement('dialog');
    dialog.className = 'transaction-dialog';

    // 定義收入和支出的類別
    const categories = {
      expense: [
        'Transportation',
        'Food',
        'Entertainment',
        'Other'
      ],
      income: [
        'Salary',
        'Investment',
        'Bonus',
        'Other'
      ]
    }

    dialog.innerHTML = `
      <form class="transaction-form">
        <h3>${transaction ? 'Edit' : 'Add'} Transaction</h3>
        
        <div class="mode-toggle">
          <button type="button" class="mode-btn ${!transaction || transaction?.type === 'expense' ? 'active' : ''}" data-mode="expense">Expense</button>
          <button type="button" class="mode-btn ${transaction?.type === 'income' ? 'active' : ''}" data-mode="income">Income</button>
        </div>

        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" required value="${transaction?.title || ''}">
        </div>

        <div class="form-group">
          <label for="amount">Amount</label>
          <input type="number" id="amount" name="amount" step="0.01" required value="${transaction?.amount || ''}">
        </div>

        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" name="category" required>
            <option value="">Select category</option>
            ${(transaction?.type === 'income' ? categories.income : categories.expense)
        .map(cat => `<option value="${cat}" ${transaction?.category === cat ? 'selected' : ''}>${cat}</option>`)
        .join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="date">Date</label>
          <input type="date" id="date" name="date" required value="${transaction?.date || new Date().toISOString().split('T')[0]}">
        </div>

        <div class="dialog-buttons">
          <button type="button" class="cancel-btn">Cancel</button>
          <button type="submit" class="submit-btn">Save</button>
        </div>
      </form>
    `;

    // 綁定模式切換按鈕事件
    const modeButtons = dialog.querySelectorAll('.mode-btn')
    const categorySelect = dialog.querySelector('#category')

    modeButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        const mode = e.target.dataset.mode

        // 更新按鈕狀態
        modeButtons.forEach(btn => btn.classList.remove('active'))
        e.target.classList.add('active')

        // 更新類別選項
        categorySelect.innerHTML = `
          <option value="">Select category</option>
          ${categories[mode].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        `
      })
    })

    // 在打開dialog時添加backdrop效果
    dialog.addEventListener('click', (e) => {
      const dialogDimensions = dialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        dialog.close();
        dialog.remove();
      }
    });

    // 綁定表單事件
    const form = dialog.querySelector('form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const activeMode = dialog.querySelector('.mode-btn.active').dataset.mode

      const transactionData = {
        title: formData.get('title'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: formData.get('date'),
        type: activeMode // 添加交易類型
      };

      if (transaction) {
        this.manager.editTransaction(transaction.id, transactionData);
      } else {
        this.manager.addTransaction(transactionData);
      }

      // 先關閉dialog
      dialog.close();
      dialog.remove();

      // 然後更新UI
      this.renderTransactions();
      this.updateTotalExpense();
    });

    // 綁定取消按鈕
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });

    // 顯示對話框
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  // 刪除交易
  deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.manager.deleteTransaction(id);
      this.renderTransactions();
      this.updateTotalExpense();
    }
  }

  // 格式化日期
  formatDate(dateString) {
    // const options = { month: 'short', day: 'numeric' };
    // return new Date(dateString).toLocaleDateString('en-US', options);

    return new Date(dateString).toLocaleDateString();
  }

  showCategoryAnalysis(type) {
    const proportions = this.manager.calculateCategoryProportions(type)

    const dialog = document.createElement('dialog')
    dialog.className = "transaction-dialog category-analysis"

    const total = proportions.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    dialog.innerHTML = `
      <div class="analysis-content">
        <h3>${type === 'expense' ? 'Expenditure' : 'Income'} Analysis</h3>
        <div class="proportion-table">
          ${proportions.map(p => `
            <div class="proportion-row">
              <div class="proportion-info">
                <span class="category-name">${p.category}</span>
                <span class="category-amount">$${p.amount.toFixed(2)}</span>
              </div>
              <div class="proportion-bar-container">
                <div class="proportion-bar" style="width: ${p.percentage}%"></div>
                <span class="proportion-percentage">${p.percentage}%</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="total-amount">
          Total: $${total.toFixed(2)}
        </div>
        <button class="close-btn">Close</button>
      </div>
    `

    // 綁定關閉按鈕
    dialog.addEventListener('click', (e) => {
      dialog.close()
      dialog.remove()
    })

    // 點擊外部關閉
    dialog.addEventListener('click', (e) => {
      const dialogDimensions = dialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        dialog.close();
        dialog.remove();
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
  const manager = new TransactionManager();
  const ui = new TransactionUI(manager);
});
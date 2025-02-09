import { DateDisplay } from './components/dateDisplay.js';
import { BalanceCard } from './components/balanceCard.js';
import { TransactionDialog } from './components/transactionDialog.js';
import { TransactionItem } from './components/transactionItem.js';
import { DatePickerDialog } from './components/datePickerDialog.js'

export class TransactionView {
  constructor() {
    this._observers = new Set();
    this._initializeElements();
    this._setupEventListeners();
  }

  // Observer Pattern Methods
  subscribe(observer) {
    if (typeof observer.handleEvent !== 'function') {
      throw new Error('Observer must implement handleEvent method');
    }
    this._observers.add(observer);
    return () => this.unsubscribe(observer);
  }

  unsubscribe(observer) {
    return this._observers.delete(observer);
  }

  _notify(eventName, data) {
    this._observers.forEach(observer => observer.handleEvent(eventName, data));
  }

  // Initialize UI Elements
  _initializeElements() {
    // Core elements
    this.transactionsList = document.querySelector('.transactions-list');
    this.addButton = document.querySelector('.add-transaction-btn');
    this.sortButton = document.querySelector('.sort-btn');
    this.settingsBtn = document.querySelector('.settings-btn');

    // Initialize components
    this.dateDisplay = new DateDisplay(document.querySelector('.date-section'));
    this.expenseCard = new BalanceCard(
      document.querySelector('.balance-card:first-of-type'),
      'expense'
    );
    this.incomeCard = new BalanceCard(
      document.querySelector('.balance-card:last-of-type'),
      'income'
    );

    this.dateSection = document.querySelector('.date-section')
  }

  // Setup Event Listeners
  _setupEventListeners() {
    // Sort button
    this.sortButton.addEventListener('click', () => {
      const currentOrder = this.sortButton.classList.contains('asc') ? 'desc' : 'asc';
      this.sortButton.classList.toggle('asc');
      this._notify('sortOrderChanged', { order: currentOrder });
    });

    // Settings button
    this.settingsBtn.addEventListener('click', () => {
      this._notify('settingsRequested');
    });

    // Add transaction button
    this.addButton.addEventListener('click', () => {
      this._notify('addTransactionRequested');
    });

    // Balance cards click events
    this.expenseCard.element.addEventListener('click', () => {
      this._notify('categoryAnalysisRequested', { type: 'expense' });
    });

    this.incomeCard.element.addEventListener('click', () => {
      this._notify('categoryAnalysisRequested', { type: 'income' });
    });

    this.dateSection.addEventListener('click', () => {
      this._notify('datePickerRequested');
    })
  }

  // UI Update Methods
  updateTransactions(transactions) {
    this.transactionsList.innerHTML = '';
    transactions.forEach(transaction => {
      const transactionItem = new TransactionItem(transaction);

      // Setup transaction item event listeners
      transactionItem.onEdit = () => {
        this._notify('editTransactionRequested', { id: transaction.id });
      };

      transactionItem.onDelete = () => {
        this._notify('deleteTransactionRequested', { id: transaction.id });
      };

      this.transactionsList.appendChild(transactionItem.element);
    });
  }

  updateBalances({ expenses, income, totalBalance, initialBalance }) {
    this.expenseCard.updateAmount(expenses);
    this.incomeCard.updateAmount(totalBalance);

    const totalFunds = income + initialBalance;
    const expenseRatio = expenses / totalFunds;
    const balanceRatio = totalBalance / totalFunds;

    // Update energy bars
    this.expenseCard.updateEnergyBar(expenseRatio, 1);
    this.incomeCard.updateEnergyBar(balanceRatio, 1);
  }

  // Dialog Management
  showTransactionDialog(data = null, categories = {}) {
    const dialog = new TransactionDialog(data, categories);

    dialog.onSubmit = (transactionData) => {
      this._notify(
        data ? 'editTransactionSubmitted' : 'addTransactionSubmitted',
        transactionData
      );
    };

    dialog.show();
  }

  showInitialBalanceDialog(currentBalance = 0) {
    const dialog = document.createElement('dialog');
    dialog.className = 'transaction-dialog';
    const isFirstTime = currentBalance === 0;

    dialog.innerHTML = `
      <form class="transaction-form">
        <h3>${isFirstTime ? 'Welcome! Set Your Initial Balance' : 'Update Initial Balance'}</h3>
        <div class="form-group">
          <label for="initialBalance">Initial Balance Amount</label>
          <input type="number" id="initialBalance" name="initialBalance" 
                 step="0.01" required min="0" 
                 value="${isFirstTime ? '' : currentBalance}">
        </div>
        <div class="dialog-buttons">
          ${isFirstTime ? '' : '<button type="button" class="cancel-btn">Cancel</button>'}
          <button type="submit" class="submit-btn">Save</button>
        </div>
      </form>
    `;

    const handleSubmit = (e) => {
      e.preventDefault();
      const amount = parseFloat(dialog.querySelector('#initialBalance').value);
      this._notify('initialBalanceSubmitted', { amount });
      dialog.close();
      dialog.remove();
    };

    dialog.querySelector('form').addEventListener('submit', handleSubmit);

    if (!isFirstTime) {
      const cancelBtn = dialog.querySelector('.cancel-btn');
      cancelBtn.addEventListener('click', () => {
        dialog.close();
        dialog.remove();
      });

      dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          dialog.close();
          dialog.remove();
        }
      });
    }

    document.body.appendChild(dialog);
    dialog.showModal();
  }

  showCategoryAnalysis(type, data) {
    const dialog = document.createElement('dialog');
    dialog.className = 'transaction-dialog category-analysis';

    const total = data.reduce((sum, item) => sum + item.amount, 0);

    dialog.innerHTML = `
      <div class="analysis-content">
        <h3>${type === 'expense' ? 'Expenditure' : 'Income'} Analysis</h3>
        <div class="proportion-table">
          ${data.map(item => `
            <div class="proportion-row">
              <div class="proportion-info">
                <span class="category-name">${item.category}</span>
                <span class="category-amount">$${item.amount.toFixed(2)}</span>
              </div>
              <div class="proportion-bar-container">
                <div class="proportion-bar" style="width: ${item.percentage}%"></div>
                <span class="proportion-percentage">${item.percentage}%</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="total-amount">
          Total: $${total.toFixed(2)}
        </div>
        <button class="close-btn">Close</button>
      </div>
    `;

    const closeDialog = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelector('.close-btn').addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        closeDialog();
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  }

  // 顯示日期選擇器對話框
  showDatePickerDialog(availableYears) {
    const dialog = new DatePickerDialog(availableYears);
    dialog.onSubmit = (data) => {
      this._notify('periodAnalysisRequested', data);
    };
    dialog.show();
  }

  // 顯示時段分析報表
  showPeriodAnalysisReport(report) {
    const dialog = document.createElement('dialog');
    dialog.className = 'transaction-dialog period-analysis';

    const { periodSummary, categoryAnalysis } = report;

    dialog.innerHTML = `
    <div class="analysis-content">
      <h3>時段分析報表</h3>
      <div class="period-info">
        <p>分析期間：${periodSummary.startDate} 至 ${periodSummary.endDate}</p>
        <p>總天數：${periodSummary.dayCount} 天</p>
      </div>

      <div class="summary-cards">
        <div class="summary-card income">
          <h4>收入統計</h4>
          <div class="summary-data">
            <p>總收入：$${periodSummary.totalIncome}</p>
            <p>日均收入：$${periodSummary.dailyAvgIncome}</p>
          </div>
        </div>
        <div class="summary-card expense">
          <h4>支出統計</h4>
          <div class="summary-data">
            <p>總支出：$${periodSummary.totalExpense}</p>
            <p>日均支出：$${periodSummary.dailyAvgExpense}</p>
          </div>
        </div>
      </div>

      <div class="net-income">
        <h4>淨收入</h4>
        <p class="${periodSummary.netIncome >= 0 ? 'positive' : 'negative'}">
          $${periodSummary.netIncome}
        </p>
      </div>

      <div class="category-analysis">
        <h4>收入分類統計</h4>
        <div class="proportion-table">
          ${this._generateCategoryAnalysisHTML(categoryAnalysis.income)}
        </div>

        <h4>支出分類統計</h4>
        <div class="proportion-table">
          ${this._generateCategoryAnalysisHTML(categoryAnalysis.expense)}
        </div>
      </div>

      <button class="close-btn">關閉</button>
    </div>
  `;

    const closeDialog = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelector('.close-btn').addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        closeDialog();
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  }

  // 生成類別分析 HTML
  _generateCategoryAnalysisHTML(categories) {
    return categories
      .map(item => `
      <div class="proportion-row">
        <div class="proportion-info">
          <span class="category-name">${item.category}</span>
          <span class="category-stats">
            <span class="category-amount">$${item.amount}</span>
            <span class="category-count">(${item.count} 筆)</span>
          </span>
        </div>
        <div class="proportion-bar-container">
          <div class="proportion-bar" style="width: ${item.percentage}%"></div>
          <span class="proportion-percentage">${item.percentage}%</span>
        </div>
        <div class="category-details">
          平均金額：$${item.avgAmount}
        </div>
      </div>
    `)
      .join('');
  }

  // Error Handling
  showError(message) {
    // Implementation of error display logic
    console.error(message);
    // You could implement a toast or alert system here
  }
}
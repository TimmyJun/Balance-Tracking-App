import { DateDisplay } from './components/dateDisplay.js';
import { BalanceCard } from './components/balanceCard.js';
import { TransactionDialog } from './components/transactionDialog.js';
import { TransactionItem } from './components/transactionItem.js';

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

  // Error Handling
  showError(message) {
    // Implementation of error display logic
    console.error(message);
    // You could implement a toast or alert system here
  }
}
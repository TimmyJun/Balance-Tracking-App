import { TransactionModel } from '../models/transactionModel.js';
import { TransactionView } from '../views/transactionView.js';

export class TransactionController {
  constructor() {
    this.model = new TransactionModel();
    this.view = new TransactionView();

    // Initialize controller
    this._initialize();
  }

  _initialize() {
    // Subscribe to view events
    this.view.subscribe({
      handleEvent: (eventName, data) => this._handleViewEvent(eventName, data)
    });

    // Subscribe to model events
    this.model.subscribe({
      update: (eventType, data) => this._handleModelEvent(eventType, data)
    });

    // Check initial balance
    const initialBalance = this.model.getInitialBalance();
    if (initialBalance === 0) {
      this.view.showInitialBalanceDialog();
    }

    // Initial render
    this._updateView();
  }

  // Handle all view events
  _handleViewEvent(eventName, data) {
    switch (eventName) {
      case 'addTransactionRequested':
        this.view.showTransactionDialog(null, {
          expense: this.model.getCategories('expense'),
          income: this.model.getCategories('income')
        });
        break;

      case 'editTransactionRequested':
        const transaction = this.model.getTransactionById(data.id);
        this.view.showTransactionDialog(transaction, {
          expense: this.model.getCategories('expense'),
          income: this.model.getCategories('income')
        });
        break;

      case 'deleteTransactionRequested':
        if (confirm('Are you sure you want to delete this transaction?')) {
          try {
            this.model.deleteTransaction(data.id);
          } catch (error) {
            this.view.showError(error.message);
          }
        }
        break;

      case 'addTransactionSubmitted':
        try {
          this.model.addTransaction(data);
        } catch (error) {
          this.view.showError(error.message);
        }
        break;

      case 'editTransactionSubmitted':
        try {
          this.model.editTransaction(data.id, data);
        } catch (error) {
          this.view.showError(error.message);
        }
        break;

      case 'initialBalanceSubmitted':
        try {
          this.model.setInitialBalance(data.amount);
        } catch (error) {
          this.view.showError(error.message);
        }
        break;

      case 'sortOrderChanged':
        this._updateTransactionsList(data.order);
        break;

      case 'categoryAnalysisRequested':
        const proportions = this.model.calculateCategoryProportions(data.type);
        this.view.showCategoryAnalysis(data.type, proportions);
        break;

      case 'settingsRequested':
        this.view.showInitialBalanceDialog(this.model.getInitialBalance());
        break;

      default:
        console.warn('Unhandled view event:', eventName);
    }
  }

  // Handle all model events
  _handleModelEvent(eventType, data) {
    switch (eventType) {
      case 'transactionAdded':
      case 'transactionUpdated':
      case 'transactionDeleted':
      case 'balanceChanged':
        this._updateView();
        break;

      case 'storageError':
        this.view.showError(data);
        break;

      default:
        console.warn('Unhandled model event:', eventType);
    }
  }

  // Update the entire view
  _updateView() {
    // Update transactions list
    this._updateTransactionsList();

    // Update balance information
    const balanceInfo = {
      expenses: this.model.calculateTotalExpenses(),
      income: this.model.calculateTotalIncome(),
      totalBalance: this.model.calculateCurrentBalance()
    };

    this.view.updateBalances(balanceInfo);
  }

  // Update transactions list with optional sort order
  _updateTransactionsList(sortOrder = 'desc') {
    const transactions = this.model.getSortedTransactions(sortOrder);
    this.view.updateTransactions(transactions);
  }
}
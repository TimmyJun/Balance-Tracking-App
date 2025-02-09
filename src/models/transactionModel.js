import { Transaction } from './transaction.js';

export class TransactionModel {
  constructor() {
    // Private properties
    this._transactions = [];
    this._currentId = 1;
    this._initialBalance = 0;
    this._observers = new Set();
    this._categories = {
      expense: ['Transportation', 'Food', 'Entertainment', 'Other'],
      income: ['Salary', 'Investment', 'Bonus', 'Other']
    };

    // Initialize data
    this._loadFromStorage();
  }

  // Observer Pattern Methods
  subscribe(observer) {
    if (typeof observer.update !== 'function') {
      throw new Error('Observer must implement update method');
    }
    this._observers.add(observer);
    return () => this.unsubscribe(observer); // Return unsubscribe function
  }

  unsubscribe(observer) {
    return this._observers.delete(observer);
  }

  _notify(eventType, data) {
    this._observers.forEach(observer => observer.update(eventType, data));
  }

  // Storage Methods
  _loadFromStorage() {
    try {
      const storedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
      const storedId = parseInt(localStorage.getItem('currentId'));
      const storedBalance = parseFloat(localStorage.getItem('initialBalance'));

      this._transactions = storedTransactions.map(data => new Transaction(data));
      this._currentId = storedId || 1;
      this._initialBalance = storedBalance || 0;
    } catch (error) {
      console.error('Error loading from storage:', error);
      this._handleStorageError();
    }
  }

  _saveToStorage() {
    try {
      localStorage.setItem('transactions', JSON.stringify(this._transactions));
      localStorage.setItem('currentId', this._currentId.toString());
      localStorage.setItem('initialBalance', this._initialBalance.toString());
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw new Error('Failed to save data');
    }
  }

  _handleStorageError() {
    this._transactions = [];
    this._currentId = 1;
    this._initialBalance = 0;
    this._notify('storageError', 'Failed to load data from storage');
  }

  // Balance Methods
  setInitialBalance(amount) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      throw new Error('Invalid balance amount');
    }

    this._initialBalance = parsedAmount;
    this._saveToStorage();
    this._notify('balanceChanged', { initialBalance: this._initialBalance });
    return this._initialBalance;
  }

  getInitialBalance() {
    return this._initialBalance;
  }

  // Category Methods
  getCategories(type) {
    if (!this._categories[type]) {
      throw new Error('Invalid transaction type');
    }
    return [...this._categories[type]];
  }

  // Transaction CRUD Operations
  addTransaction(transactionData) {
    try {
      const transaction = new Transaction({
        id: this._currentId++,
        ...transactionData
      });

      this._transactions.unshift(transaction);
      this._saveToStorage();
      this._notify('transactionAdded', transaction);
      return transaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  editTransaction(id, updatedData) {
    const index = this._transactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    try {
      const currentTransaction = this._transactions[index];
      const updatedTransaction = currentTransaction.update(updatedData);

      this._transactions[index] = updatedTransaction;
      this._saveToStorage();
      this._notify('transactionUpdated', updatedTransaction);
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  deleteTransaction(id) {
    const index = this._transactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found');
    }

    const deletedTransaction = this._transactions[index];
    this._transactions.splice(index, 1);
    this._saveToStorage();
    this._notify('transactionDeleted', deletedTransaction);
    return true;
  }

  // Query Methods
  getAllTransactions() {
    return [...this._transactions];
  }

  getTransactionById(id) {
    const transaction = this._transactions.find(t => t.id === id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  getSortedTransactions(order = 'desc') {
    return [...this._transactions].sort((a, b) => {
      const dateComparison = new Date(b.date) - new Date(a.date);
      return dateComparison === 0
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : order === 'desc' ? dateComparison : -dateComparison;
    });
  }

  // Analysis Methods
  _calculateTotal(type) {
    return parseFloat(
      this._transactions
        .filter(t => t.type === type)
        .reduce((total, t) => total + t.amount, 0)
        .toFixed(2)
    );
  }

  calculateTotalExpenses() {
    return this._calculateTotal('expense');
  }

  calculateTotalIncome() {
    return this._calculateTotal('income');
  }

  calculateCurrentBalance() {
    return parseFloat((
      this._initialBalance +
      this.calculateTotalIncome() -
      this.calculateTotalExpenses()
    ).toFixed(2));
  }

  calculateCategoryProportions(type) {
    const transactions = this._transactions.filter(t => t.type === type);
    if (transactions.length === 0) {
      return [];
    }

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const categories = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    return Object.entries(categories)
      .map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2)),
        percentage: parseFloat(((amount / total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // 根據時間範圍獲取交易數據
  getTransactionsByDateRange(startDate, endDate) {
    return this._transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  // 獲取指定月份的交易數據
  getTransactionsByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getTransactionsByDateRange(startDate, endDate);
  }

  // 計算指定時間範圍內的收支分析
  generateDateRangeReport(startDate, endDate) {
    const transactions = this.getTransactionsByDateRange(startDate, endDate);

    // 收入和支出的交易分類
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // 計算總收入和總支出
    const totalIncome = parseFloat(
      incomeTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)
    );
    const totalExpense = parseFloat(
      expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)
    );

    // 計算各類別的統計
    const incomeByCategory = this._calculateCategoryStats(incomeTransactions);
    const expenseByCategory = this._calculateCategoryStats(expenseTransactions);

    // 計算日均收支
    const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const dailyAvgIncome = parseFloat((totalIncome / dayCount).toFixed(2));
    const dailyAvgExpense = parseFloat((totalExpense / dayCount).toFixed(2));

    return {
      periodSummary: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dayCount,
        totalIncome,
        totalExpense,
        netIncome: parseFloat((totalIncome - totalExpense).toFixed(2)),
        dailyAvgIncome,
        dailyAvgExpense
      },
      categoryAnalysis: {
        income: incomeByCategory,
        expense: expenseByCategory
      },
      transactions: {
        income: incomeTransactions,
        expense: expenseTransactions
      }
    };
  }

  // 生成月度報告
  generateMonthlyReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.generateDateRangeReport(startDate, endDate);
  }

  // 計算類別統計信息
  _calculateCategoryStats(transactions) {
    const categoryMap = new Map();
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    // 按類別分組並計算
    transactions.forEach(t => {
      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, {
          category: t.category,
          amount: 0,
          count: 0,
          transactions: []
        });
      }
      const stats = categoryMap.get(t.category);
      stats.amount += t.amount;
      stats.count += 1;
      stats.transactions.push(t);
    });

    // 轉換為數組並計算百分比
    return Array.from(categoryMap.values())
      .map(stats => ({
        ...stats,
        amount: parseFloat(stats.amount.toFixed(2)),
        percentage: parseFloat(((stats.amount / total) * 100).toFixed(1)),
        avgAmount: parseFloat((stats.amount / stats.count).toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // 獲取可選擇的年份範圍
  getAvailableYears() {
    const currentYear = new Date().getFullYear();

    if (this._transactions.length === 0) {
      return [currentYear - 2, currentYear - 1, currentYear];
    }

    const yearSet = new Set(
      this._transactions.map(t => new Date(t.date).getFullYear())
    );

    // 確保當前年份也被包含
    yearSet.add(currentYear);

    const years = Array.from(yearSet);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // 生成連續的年份數組
    return Array.from(
      { length: maxYear - minYear + 1 },
      (_, i) => minYear + i
    ).sort((a, b) => b - a); // 降序排序
  }
}
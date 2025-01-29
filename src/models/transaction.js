export class Transaction {
  constructor({ id, title, amount, category, date, type, createdAt, updatedAt }) {
    this.id = id;
    this.title = title;
    this.amount = this._validateAmount(amount);
    this.category = this._validateCategory(category, type);
    this.date = date || this._getFormattedDate();
    this.type = this._validateType(type);
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || this.createdAt;
  }

  // Private validation methods
  _validateAmount(amount) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Amount must be a positive number');
    }
    return parseFloat(parsedAmount.toFixed(2));
  }

  _validateType(type) {
    const validTypes = ['income', 'expense'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid transaction type');
    }
    return type;
  }

  _validateCategory(category, type) {
    const categories = {
      expense: ['Transportation', 'Food', 'Entertainment', 'Other'],
      income: ['Salary', 'Investment', 'Bonus', 'Other']
    };

    if (!categories[type]?.includes(category)) {
      throw new Error('Invalid category for the specified type');
    }
    return category;
  }

  _getFormattedDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Public methods
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      amount: this.amount,
      category: this.category,
      date: this.date,
      type: this.type,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  update(data) {
    const updatedData = {
      ...this.toJSON(),
      ...data,
      updatedAt: new Date().toISOString()
    };
    return new Transaction(updatedData);
  }
}
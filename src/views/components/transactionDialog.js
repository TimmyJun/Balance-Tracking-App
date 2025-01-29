export class TransactionDialog {
  constructor(transaction = null, categories = {
    expense: ['Transportation', 'Food', 'Entertainment', 'Other'],
    income: ['Salary', 'Investment', 'Bonus', 'Other']
  }) {
    this.transaction = transaction;
    this.categories = categories;
    this.dialog = this._createDialog();
    this.onSubmit = null; // Callback to be set by parent
  }

  _createDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'transaction-dialog';

    dialog.innerHTML = `
      <form class="transaction-form">
        <h3>${this.transaction ? 'Edit' : 'Add'} Transaction</h3>
        
        <div class="mode-toggle">
          <button type="button" class="mode-btn ${!this.transaction || this.transaction?.type === 'expense' ? 'active' : ''}" 
                  data-mode="expense">Expense</button>
          <button type="button" class="mode-btn ${this.transaction?.type === 'income' ? 'active' : ''}" 
                  data-mode="income">Income</button>
        </div>

        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" required 
                 value="${this.transaction?.title || ''}">
        </div>

        <div class="form-group">
          <label for="amount">Amount</label>
          <input type="number" id="amount" name="amount" step="0.01" required 
                 value="${this.transaction?.amount || ''}">
        </div>

        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" name="category" required>
            <option value="">Select category</option>
            ${this._generateCategoryOptions()}
          </select>
        </div>

        <div class="form-group">
          <label for="date">Date</label>
          <input type="date" id="date" name="date" required 
                 value="${this.transaction?.date || new Date().toISOString().split('T')[0]}">
        </div>

        <div class="dialog-buttons">
          <button type="button" class="cancel-btn">Cancel</button>
          <button type="submit" class="submit-btn">Save</button>
        </div>
      </form>
    `;

    this._setupEventListeners(dialog);
    return dialog;
  }

  _generateCategoryOptions() {
    const currentType = this.transaction?.type || 'expense';
    return this.categories[currentType]
      .map(cat => `<option value="${cat}" ${this.transaction?.category === cat ? 'selected' : ''}>${cat}</option>`)
      .join('');
  }

  _setupEventListeners(dialog) {
    const form = dialog.querySelector('form');
    const modeButtons = dialog.querySelectorAll('.mode-btn');
    const categorySelect = dialog.querySelector('#category');

    // Mode toggle handling
    modeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        modeButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Update category options
        categorySelect.innerHTML = `
          <option value="">Select category</option>
          ${this.categories[mode].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        `;
      });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const activeMode = dialog.querySelector('.mode-btn.active').dataset.mode;

      const transactionData = {
        title: formData.get('title'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: formData.get('date'),
        type: activeMode
      };

      if (this.transaction) {
        transactionData.id = this.transaction.id;
      }

      if (this.onSubmit) {
        this.onSubmit(transactionData);
      }

      this.close();
    });

    // Cancel button
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      this.close();
    });

    // Click outside dialog
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        this.close();
      }
    });

    // Prevent closing when clicking inside
    dialog.querySelector('.transaction-form').addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  show() {
    document.body.appendChild(this.dialog);
    this.dialog.showModal();
  }

  close() {
    this.dialog.close();
    this.dialog.remove();
  }
}
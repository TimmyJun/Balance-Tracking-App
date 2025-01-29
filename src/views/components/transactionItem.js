export class TransactionItem {
  constructor(transaction) {
    this.transaction = transaction;
    this.element = this._createElement();
    this.onEdit = null;    // Callback to be set by parent
    this.onDelete = null;  // Callback to be set by parent
  }

  _createElement() {
    const article = document.createElement('article');
    article.className = `transaction-item ${this.transaction.type}`;
    article.dataset.id = this.transaction.id;

    article.innerHTML = `
      <div class="transaction-details">
        <div class="transaction-icon">
          <i class="fa-solid ${this.transaction.type === 'income' ? 'fa-plus' : 'fa-minus'}"></i>
        </div>
        <div class="transaction-info">
          <span class="transaction-title">${this.transaction.title}</span>
          <span class="transaction-category">${this.transaction.category}</span>
          <time class="transaction-date">${this._formatDate(this.transaction.date)}</time>
        </div>
      </div>
      <div class="transaction-actions">
        <span class="transaction-amount ${this.transaction.type}">
          ${this.transaction.type === 'income' ? '+' : '-'}$${this.transaction.amount}
        </span>
        <button class="edit-btn" aria-label="Edit transaction">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button class="delete-btn" aria-label="Delete transaction">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    this._setupEventListeners(article);
    return article;
  }

  _setupEventListeners(element) {
    const editBtn = element.querySelector('.edit-btn');
    const deleteBtn = element.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
      if (this.onEdit) {
        this.onEdit();
      }
    });

    deleteBtn.addEventListener('click', () => {
      if (this.onDelete) {
        this.onDelete();
      }
    });
  }

  _formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  // Public methods for updating the transaction item
  update(transaction) {
    this.transaction = transaction;
    const newElement = this._createElement();
    this.element.replaceWith(newElement);
    this.element = newElement;
  }

  remove() {
    this.element.remove();
  }
}
export class DateDisplay {
  constructor(element) {
    this.element = element;
    this.updateDateTime();
    this.startDateTimeUpdate();
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

    this.element.innerHTML = `
      <h2 class="date-month">${month}</h2>
      <p class="date-day">${date}${suffix}</p>
    `;
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

  startDateTimeUpdate() {
    // Update every minute
    setInterval(() => this.updateDateTime(), 60000);
  }
}
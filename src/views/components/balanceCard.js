export class BalanceCard {
  constructor(element, type) {
    this.element = element;
    this.type = type;
    this.amount = element.querySelector('.balance-amount');
    this.setupEnergyBar();
  }

  setupEnergyBar() {
    if (!this.element.querySelector('.energy-bar')) {
      const energyBar = document.createElement('div');
      energyBar.className = 'energy-bar';

      const content = document.createElement('div');
      content.className = 'balance-content';

      while (this.element.firstChild) {
        content.appendChild(this.element.firstChild);
      }

      this.element.appendChild(energyBar);
      this.element.appendChild(content);
    }
  }

  updateAmount(value) {
    this.animateBalanceUpdate(parseFloat(value));
  }

  updateEnergyBar(value, total) {
    const energyBar = this.element.querySelector('.energy-bar');
    if (!energyBar) return;

    let percentage = (value / total) * 100;

    // 設定最小顯示值
    if (this.type === 'income' && value > 0) {
      percentage = Math.max(percentage, 1); // 最少顯示 1%
    }

    percentage = Math.min(Math.max(percentage, 0), 100);

    energyBar.style.setProperty('--percentage', `${percentage}%`);

    energyBar.classList.remove('energy-low', 'energy-medium', 'energy-high');

    if (this.type === 'expense') {
      if (percentage <= 30) energyBar.classList.add('energy-high');
      else if (percentage <= 70) energyBar.classList.add('energy-medium');
      else energyBar.classList.add('energy-low');
    } else {
      if (percentage >= 70) energyBar.classList.add('energy-high');
      else if (percentage >= 30) energyBar.classList.add('energy-medium');
      else energyBar.classList.add('energy-low');
    }
  }

  animateBalanceUpdate(newValue) {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startValue = parseFloat(this.amount.dataset.amount || 0);
    const startTime = performance.now();
    const duration = 1500;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = progress * (2 - progress);
      const currentValue = startValue + (newValue - startValue) * easedProgress;

      this.amount.textContent = `$${currentValue.toLocaleString(undefined, {
        // minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
      this.amount.dataset.amount = currentValue;

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }
}
export class DatePickerDialog {
  constructor(availableYears = null) {
    this.availableYears = availableYears || this._getDefaultYears();
    this.dialog = this._createDialog();
    this.onSubmit = null;
  }

  _getDefaultYears() {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear];
  }

  _createDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'transaction-dialog date-picker-dialog';

    dialog.innerHTML = `
      <form class="transaction-form">
        <h3>選擇分析時段</h3>
        
        <div class="mode-toggle">
          <button type="button" class="mode-btn active" data-mode="month">月度分析</button>
          <button type="button" class="mode-btn" data-mode="custom">自訂時段</button>
        </div>

        <div class="form-group" id="month-picker">
          <label for="yearMonth">選擇年月</label>
          <div class="date-inputs">
            <select id="year" name="year" required>
              ${this._generateYearOptions()}
            </select>
            <select id="month" name="month" required>
              ${this._generateMonthOptions()}
            </select>
          </div>
        </div>

        <div class="form-group hidden" id="date-range-picker">
          <label for="startDate">起始日期</label>
          <input type="date" id="startDate" name="startDate">
          
          <label for="endDate">結束日期</label>
          <input type="date" id="endDate" name="endDate">
        </div>

        <div class="dialog-buttons">
          <button type="button" class="cancel-btn">取消</button>
          <button type="submit" class="submit-btn">產生報表</button>
        </div>
      </form>
    `;

    this._setupEventListeners(dialog);
    return dialog;
  }

  _generateYearOptions() {
    const currentYear = new Date().getFullYear();
    return this.availableYears
      .map(year => `<option value="${year}">${year}年</option>`)
      .join('');
  }

  _generateMonthOptions() {
    const months = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return months
      .map((month, index) => `<option value="${index + 1}">${month}</option>`)
      .join('');
  }

  _setupEventListeners(dialog) {
    const form = dialog.querySelector('form');
    const modeButtons = dialog.querySelectorAll('.mode-btn');
    const monthPicker = dialog.querySelector('#month-picker');
    const dateRangePicker = dialog.querySelector('#date-range-picker');

    // 模式切換
    modeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        modeButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        if (mode === 'month') {
          monthPicker.classList.remove('hidden');
          dateRangePicker.classList.add('hidden');
        } else {
          monthPicker.classList.add('hidden');
          dateRangePicker.classList.remove('hidden');
        }
      });
    });

    // 表單提交
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const mode = dialog.querySelector('.mode-btn.active').dataset.mode;
      const formData = new FormData(form);

      let data;
      if (mode === 'month') {
        data = {
          type: 'month',
          year: parseInt(formData.get('year')),
          month: parseInt(formData.get('month'))
        };
      } else {
        data = {
          type: 'custom',
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate')
        };
      }

      if (this.onSubmit) {
        this.onSubmit(data);
      }

      this.close();
    });

    // 取消按鈕
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      this.close();
    });

    // 點擊外部關閉
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

    // 防止內部點擊關閉
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
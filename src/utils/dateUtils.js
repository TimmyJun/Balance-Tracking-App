export class DateUtils {
  // 獲取當前本地日期（YYYY-MM-DD格式）
  static getLocalDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split('T')[0];
  }

  // 轉換日期字串為本地日期
  static formatToLocalDate(dateString) {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date - offset).toISOString().split('T')[0];
  }

  // 格式化日期為本地顯示格式
  static formatToDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
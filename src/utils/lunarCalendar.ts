/**
 * Vietnamese Lunar Calendar & Ancestor Death Anniversary (Ngày Giỗ) Utility
 * Hỗ trợ tính Can Chi, chuyển đổi ngày giỗ âm lịch sang ngày dương năm hiện tại,
 * và tính số ngày đếm ngược đến ngày giỗ.
 */

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export function getCanChiYear(year: number): string {
  const canIndex = (year + 6) % 10;
  const chiIndex = (year + 8) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
}

/**
 * Thuật toán ước tính / chuyển đổi ngày Âm sang ngày Dương trong năm 2026/2027
 * Năm 2026 là năm Bính Thìn / Bính Ngọ (Mùng 1 Tết Âm lịch 2026 rơi vào ngày 17/02/2026 Dương Lịch)
 * Độ lệch trung bình giữa Dương lịch và Âm lịch Việt Nam là khoảng 29-30 ngày mỗi tháng.
 */
export function estimateSolarDateFromLunar(lunarDay: number, lunarMonth: number, currentYear = 2026): {
  solarDateString: string;
  daysLeft: number;
  formattedDate: string;
} {
  // Điểm mốc: Mùng 1 tháng 1 Âm lịch 2026 = 17/02/2026
  // Điểm mốc: Mùng 1 tháng 1 Âm lịch 2027 = 06/02/2027
  const baseTet2026 = new Date(2026, 1, 17); // Month index 1 is Feb
  
  // Ước lượng ngày trong năm bằng cách cộng số ngày theo tháng âm lịch
  const daysFromNewYear = (lunarMonth - 1) * 29.53 + (lunarDay - 1);
  const targetDate2026 = new Date(baseTet2026.getTime() + daysFromNewYear * 24 * 60 * 60 * 1000);
  
  const today = new Date();
  let daysDiff = Math.ceil((targetDate2026.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let finalTargetDate = targetDate2026;
  if (daysDiff < -5) {
    // Nếu ngày giỗ năm nay đã qua quá 5 ngày, tính sang năm tiếp theo 2027
    const baseTet2027 = new Date(2027, 1, 6);
    finalTargetDate = new Date(baseTet2027.getTime() + daysFromNewYear * 24 * 60 * 60 * 1000);
    daysDiff = Math.ceil((finalTargetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const yyyy = finalTargetDate.getFullYear();
  const mm = String(finalTargetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(finalTargetDate.getDate()).padStart(2, '0');

  return {
    solarDateString: `${yyyy}-${mm}-${dd}`,
    daysLeft: Math.max(0, daysDiff),
    formattedDate: `${dd}/${mm}/${yyyy}`,
  };
}

export function parseLunarDate(lunarStr?: string): { day: number; month: number; year?: number } | null {
  if (!lunarStr) return null;
  const parts = lunarStr.split(/[\/\-]/);
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parts.length >= 3 ? parseInt(parts[2], 10) : undefined;
    if (!isNaN(day) && !isNaN(month)) {
      return { day, month, year };
    }
  }
  return null;
}

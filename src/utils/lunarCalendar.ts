/**
 * Lịch âm Việt Nam chính xác theo múi giờ UTC+7.
 * Thuật toán thiên văn dựa trên Julian Day / sóc (new moon), phù hợp để
 * chuyển ngày âm <-> dương trong khoảng thông dụng 1900-2100.
 */

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const DAY_MS = 86_400_000;
const TZ = 7;

export function getCanChiYear(year: number): string {
  const canIndex = ((year + 6) % 10 + 10) % 10;
  const chiIndex = ((year + 8) % 12 + 12) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
}

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4);
  jd = jd - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  return jd;
}

function jdToDate(jd: number): { day: number; month: number; year: number } {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { day, month, year };
}

function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  const m = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let c1 =
    (0.1734 - 0.000393 * T) * Math.sin(m * dr) +
    0.0021 * Math.sin(2 * m * dr) -
    0.4068 * Math.sin(mpr * dr) +
    0.0161 * Math.sin(2 * mpr * dr) -
    0.0004 * Math.sin(3 * mpr * dr) +
    0.0104 * Math.sin(2 * f * dr) -
    0.0051 * Math.sin((m + mpr) * dr) -
    0.0074 * Math.sin((m - mpr) * dr) +
    0.0004 * Math.sin((2 * f + m) * dr) -
    0.0004 * Math.sin((2 * f - m) * dr) -
    0.0006 * Math.sin((2 * f + mpr) * dr) +
    0.0010 * Math.sin((2 * f - mpr) * dr) +
    0.0005 * Math.sin((2 * mpr + m) * dr);

  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;

  return jd1 + c1 - deltat;
}

function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0 - 0.5) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const m = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const l0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let dl =
    (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(m * dr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * m * dr) +
    0.000290 * Math.sin(3 * m * dr);
  let l = l0 + dl;
  l *= dr;
  return ((l - Math.floor(l / (2 * Math.PI)) * 2 * Math.PI) / Math.PI) * 6;
}

function getNewMoonDay(k: number): number {
  return Math.floor(newMoon(k) + 0.5 + TZ / 24);
}

function getSunLongitude(dayNumber: number): number {
  return Math.floor(sunLongitude(dayNumber));
}

function getLunarMonth11(yy: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k);
  const sunLong = getSunLongitude(nm);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1);
  return nm;
}

function getLeapMonthOffset(a11: number): number {
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i));
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i));
  } while (arc !== last && i < 15);
  return i - 1;
}

function convertSolar2Lunar(dd: number, mm: number, yy: number): [number, number, number, number] {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k);

  let a11 = getLunarMonth11(yy);
  let b11 = a11;
  let lunarYear: number;

  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  let lunarLeap = 0;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = 1;
    }
  }

  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

function convertLunar2Solar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap = 0,
): { day: number; month: number; year: number } {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1);
    b11 = getLunarMonth11(lunarYear);
  } else {
    a11 = getLunarMonth11(lunarYear);
    b11 = getLunarMonth11(lunarYear + 1);
  }

  let off = lunarMonth - 11;
  if (off < 0) off += 12;

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11);
    const leapMonth = leapOff - 2;
    if (lunarLeap && lunarMonth !== leapMonth) return { day: 0, month: 0, year: 0 };
    if (lunarLeap || off >= leapOff) off += 1;
  }

  const monthStart = getNewMoonDay(Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853) + off);
  const jd = monthStart + lunarDay - 1;
  return jdToDate(jd);
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leapMonth: boolean;
}

export function solarToLunar(date: Date): LunarDate {
  const [day, month, year, leap] = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
  return { day, month, year, leapMonth: leap === 1 };
}

export function lunarToSolar(
  day: number,
  month: number,
  year: number,
  leapMonth = false,
): Date | null {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (day < 1 || day > 30 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;

  const solar = convertLunar2Solar(day, month, year, leapMonth ? 1 : 0);
  if (!solar.day) return null;
  return new Date(solar.year, solar.month - 1, solar.day);
}

export function parseLunarDate(lunarStr?: string): { day: number; month: number; year?: number; leapMonth?: boolean } | null {
  if (!lunarStr) return null;
  const normalized = lunarStr.trim().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?\s*(nhuận|nhuan|leap)?$/i);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3] ? Number(match[3]) : undefined;
  const leapMonth = Boolean(match[4]);

  if (day < 1 || day > 30 || month < 1 || month > 12) return null;
  return { day, month, year, leapMonth };
}

/**
 * Chuyển ngày giỗ âm lịch sang ngày dương của năm hiện tại.
 * Nếu đã qua, trả về lần kế tiếp. Không dùng phép cộng 29.53 ngày ước lượng.
 */
export function estimateSolarDateFromLunar(
  lunarDay: number,
  lunarMonth: number,
  currentYear = new Date().getFullYear(),
): { solarDateString: string; daysLeft: number; formattedDate: string } {
  const now = new Date();
  // Lấy một ngày giữa năm để chắc chắn đang thuộc đúng năm âm lịch cần tính.
  const lunarYear = solarToLunar(new Date(currentYear, 6, 1)).year;
  let target = lunarToSolar(lunarDay, lunarMonth, lunarYear);

  if (!target) return { solarDateString: '', daysLeft: 0, formattedDate: 'Không hợp lệ' };

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (target.getTime() < todayStart.getTime()) {
    target = lunarToSolar(lunarDay, lunarMonth, lunarYear + 1);
  }

  if (!target) return { solarDateString: '', daysLeft: 0, formattedDate: 'Không hợp lệ' };

  const daysLeft = Math.max(0, Math.round((target.getTime() - todayStart.getTime()) / DAY_MS));
  const dd = String(target.getDate()).padStart(2, '0');
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const yyyy = target.getFullYear();

  return {
    solarDateString: `${yyyy}-${mm}-${dd}`,
    daysLeft,
    formattedDate: `${dd}/${mm}/${yyyy}`,
  };
}

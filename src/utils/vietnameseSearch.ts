/**
 * Vietnamese Unaccent and Smart Search Utility
 * Mô phỏng extension unaccent() của PostgreSQL trên Client
 * Hỗ trợ tìm kiếm tiếng Việt không dấu, không phân biệt hoa thường, hỗ trợ tìm nhiều từ khoá
 */

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let result = str;
  result = result.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/đ/g, 'd');
  // Combine combining diacritical marks
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return result;
}

/**
 * Kiểm tra xem text có chứa query hay không (bất kể có dấu hay không dấu)
 */
export function matchVietnamese(text: string, query: string): boolean {
  if (!query || query.trim() === '') return true;
  if (!text) return false;

  const cleanText = removeVietnameseTones(text);
  const cleanQuery = removeVietnameseTones(query.trim());

  // Tách query thành các từ đơn để tìm kiếm theo kiểu AND
  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
  return queryWords.every((word) => cleanText.includes(word));
}

/**
 * Highlight từ khoá tìm kiếm trong chuỗi văn bản
 */
export function highlightMatch(text: string, query: string): string {
  if (!query || !text) return text;
  return text;
}

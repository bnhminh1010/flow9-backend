export interface ParseResult {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
}

const expenseCategoryRules = [
  { keywords: ['ăn', 'trưa', 'sáng', 'tối', 'café', 'coffee', 'cà phê', 'uống', 'lunch', 'dinner', 'breakfast', 'bún', 'phở', 'cơm', 'cửa hàng', 'quán', 'nhà hàng', 'đồ ăn', 'thức ăn', 'bánh'], category: 'Ăn uống' },
  { keywords: ['mua', 'shopee', 'lazada', 'tiki', 'sắm', 'đặt', 'order', 'ship', 'giao hàng', 'trả', 'thanh toán', 'shopping', 'đơn hàng', 'checkout'], category: 'Mua sắm' },
  { keywords: ['xăng', 'ô tô', 'xe', 'grab', 'gojek', 'be', 'đi lại', 'taxi', 'uber', 'bus', 'tàu', 'máy bay', 'vé', 'xe bus', 'metro', 'xe máy', 'parking', 'đỗ xe', 'bảo hiểm xe', 'rửa xe', 'sửa xe'], category: 'Đi lại' },
  { keywords: ['điện', 'nước', 'wifi', 'internet', 'phone', 'mobile', 'viettel', 'vnpt', 'fpt', 'sim', 'data', '4g', '5g', 'viên pin', 'sạc', 'điện thoại'], category: 'Điện/nước' },
  { keywords: ['phim', 'netflix', 'youtube', 'spotify', 'game', 'giải trí', 'zalo', 'facebook', 'tiktok', 'instagram', 'mạng xã hội', 'nhạc', 'phim lẻ', 'phim bộ', 'box', 'steam'], category: 'Giải trí' },
  { keywords: ['nhà', 'thuê', 'rent', 'điện thuê', 'tiền nhà', 'chung cư', 'homestay', 'hotel', 'khách sạn', 'airbnb'], category: 'Nhà cửa' },
  { keywords: ['khám', 'bệnh', 'thuốc', 'hospital', 'pharmacy', 'bác sĩ', 'y tế', 'bảo hiểm', 'thuốc men', 'vitamin', 'mỹ phẩm', 'làm đẹp', 'spa', 'massage', 'tóc', 'nail'], category: 'Y tế' },
  { keywords: ['học', 'khóa', 'course', 'udemy', 'coursera', 'sách', 'trường', 'học phí', 'sinh viên', 'giáo dục', 'book', 'ebook', 'tài liệu', 'kỹ năng', 'training'], category: 'Giáo dục' },
  { keywords: ['tiền', 'ra', 'chi', 'trả', 'thanh toán', 'thuê', 'mướn', 'phí', 'charge', 'payment', 'pay', 'expense', 'spend', 'tốn', 'mất', 'bỏ ra'], category: 'Khác' },
];

const incomeCategoryRules = [
  { keywords: ['lương', 'tháng', 'salary', 'monthly', ' paycheck', 'lương tháng', 'lương thưởng'], category: 'Lương' },
  { keywords: ['thưởng', 'bonus', '奖励', 'tiền thưởng', 'thưởng tết', 'thưởng dịp'], category: 'Thưởng' },
  { keywords: ['bán', 'sell', 'bán đồ', 'flips', 'ebay', 'shopee bán'], category: 'Khác' },
  { keywords: ['lãi', 'interest', 'profit', 'lợi nhuận', 'đầu tư', 'cổ phiếu', 'chứng khoán', 'coin', 'crypto', 'bitcoin'], category: 'Khác' },
  { keywords: ['nhận', 'received', 'chuyển', 'vào', 'transfer in', 'nạp', 'deposit', 'top up'], category: 'Khác' },
  { keywords: ['công', 'làm', 'việc', 'freelance', 'contract', 'side hustle', 'remote', 'part time', 'job', 'commission', 'hoa hồng', 'phí dịch vụ', 'service fee'], category: 'Khác' },
  { keywords: ['quà', 'tặng', 'gift', 'tết', 'lì xì', 'mừng', 'đám cưới', 'sinh nhật', 'occassion'], category: 'Khác' },
  { keywords: ['hoàn', 'refund', 'trả lại', 'cashback', 'voucher', 'coupon', 'giảm giá', 'khuyến mãi', 'promotion'], category: 'Khác' },
];

function parseAmount(input: string): number | null {
  const lowerInput = input.toLowerCase();
  
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*tr(?:iệu)?/i, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*k\b/i, multiplier: 1000 },
    { regex: /(\d+(?:\.\d+)?)\s*nghìn/i, multiplier: 1000 },
    { regex: /(\d+)/, multiplier: 1 },
  ];

  for (const pattern of patterns) {
    const match = lowerInput.match(pattern.regex);
    if (match) {
      return parseFloat(match[1]) * pattern.multiplier;
    }
  }

  return null;
}

function detectCategory(input: string): { type: 'income' | 'expense'; category: string } {
  const lowerInput = input.toLowerCase();

  if (input.includes('+') || lowerInput.includes('thu') || lowerInput.includes('vào') || lowerInput.includes('nhận')) {
    for (const rule of incomeCategoryRules) {
      if (rule.keywords.some(keyword => lowerInput.includes(keyword))) {
        return { type: 'income', category: rule.category };
      }
    }
    return { type: 'income', category: 'Khác' };
  }

  if (input.includes('-') || lowerInput.includes('ra') || lowerInput.includes('chi') || lowerInput.includes('trả') || lowerInput.includes('mua')) {
    for (const rule of expenseCategoryRules) {
      if (rule.keywords.some(keyword => lowerInput.includes(keyword))) {
        return { type: 'expense', category: rule.category };
      }
    }
    return { type: 'expense', category: 'Khác' };
  }

  for (const rule of incomeCategoryRules) {
    if (rule.keywords.some(keyword => lowerInput.includes(keyword))) {
      return { type: 'income', category: rule.category };
    }
  }

  for (const rule of expenseCategoryRules) {
    if (rule.keywords.some(keyword => lowerInput.includes(keyword))) {
      return { type: 'expense', category: rule.category };
    }
  }

  return { type: 'expense', category: 'Khác' };
}

function extractDescription(input: string, amount: number): string {
  let desc = input;
  
  const amountPatterns = [
    /\s*\d+(?:\.\d+)?\s*(tr(?:iệu)?|k|nghìn|triệu)\b/i,
    /\s*\d+\s*$/,
  ];

  for (const pattern of amountPatterns) {
    desc = desc.replace(pattern, '').trim();
  }

  return desc || input;
}

export function parseNLP(input: string): ParseResult {
  if (!input || typeof input !== 'string') {
    return {
      type: 'expense',
      amount: 0,
      category: 'Khác',
      description: ''
    };
  }

  const amount = parseAmount(input);
  
  if (!amount || amount <= 0) {
    return {
      type: 'expense',
      amount: 0,
      category: 'Khác',
      description: input
    };
  }

  const { type, category } = detectCategory(input);
  const description = extractDescription(input, amount);

  return {
    type,
    amount,
    category,
    description
  };
}

export default parseNLP;

export interface ParseResult {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
}

const expenseCategoryRules = [
  { keywords: ['ăn', 'trưa', 'sáng', 'tối', 'café', 'coffee', 'uống', 'lunch', 'dinner', 'breakfast'], category: 'Ăn uống' },
  { keywords: ['mua', 'shopee', 'lazada', 'tiki', 'sắm', 'đặt'], category: 'Mua sắm' },
  { keywords: ['xăng', 'ô tô', 'xe', 'grab', 'gojek', 'be', 'đi lại', 'taxi', 'uber'], category: 'Đi lại' },
  { keywords: ['điện', 'nước', 'wifi', 'internet', 'phone', 'mobile', 'viettel', 'vnpt', 'fpt'], category: 'Điện/nước' },
  { keywords: ['phim', 'netflix', 'youtube', 'spotify', 'game', 'giải trí', 'zalo', 'facebook'], category: 'Giải trí' },
  { keywords: ['nhà', 'thuê', 'rent'], category: 'Nhà cửa' },
  { keywords: ['khám', 'bệnh', 'thuốc', 'hospital', 'pharmacy'], category: 'Y tế' },
  { keywords: ['học', 'khóa', 'course', 'udemy', 'coursera'], category: 'Giáo dục' },
];

const incomeCategoryRules = [
  { keywords: ['lương', 'tháng', 'salary', 'monthly'], category: 'Lương' },
  { keywords: ['thưởng', 'bonus', '奖励'], category: 'Thưởng' },
  { keywords: ['bán', 'sell'], category: 'Khác' },
  { keywords: ['lãi', 'interest', 'profit'], category: 'Khác' },
  { keywords: ['tiền', 'nhận', 'received'], category: 'Khác' },
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

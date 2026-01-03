
export type Platform = 'shopee' | 'tiktok';

export interface FeeStructure {
  // Shopee Specific
  shippingFeePercent: number;
  fixedFeePercent: number;
  pishipServiceFee: number; // 1620đ fixed
  infrastructureFee: number; // 3000đ fixed
  voucherExtraPercent: number;
  paymentFeePercent: number;
  taxPercent: number; // 1.5% fixed
  shopMallPercent: number;

  // TikTok Specific
  tiktokTransactionFeePercent: number; // 5% default
  tiktokOrderProcessingFee: number; // 3000đ fixed
}

export interface ProductData {
  name: string;
  quantity: number;
  sellingPrice: number;
  capitalCost: number;
  shippingFeeInternal: number; // Kho -> ĐVVC
  packagingCost: number;
  
  // Chi phí vận hành theo % doanh thu
  warehousingPercent: number;
  utilitiesPercent: number;
  staffPercent: number;

  // Marketing & Voucher
  marketingCostFixed: number; // Ngân sách ads cứng
  affiliatePercent: number; // Tiếp thị liên kết %
  adCommissionPercent: number; // Hoa hồng quảng cáo %
  voucherShop: number; // Người bán chịu
  voucherPlatform: number; // Sàn chịu
  
  otherCosts: number;
}

export interface CalculationResult {
  totalRevenue: number; // Doanh thu (Giá * SL)
  realRevenue: number; // Thực thu (Doanh thu - Voucher Shop)
  totalCapital: number; // Tổng giá vốn hàng bán
  totalPlatformFees: number; // Tổng phí sàn
  totalOperatingCosts: number; // Kho + Điện + Nhân viên
  totalMarketingCosts: number; // Ads + Affiliate + Ad Commission
  netProfit: number;
  profitMargin: number; // (Lợi nhuận / Thực thu)
  roi: number;
  breakevenPrice: number;
  isWarning: boolean;
}


import { Platform, FeeStructure } from './types';

export const DEFAULT_FEES: Record<Platform, FeeStructure> = {
  shopee: {
    shippingFeePercent: 0,
    fixedFeePercent: 5.0,
    pishipServiceFee: 1620,
    infrastructureFee: 3000,
    voucherExtraPercent: 4.0,
    paymentFeePercent: 4.0,
    taxPercent: 1.5,
    shopMallPercent: 0,
    // Unused by Shopee but kept for interface consistency
    tiktokTransactionFeePercent: 0,
    tiktokOrderProcessingFee: 0,
  },
  tiktok: {
    shippingFeePercent: 0,
    fixedFeePercent: 0,
    pishipServiceFee: 0,
    infrastructureFee: 0,
    voucherExtraPercent: 4.0, // Voucher Extra TikTok
    paymentFeePercent: 0,
    taxPercent: 0,
    shopMallPercent: 0,
    tiktokTransactionFeePercent: 5.0,
    tiktokOrderProcessingFee: 3000,
  }
};

export const PLATFORM_CONFIG = {
  shopee: {
    name: 'Shopee',
    color: 'bg-orange-500',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-600',
    icon: 'https://cdn.iconscout.com/icon/free/png-256/free-shopee-logo-icon-download-in-svg-png-gif-file-formats--brand-brands-pack-logos-icons-2263832.png',
  },
  tiktok: {
    name: 'TikTok Shop',
    color: 'bg-slate-900',
    borderColor: 'border-slate-900',
    textColor: 'text-slate-900',
    icon: 'https://cdn.iconscout.com/icon/free/png-256/free-tiktok-logo-icon-download-in-svg-png-gif-file-formats--social-media-tiktok-pack-logos-icons-2265005.png',
  }
};

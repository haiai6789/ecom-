
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Platform, 
  ProductData, 
  FeeStructure, 
  CalculationResult 
} from './types';
import { DEFAULT_FEES, PLATFORM_CONFIG } from './constants';
import InputGroup from './components/InputGroup';
import ResultCard from './components/ResultCard';
import { getAIInsights } from './services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const App: React.FC = () => {
  const [platform, setPlatform] = useState<Platform>('shopee');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  
  const [product, setProduct] = useState<ProductData>({
    name: '',
    quantity: 1,
    sellingPrice: 500000,
    capitalCost: 200000,
    shippingFeeInternal: 5000,
    packagingCost: 3000,
    warehousingPercent: 2,
    utilitiesPercent: 1,
    staffPercent: 5,
    marketingCostFixed: 30000,
    affiliatePercent: 10,
    adCommissionPercent: 2,
    voucherShop: 20000,
    voucherPlatform: 50000,
    otherCosts: 0,
  });

  const [fees, setFees] = useState<FeeStructure>(DEFAULT_FEES.shopee);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (!isComparisonMode) {
      setFees(DEFAULT_FEES[platform]);
    }
  }, [platform, isComparisonMode]);

  const calculateForPlatform = (p: Platform, customFees?: FeeStructure) => {
    const f = customFees || DEFAULT_FEES[p];
    const { 
      quantity, sellingPrice, capitalCost, shippingFeeInternal, 
      packagingCost, warehousingPercent, utilitiesPercent, staffPercent,
      marketingCostFixed, affiliatePercent, adCommissionPercent, 
      voucherShop, otherCosts 
    } = product;
    
    const grossRevenue = sellingPrice * quantity;
    const realRevenue = grossRevenue - voucherShop;
    
    // Phí sàn
    let platformFees = 0;
    if (p === 'shopee') {
      const varFees = (f.shippingFeePercent + f.fixedFeePercent + f.voucherExtraPercent + f.paymentFeePercent + f.taxPercent + f.shopMallPercent) / 100;
      platformFees = (grossRevenue * varFees) + (f.pishipServiceFee * quantity) + (f.infrastructureFee * quantity);
    } else {
      const varFees = (f.shippingFeePercent + f.tiktokTransactionFeePercent + f.voucherExtraPercent + f.shopMallPercent) / 100;
      platformFees = (grossRevenue * varFees) + (f.tiktokOrderProcessingFee * quantity);
    }

    // Chi phí vận hành (Kho, Điện, Nhân viên) - tính theo % Thực thu
    const operatingCosts = realRevenue * (warehousingPercent + utilitiesPercent + staffPercent) / 100;

    // Chi phí Marketing (Ads + Affiliate + Ad Commission)
    const marketingCosts = marketingCostFixed + (realRevenue * (affiliatePercent + adCommissionPercent) / 100);

    // Tổng giá vốn (COGS)
    const totalCapital = (capitalCost + packagingCost + shippingFeeInternal + otherCosts) * quantity;

    // Lợi nhuận ròng
    const netProfit = realRevenue - totalCapital - platformFees - operatingCosts - marketingCosts;
    
    // Tỷ suất LN trên Thực thu
    const profitMargin = realRevenue > 0 ? (netProfit / realRevenue) * 100 : 0;
    const roi = totalCapital > 0 ? (netProfit / totalCapital) * 100 : 0;

    // Giá hòa vốn ước tính (Cơ bản)
    // P*Qty - Fees(P) - Ops(P) - Mkt(P) = COGS
    // Đây là ước tính đơn giản vì nhiều phí tính theo % Doanh thu
    const totalPercentDeductions = (p === 'shopee' 
      ? (f.shippingFeePercent + f.fixedFeePercent + f.voucherExtraPercent + f.paymentFeePercent + f.taxPercent + f.shopMallPercent)
      : (f.shippingFeePercent + f.tiktokTransactionFeePercent + f.voucherExtraPercent + f.shopMallPercent)
    ) + warehousingPercent + utilitiesPercent + staffPercent + affiliatePercent + adCommissionPercent;
    
    const deductionRate = totalPercentDeductions / 100;
    const fixedPlatformFees = p === 'shopee' 
      ? (f.pishipServiceFee + f.infrastructureFee) * quantity 
      : f.tiktokOrderProcessingFee * quantity;

    const breakevenPrice = (1 - deductionRate) > 0 
      ? (totalCapital + marketingCostFixed + fixedPlatformFees + voucherShop * (1 - deductionRate)) / (quantity * (1 - deductionRate))
      : 0;

    return {
      totalRevenue: grossRevenue,
      realRevenue,
      totalCapital,
      totalPlatformFees: platformFees,
      totalOperatingCosts: operatingCosts,
      totalMarketingCosts: marketingCosts,
      netProfit,
      profitMargin,
      roi,
      breakevenPrice,
      isWarning: profitMargin < 20,
    };
  };

  const calculation = useMemo(() => calculateForPlatform(platform, fees), [product, fees, platform]);
  const tiktokCompare = useMemo(() => calculateForPlatform('tiktok'), [product]);
  const shopeeCompare = useMemo(() => calculateForPlatform('shopee'), [product]);

  const handleFetchAi = async () => {
    setIsAiLoading(true);
    setAiInsight(null);
    try {
      const insight = await getAIInsights(platform, product, calculation as any);
      setAiInsight(insight);
    } catch (e) {
      setAiInsight("Lỗi kết nối AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const chartData = [
    { name: 'Giá vốn', value: calculation.totalCapital, color: '#6366f1' },
    { name: 'Phí sàn', value: calculation.totalPlatformFees, color: '#f59e0b' },
    { name: 'Vận hành', value: calculation.totalOperatingCosts, color: '#94a3b8' },
    { name: 'Marketing', value: calculation.totalMarketingCosts, color: '#ec4899' },
    { name: 'Lợi nhuận', value: Math.max(0, calculation.netProfit), color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">E-Com Auditor <span className="text-indigo-600">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setIsComparisonMode(!isComparisonMode)}
              className={`hidden md:block px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isComparisonMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              So sánh sàn
            </button>
            {!isComparisonMode && (['shopee', 'tiktok'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${platform === p ? `${PLATFORM_CONFIG[p].color} text-white shadow-md` : 'text-slate-500'}`}
              >
                {PLATFORM_CONFIG[p].name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cột nhập liệu */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Chi phí đơn hàng & Vận hành
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Số lượng" value={product.quantity} onChange={(v) => setProduct({...product, quantity: v})} suffix="Cái" step={1} />
                <InputGroup label="Giá bán/SP" value={product.sellingPrice} onChange={(v) => setProduct({...product, sellingPrice: v})} />
              </div>
              <InputGroup label="Giá vốn/SP" value={product.capitalCost} onChange={(v) => setProduct({...product, capitalCost: v})} />
              <div className="grid grid-cols-3 gap-2">
                <InputGroup label="Kho bãi" value={product.warehousingPercent} suffix="%" step={0.1} onChange={(v) => setProduct({...product, warehousingPercent: v})} />
                <InputGroup label="Điện nước" value={product.utilitiesPercent} suffix="%" step={0.1} onChange={(v) => setProduct({...product, utilitiesPercent: v})} />
                <InputGroup label="Nhân viên" value={product.staffPercent} suffix="%" step={0.1} onChange={(v) => setProduct({...product, staffPercent: v})} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <InputGroup label="Đóng gói" value={product.packagingCost} onChange={(v) => setProduct({...product, packagingCost: v})} />
                <InputGroup label="Vận chuyển kho" value={product.shippingFeeInternal} onChange={(v) => setProduct({...product, shippingFeeInternal: v})} />
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Marketing & Voucher
              </h2>
              <InputGroup label="Ads cố định" value={product.marketingCostFixed} onChange={(v) => setProduct({...product, marketingCostFixed: v})} />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Affiliate" value={product.affiliatePercent} suffix="%" step={0.1} onChange={(v) => setProduct({...product, affiliatePercent: v})} />
                <InputGroup label="HH Quảng cáo" value={product.adCommissionPercent} suffix="%" step={0.1} onChange={(v) => setProduct({...product, adCommissionPercent: v})} />
              </div>
              <InputGroup label="Voucher Shop chịu" value={product.voucherShop} onChange={(v) => setProduct({...product, voucherShop: v})} />
            </section>

            {!isComparisonMode && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Cấu hình phí {PLATFORM_CONFIG[platform].name}</h2>
                {platform === 'shopee' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Phí vận chuyển" value={fees.shippingFeePercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, shippingFeePercent: v})} />
                      <InputGroup label="Phí cố định" value={fees.fixedFeePercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, fixedFeePercent: v})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Dịch vụ Piship" value={fees.pishipServiceFee} step={1} onChange={(v) => setFees({...fees, pishipServiceFee: v})} />
                      <InputGroup label="Phí hạ tầng" value={fees.infrastructureFee} step={1} onChange={(v) => setFees({...fees, infrastructureFee: v})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Voucher Extra" value={fees.voucherExtraPercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, voucherExtraPercent: v})} />
                      <InputGroup label="Phí thanh toán" value={fees.paymentFeePercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, paymentFeePercent: v})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Thuế TNCN" value={fees.taxPercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, taxPercent: v})} />
                      <InputGroup label="Shop Mall" value={fees.shopMallPercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, shopMallPercent: v})} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Phí vận chuyển" value={fees.shippingFeePercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, shippingFeePercent: v})} />
                      <InputGroup label="Phí giao dịch" value={fees.tiktokTransactionFeePercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, tiktokTransactionFeePercent: v})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Voucher Extra" value={fees.voucherExtraPercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, voucherExtraPercent: v})} />
                      <InputGroup label="Shop Mall" value={fees.shopMallPercent} suffix="%" step={0.1} onChange={(v) => setFees({...fees, shopMallPercent: v})} />
                    </div>
                    <InputGroup label="Phí xử lý đơn" value={fees.tiktokOrderProcessingFee} step={1} onChange={(v) => setFees({...fees, tiktokOrderProcessingFee: v})} />
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Cột kết quả */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-6 rounded-3xl border-2 transition-all ${calculation.isWarning ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Lợi nhuận ròng</p>
                <h3 className={`text-3xl font-black ${calculation.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {Math.round(calculation.netProfit).toLocaleString()} <span className="text-sm font-normal">đ</span>
                </h3>
                <p className="text-[10px] mt-2 font-medium opacity-70">Tổng LN cho {product.quantity} sản phẩm</p>
              </div>

              <div className={`p-6 rounded-3xl border-2 transition-all ${calculation.isWarning ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Biên lợi nhuận</p>
                <h3 className={`text-3xl font-black ${calculation.isWarning ? 'text-amber-700' : 'text-slate-800'}`}>
                  {calculation.profitMargin.toFixed(1)}%
                </h3>
                {calculation.isWarning && (
                  <p className="text-[10px] mt-2 font-bold text-rose-600 uppercase flex items-center gap-1 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Cảnh báo rủi ro (&lt;20%)
                  </p>
                )}
              </div>

              <div className="p-6 rounded-3xl bg-indigo-50 border-2 border-indigo-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Giá hòa vốn / SP</p>
                <h3 className="text-3xl font-black text-indigo-700">
                  {Math.round(calculation.breakevenPrice).toLocaleString()} <span className="text-sm font-normal">đ</span>
                </h3>
                <p className="text-[10px] mt-2 font-medium text-indigo-400">Đã gồm phí sàn & vận hành %</p>
              </div>
            </div>

            {isComparisonMode && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <h2 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Dashboard So sánh Shopee vs TikTok Shop</h2>
                <div className="grid grid-cols-2 gap-8 relative">
                   <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100"></div>
                   
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <img src={PLATFORM_CONFIG.shopee.icon} className="w-5 h-5 object-contain" alt="" />
                        <span className="font-bold text-orange-600 uppercase text-[10px] tracking-widest">Shopee</span>
                      </div>
                      <ResultRow label="Thực thu" value={shopeeCompare.realRevenue} />
                      <ResultRow label="Phí sàn" value={shopeeCompare.totalPlatformFees} color="text-rose-500" />
                      <ResultRow label="Lợi nhuận" value={shopeeCompare.netProfit} highlight />
                      <ResultRow label="Biên LN" value={`${shopeeCompare.profitMargin.toFixed(1)}%`} />
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <img src={PLATFORM_CONFIG.tiktok.icon} className="w-5 h-5 object-contain" alt="" />
                        <span className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">TikTok Shop</span>
                      </div>
                      <ResultRow label="Thực thu" value={tiktokCompare.realRevenue} />
                      <ResultRow label="Phí sàn" value={tiktokCompare.totalPlatformFees} color="text-rose-500" />
                      <ResultRow label="Lợi nhuận" value={tiktokCompare.netProfit} highlight />
                      <ResultRow label="Biên LN" value={`${tiktokCompare.profitMargin.toFixed(1)}%`} />
                   </div>
                </div>
              </div>
            )}

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest">Cấu trúc dòng tiền ({PLATFORM_CONFIG[platform].name})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => Math.round(v).toLocaleString() + ' đ'} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tổng chi phí</span>
                    <span className="text-sm font-black text-slate-700">{(calculation.totalCapital + calculation.totalPlatformFees + calculation.totalOperatingCosts + calculation.totalMarketingCosts).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded-2xl bg-indigo-50/50">
                    <span className="text-xs font-bold text-slate-500">Doanh thu thực thu</span>
                    <span className="text-xs font-black text-slate-800">{Math.round(calculation.realRevenue).toLocaleString()} đ</span>
                  </div>
                  <LegendItem label="Giá vốn COGS" value={calculation.totalCapital} color="bg-[#6366f1]" />
                  <LegendItem label="Phí sàn ước tính" value={calculation.totalPlatformFees} color="bg-[#f59e0b]" />
                  <LegendItem label="Vận hành (Kho/Nhân viên)" value={calculation.totalOperatingCosts} color="bg-[#94a3b8]" />
                  <LegendItem label="Marketing (Ads/Affiliate)" value={calculation.totalMarketingCosts} color="bg-[#ec4899]" />
                </div>
              </div>
            </div>

            {/* AI Advisor */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Z"/><path d="M8.5 14h.01"/><path d="M15.5 14h.01"/><path d="M12 18s-2-1-2-2.5"/></svg>
                      </div>
                      <h3 className="text-lg font-black italic tracking-tight uppercase">Trợ lý Chiến lược AI</h3>
                    </div>
                    <button 
                      onClick={handleFetchAi}
                      disabled={isAiLoading}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-lg shadow-indigo-900/40"
                    >
                      {isAiLoading ? 'ĐANG PHÂN TÍCH...' : 'NHẬN TƯ VẤN THỰC CHIẾN'}
                    </button>
                  </div>
                  
                  {aiInsight ? (
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 animate-fade-in backdrop-blur-sm">
                      <div className="prose prose-invert prose-xs max-w-none prose-indigo">
                        <div dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br/>') }} className="leading-relaxed text-slate-300" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-center py-4 text-xs">Click nút để AI phân tích cấu trúc chi phí chuyên sâu (Piship, Hạ tầng, Ops, Mkt...)</p>
                  )}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

const ResultRow = ({ label, value, color = "text-slate-600", highlight = false }: { label: string, value: string | number, color?: string, highlight?: boolean }) => (
  <div className={`flex justify-between items-center py-2 ${highlight ? 'bg-slate-50 px-2 rounded-lg' : ''}`}>
    <span className="text-[10px] font-medium text-slate-500">{label}</span>
    <span className={`text-[11px] font-black ${color} ${highlight ? 'text-indigo-600' : ''}`}>
      {typeof value === 'number' ? Math.round(value).toLocaleString() : value} {typeof value === 'number' ? 'đ' : ''}
    </span>
  </div>
);

const LegendItem = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="flex justify-between p-2">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>
    <span className="text-[10px] font-bold text-slate-700">{Math.round(value).toLocaleString()} đ</span>
  </div>
);

export default App;


import { GoogleGenAI, Type } from "@google/genai";
import { ProductData, CalculationResult, Platform } from "../types";

export const getAIInsights = async (
  platform: Platform,
  data: ProductData,
  result: CalculationResult
): Promise<string> => {
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Dưới đây là dữ liệu kinh doanh của một sản phẩm trên sàn ${platform.toUpperCase()}:
    
    Thông tin sản phẩm:
    - Giá bán: ${data.sellingPrice.toLocaleString()} VNĐ
    - Giá vốn: ${data.capitalCost.toLocaleString()} VNĐ
    // Fix: Using result.totalMarketingCosts instead of non-existent data.marketingCost
    - Chi phí Marketing: ${result.totalMarketingCosts.toLocaleString()} VNĐ
    - Lợi nhuận ròng: ${result.netProfit.toLocaleString()} VNĐ
    - Tỷ suất lợi nhuận: ${result.profitMargin.toFixed(2)}%
    - ROI: ${result.roi.toFixed(2)}%
    - Tổng phí sàn (Thanh toán + Hoa hồng + Dịch vụ): ${result.totalPlatformFees.toLocaleString()} VNĐ

    Hãy đóng vai một chuyên gia tư vấn tài chính E-commerce giàu kinh nghiệm. Hãy phân tích các con số này và đưa ra 3-4 lời khuyên cụ thể (ngắn gọn, súc tích bằng tiếng Việt) để tối ưu hóa lợi nhuận cho nhà bán hàng này. Tập trung vào việc giảm chi phí nào là quan trọng nhất hoặc liệu giá bán có đang quá thấp hay không. Trình bày dưới dạng Markdown.
  `;

  try {
    // Generate content using gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // Access text property directly from GenerateContentResponse
    return response.text || "Không thể lấy thông tin tư vấn lúc này.";
  } catch (error) {
    console.error("AI Insights Error:", error);
    return "Có lỗi xảy ra khi kết nối với AI chuyên gia.";
  }
};

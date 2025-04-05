// === دمج وتنفيذ نظام حساب الأرباح النسبية في التطبيق ===

/**
 * تهيئة نظام حساب الأرباح النسبية
 */
function initProportionalProfitSystem() {
  // تطبيق التعديلات على صفحة تفاصيل المستثمر
  enhanceInvestorDetailsPage();
  
  // تطبيق التعديلات على نموذج المعاملات
  enhanceTransactionModal();
  
  // إضافة مكون تحليل الأرباح للوحة التحكم
  addProfitAnalysisWidgetToHome();
  
  // تعديل أنواع المعاملات لدعم عمليات السحب
  enhanceTransactionTypes();
  
  // تعديل حساب الأرباح المتوقعة في منطق التطبيق
  enhanceProfitCalculations();
  
  // إضافة قسم تقارير الأرباح المفصلة
  enhanceProfitReporting();
  
  console.log('تم تهيئة نظام حساب الأرباح النسبية بنجاح');
}

/**
 * تعديل حساب الأرباح المتوقعة في منطق التطبيق
 */
function enhanceProfitCalculations() {
  // تعديل دالة حساب الربح الشهري
  const originalCalculateMonthlyProfit = calculateMonthlyProfit;
  
  calculateMonthlyProfit = function(amount, investorId = null) {
    // إذا لم يتم تمرير معرف المستثمر، استخدم الطريقة البسيطة القديمة
    if (!investorId) {
      return originalCalculateMonthlyProfit(amount);
    }
    
    // الحصول على التاريخ الحالي
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // حساب الربح النسبي بناءً على رصيد المستثمر الحالي
    const profitAnalysis = calculateInvestorMonthlyProfit(
      transactions,
      investorId,
      currentYear,
      currentMonth,
      profitRate
    );
    
    return profitAnalysis.proportionalProfit;
  };
  
  // تعديل دالة حساب إجمالي الاستثمارات
  recalculateSummary = function() {
    dailySummary = {
      totalInvestments: 0,
      totalPayouts: 0,
      adminExpenses: 0
    };
    
    // حساب إجمالي مبالغ الاستثمارات من أرصدة المستثمرين الحالية
    dailySummary.totalInvestments = investors.reduce((sum, investor) => sum + investor.amount, 0);
    
    // حساب إجمالي المدفوعات والمصروفات من المعاملات
    for (const trans of transactions) {
      if (trans.type === 'payout') {
        dailySummary.totalPayouts += trans.amount;
      } else if (trans.type === 'admin') {
        dailySummary.adminExpenses += trans.amount;
      }
    }
  };
}

/**
 * تعزيز تقارير الأرباح
 */
function enhanceProfitReporting() {
  // إضافة زر لعرض التقارير المفصلة في صفحة التقارير
  const originalRenderReportsPage = renderReportsPage;
  
  renderReportsPage = function() {
    // استدعاء الدالة الأصلية
    originalRenderReportsPage();
    
    // إضافة قسم تقارير الأرباح المفصلة
    const mainContent = document.getElementById('main-content');
    const container = mainContent.querySelector('.container');
    
    if (container) {
      const profitReportSection = document.createElement('div');
      profitReportSection.className = 'card p-4 mb-4';
      profitReportSection.innerHTML = `
        <h2 class="font-bold mb-3 flex items-center gap-2">
          <i class="fas fa-chart-line text-blue-600"></i>
          تقارير الأرباح المفصلة
        </h2>
        
        <div class="grid grid-cols-1 gap-3">
          <button class="btn btn-primary" id="detailed-profit-report-btn">
            <i class="fas fa-file-alt ml-1"></i>
            عرض تقرير الأرباح الشهرية المفصل
          </button>
          
          <button class="btn btn-secondary" id="profit-forecast-report-btn">
            <i class="fas fa-chart-line ml-1"></i>
            تقرير توقعات الأرباح المستقبلية
          </button>
        </div>
      `;
      
      // إضافة القسم في بداية الصفحة
      if (container.firstChild) {
        container.insertBefore(profitReportSection, container.firstChild);
      } else {
        container.appendChild(profitReportSection);
      }
      
      // إضافة مستمعي الأحداث
      setTimeout(() => {
        document.getElementById('detailed-profit-report-btn')?.addEventListener('click', showDetailedProfitAnalysisReport);
        document.getElementById('profit-forecast-report-btn')?.addEventListener('click', showProfitForecastReport);
      }, 100);
    }
  };
}

/**
 * عرض تقرير توقعات الأرباح المستقبلية
 */
function showProfitForecastReport() {
  // إنشاء نافذة منبثقة لعرض التقرير
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.id = 'profit-forecast-modal';
  
  // إنشاء محتوى النافذة
  modalOverlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">توقعات الأرباح المستقبلية</h2>
        <button class="modal-close" id="close-forecast-modal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="mb-4">
          <div class="alert alert-info">
            <i class="fas fa-info-circle text-blue-600"></i>
            <div>
              <p>هذه التوقعات مبنية على أرصدة المستثمرين الحالية وأنماط المعاملات السابقة.</p>
              <p class="text-sm mt-1">ملاحظة: التوقعات قد تتغير بناءً على الإيداعات والسحوبات المستقبلية.</p>
            </div>
          </div>
          
          <div class="card mt-3 p-3">
            <h3 class="font-bold mb-2">ملخص توقعات الأرباح</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-sm text-gray-500">الشهر الحالي</p>
                <p id="current-month-forecast" class="font-bold">جاري الحساب...</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">الشهر القادم</p>
                <p id="next-month-forecast" class="font-bold">جاري الحساب...</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">متوقع لثلاثة أشهر</p>
                <p id="three-month-forecast" class="font-bold">جاري الحساب...</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">متوقع لستة أشهر</p>
                <p id="six-month-forecast" class="font-bold">جاري الحساب...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="font-bold mb-2">توقعات الأرباح حسب المستثمر</h3>
          <div id="investor-forecasts-container">
            جاري تحميل البيانات...
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-gray" id="close-forecast-btn">
          إغلاق
        </button>
        <button class="btn btn-primary" id="export-forecast-btn">
          <i class="fas fa-file-export ml-1"></i>
          تصدير التوقعات
        </button>
      </div>
    </div>
  `;
  
  // إضافة النافذة إلى body
  document.body.appendChild(modalOverlay);
  
  // إظهار النافذة
  setTimeout(() => {
    modalOverlay.classList.add('visible');
    
    // إعداد مستمعي الأحداث
    document.getElementById('close-forecast-modal').addEventListener('click', () => {
      hideModal('profit-forecast-modal');
    });
    
    document.getElementById('close-forecast-btn').addEventListener('click', () => {
      hideModal('profit-forecast-modal');
    });
    
    document.getElementById('export-forecast-btn').addEventListener('click', exportForecastReport);
    
    // تحميل بيانات التوقعات
    loadProfitForecastData();
  }, 10);
}

/**
 * تحميل بيانات توقعات الأرباح
 */
function loadProfitForecastData() {
  // الحصول على التاريخ الحالي
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  // حساب إجمالي الأرباح المتوقعة
  let currentMonthTotal = 0;
  let nextMonthTotal = 0;
  let threeMonthTotal = 0;
  let sixMonthTotal = 0;
  
  // جمع توقعات المستثمرين
  const investorForecasts = [];
  
  for (const investor of investors) {
    // حساب الربح المتوقع للشهر الحالي
    const currentMonthProfit = calculateInvestorMonthlyProfit(
      transactions,
      investor.id,
      currentYear,
      currentMonth,
      profitRate
    ).proportionalProfit;
    
    // توقع الربح للشهر القادم (بافتراض استمرار المبلغ الحالي)
    const nextMonthProfit = currentMonthProfit;
    
    // التوقع لثلاثة أشهر وستة أشهر (بافتراض عدم وجود إيداعات أو سحوبات جديدة)
    const threeMonthProfit = currentMonthProfit * 3;
    const sixMonthProfit = currentMonthProfit * 6;
    
    // إضافة إلى الإجماليات
    currentMonthTotal += currentMonthProfit;
    nextMonthTotal += nextMonthProfit;
    threeMonthTotal += threeMonthProfit;
    sixMonthTotal += sixMonthProfit;
    
    // حفظ التوقعات لهذا المستثمر
    investorForecasts.push({
      investor,
      currentMonthProfit,
      nextMonthProfit,
      threeMonthProfit,
      sixMonthProfit
    });
  }
  
  // تحديث ملخص التوقعات
  document.getElementById('current-month-forecast').textContent = `${numberWithCommas(Math.round(currentMonthTotal))} د.ع`;
  document.getElementById('next-month-forecast').textContent = `${numberWithCommas(Math.round(nextMonthTotal))} د.ع`;
  document.getElementById('three-month-forecast').textContent = `${numberWithCommas(Math.round(threeMonthTotal))} د.ع`;
  document.getElementById('six-month-forecast').textContent = `${numberWithCommas(Math.round(sixMonthTotal))} د.ع`;
  
  // ترتيب المستثمرين حسب الربح (تنازلي)
  investorForecasts.sort((a, b) => b.currentMonthProfit - a.currentMonthProfit);
  
  // عرض توقعات كل مستثمر
  const container = document.getElementById('investor-forecasts-container');
  if (container) {
    let html = '';
    
    for (const forecast of investorForecasts) {
      html += `
        <div class="card mb-2 p-3">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2">
              <div class="badge badge-primary">${forecast.investor.name.charAt(0)}</div>
              <h4 class="font-bold">${forecast.investor.name}</h4>
            </div>
            <p class="text-sm text-gray-500">الرصيد: ${numberWithCommas(forecast.investor.amount)} د.ع</p>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-xs text-gray-500">الشهر الحالي</p>
              <p class="font-bold">${numberWithCommas(Math.round(forecast.currentMonthProfit))} د.ع</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">الشهر القادم</p>
              <p class="font-bold">${numberWithCommas(Math.round(forecast.nextMonthProfit))} د.ع</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">3 أشهر</p>
              <p class="font-bold">${numberWithCommas(Math.round(forecast.threeMonthProfit))} د.ع</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">6 أشهر</p>
              <p class="font-bold">${numberWithCommas(Math.round(forecast.sixMonthProfit))} د.ع</p>
            </div>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html || 'لا توجد بيانات للمستثمرين.';
  }
}

/**
 * تصدير تقرير توقعات الأرباح
 */
function exportForecastReport() {
  // إنشاء نص التقرير
  let reportText = 'تقرير توقعات الأرباح المستقبلية\n';
  reportText += '==============================\n\n';
  
  // إضافة التاريخ
  reportText += `التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n\n`;
  
  // إضافة ملخص التوقعات
  reportText += 'ملخص توقعات الأرباح:\n';
  reportText += '--------------------\n';
  
  // حساب إجمالي الأرباح المتوقعة
  let currentMonthTotal = 0;
  let nextMonthTotal = 0;
  let threeMonthTotal = 0;
  let sixMonthTotal = 0;
  
  // جمع توقعات المستثمرين
  const investorForecasts = [];
  
  for (const investor of investors) {
    // حساب الربح المتوقع للشهر الحالي
    const currentMonthProfit = calculateInvestorMonthlyProfit(
      transactions,
      investor.id,
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      profitRate
    ).proportionalProfit;
    
    // توقع الربح للشهر القادم (بافتراض استمرار المبلغ الحالي)
    const nextMonthProfit = currentMonthProfit;
    
    // التوقع لثلاثة أشهر وستة أشهر (بافتراض عدم وجود إيداعات أو سحوبات جديدة)
    const threeMonthProfit = currentMonthProfit * 3;
    const sixMonthProfit = currentMonthProfit * 6;
    
    // إضافة إلى الإجماليات
    currentMonthTotal += currentMonthProfit;
    nextMonthTotal += nextMonthProfit;
    threeMonthTotal += threeMonthProfit;
    sixMonthTotal += sixMonthProfit;
    
    // حفظ التوقعات لهذا المستثمر
    investorForecasts.push({
      investor,
      currentMonthProfit,
      nextMonthProfit,
      threeMonthProfit,
      sixMonthProfit
    });
  }
  
  reportText += `الشهر الحالي: ${numberWithCommas(Math.round(currentMonthTotal))} د.ع\n`;
  reportText += `الشهر القادم: ${numberWithCommas(Math.round(nextMonthTotal))} د.ع\n`;
  reportText += `ثلاثة أشهر: ${numberWithCommas(Math.round(threeMonthTotal))} د.ع\n`;
  reportText += `ستة أشهر: ${numberWithCommas(Math.round(sixMonthTotal))} د.ع\n\n`;
  
  // إضافة توقعات كل مستثمر
  reportText += 'توقعات الأرباح حسب المستثمر:\n';
  reportText += '----------------------------\n\n';
  
  // ترتيب المستثمرين حسب الربح (تنازلي)
  investorForecasts.sort((a, b) => b.currentMonthProfit - a.currentMonthProfit);
  
  for (const forecast of investorForecasts) {
    reportText += `المستثمر: ${forecast.investor.name}\n`;
    reportText += `الرصيد الحالي: ${numberWithCommas(forecast.investor.amount)} د.ع\n`;
    reportText += `الشهر الحالي: ${numberWithCommas(Math.round(forecast.currentMonthProfit))} د.ع\n`;
    reportText += `الشهر القادم: ${numberWithCommas(Math.round(forecast.nextMonthProfit))} د.ع\n`;
    reportText += `ثلاثة أشهر: ${numberWithCommas(Math.round(forecast.threeMonthProfit))} د.ع\n`;
    reportText += `ستة أشهر: ${numberWithCommas(Math.round(forecast.sixMonthProfit))} د.ع\n\n`;
  }
  
  // إنشاء رابط التنزيل
  const blob = new Blob([reportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `توقعات_الأرباح_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  
  // تحرير الموارد
  URL.revokeObjectURL(url);
  
  // عرض إشعار
  showNotification('تم تصدير تقرير التوقعات بنجاح', 'success');
}

// تعديل وظيفة تهيئة التطبيق للاستفادة من نظام حساب الأرباح النسبية
const originalInitApp = initApp;

initApp = function() {
  // استدعاء الدالة الأصلية
  originalInitApp();
  
  // تهيئة نظام حساب الأرباح النسبية
  initProportionalProfitSystem();
  
  console.log('تم تهيئة التطبيق مع نظام حساب الأرباح النسبية');
};

// ملاحظة: لضمان أن هذه التغييرات تطبق عند تحميل الصفحة،
// يجب تضمين هذا الملف بعد ملف JavaScript الرئيسي
// === إضافة مكون تحليل الأرباح للوحة التحكم الرئيسية ===

/**
 * إضافة قسم تحليل الأرباح للوحة التحكم الرئيسية
 */
function addProfitAnalysisWidgetToHome() {
  // تعديل دالة renderHomePage
  const originalRenderHomePage = renderHomePage;
  
  renderHomePage = function() {
    // استدعاء الدالة الأصلية أولاً
    originalRenderHomePage();
    
    // إضافة قسم تحليل الأرباح إذا كان هناك مستثمرين
    if (investors.length > 0) {
      // الحصول على عنصر dashboard-main
      const dashboardMain = document.querySelector('.dashboard-main');
      if (!dashboardMain) return;
      
      // إنشاء قسم تحليل الأرباح
      const profitAnalysisWidget = createProfitAnalysisWidget();
      
      // إضافة القسم بعد رأس اللوحة وقبل بطاقات الإحصائيات
      const statsGrid = dashboardMain.querySelector('.stats-grid');
      if (statsGrid) {
        dashboardMain.insertBefore(profitAnalysisWidget, statsGrid);
      }
    }
  };
}

/**
 * إنشاء مكون تحليل الأرباح
 * @returns {HTMLElement} عنصر HTML يمثل مكون تحليل الأرباح
 */
function createProfitAnalysisWidget() {
  // إنشاء عنصر div للمكون
  const widget = document.createElement('div');
  widget.className = 'dashboard-section profit-analysis-widget mb-4';
  
  // الحصول على التاريخ الحالي
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // getMonth() يبدأ من 0
  const currentDay = today.getDate();
  
  // حساب إجمالي الأرباح المتوقعة لجميع المستثمرين
  let totalMonthlyProfit = 0;
  let totalDailyProfit = 0;
  let totalProfitToDate = 0;
  
  for (const investor of investors) {
    const profitAnalysis = calculateInvestorMonthlyProfit(
      transactions, 
      investor.id, 
      currentYear, 
      currentMonth, 
      profitRate
    );
    
    totalMonthlyProfit += profitAnalysis.proportionalProfit;
    totalDailyProfit += profitAnalysis.proportionalProfit / profitAnalysis.daysInMonth;
    
    // حساب الربح حتى اليوم الحالي
    const balancesUntilToday = profitAnalysis.dailyBalances.slice(0, currentDay);
    const avgBalanceToDate = balancesUntilToday.reduce((sum, bal) => sum + bal, 0) / balancesUntilToday.length;
    const profitRateDecimal = profitRate / (100 * 12); // تحويل النسبة السنوية إلى نسبة يومية
    
    totalProfitToDate += avgBalanceToDate * profitRateDecimal * currentDay;
  }
  
  // تحديد الفرق بين الأرباح المتوقعة والمدفوعة هذا الشهر
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const payoutThisMonth = transactions
    .filter(t => t.type === 'payout' && new Date(t.date) >= startOfMonth && new Date(t.date) <= today)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const remainingPayouts = Math.max(0, totalProfitToDate - payoutThisMonth);
  
  // إنشاء HTML للمكون
  widget.innerHTML = `
    <div class="section-header">
      <h2>تحليل الأرباح</h2>
      <span class="badge badge-green">${getCurrentMonthName()}</span>
    </div>
    
    <div class="profit-analysis-container">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="card-blue-light p-4 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold flex items-center gap-2">
              <i class="fas fa-calendar-alt text-blue-600"></i>
              الأرباح الشهرية
            </h3>
            <span class="text-sm text-gray-500">شهر ${getCurrentMonthName()}</span>
          </div>
          <div class="text-2xl font-bold text-blue-600">${numberWithCommas(Math.round(totalMonthlyProfit))} د.ع</div>
          <div class="text-sm text-gray-500 mt-1">إجمالي الأرباح المتوقعة لجميع المستثمرين</div>
        </div>
        
        <div class="card-green-light p-4 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold flex items-center gap-2">
              <i class="fas fa-calendar-day text-green-600"></i>
              الأرباح اليومية
            </h3>
            <span class="text-sm text-gray-500">معدل يومي</span>
          </div>
          <div class="text-2xl font-bold text-green-600">${numberWithCommas(Math.round(totalDailyProfit))} د.ع</div>
          <div class="text-sm text-gray-500 mt-1">متوسط الأرباح اليومية لجميع المستثمرين</div>
        </div>
        
        <div class="card-yellow-light p-4 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold flex items-center gap-2">
              <i class="fas fa-money-bill-wave text-yellow-600"></i>
              مستحقات الدفع
            </h3>
            <span class="text-sm text-gray-500">حتى الآن</span>
          </div>
          <div class="text-2xl font-bold text-yellow-600">${numberWithCommas(Math.round(remainingPayouts))} د.ع</div>
          <div class="text-sm text-gray-500 mt-1">المبلغ المستحق دفعه حتى تاريخ اليوم</div>
        </div>
      </div>
      
      <div class="mt-3">
        <button id="view-profit-details" class="btn btn-outline-primary w-full">
          <i class="fas fa-chart-line ml-1"></i>
          عرض تقرير تحليل الأرباح المفصل
        </button>
      </div>
    </div>
  `;
  
  // إضافة مستمع حدث لزر عرض التقرير المفصل (سيتم تنفيذه لاحقًا)
  setTimeout(() => {
    const detailsButton = document.getElementById('view-profit-details');
    if (detailsButton) {
      detailsButton.addEventListener('click', showDetailedProfitAnalysisReport);
    }
  }, 100);
  
  return widget;
}

/**
 * عرض تقرير تحليل الأرباح المفصل
 */
function showDetailedProfitAnalysisReport() {
  // إنشاء نافذة منبثقة لعرض التقرير
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.id = 'profit-analysis-report-modal';
  
  // إنشاء محتوى النافذة
  modalOverlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">تقرير تحليل الأرباح المفصل</h2>
        <button class="modal-close" id="close-profit-report-modal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="mb-4">
          <h3 class="font-bold mb-3">ملخص الأرباح الشهرية</h3>
          <div id="profit-summary-container">
            جاري تحميل البيانات...
          </div>
        </div>
        
        <div>
          <h3 class="font-bold mb-3">تفاصيل الأرباح حسب المستثمر</h3>
          <div id="profit-details-container">
            جاري تحميل البيانات...
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-gray" id="close-report-btn">
          إغلاق
        </button>
        <button class="btn btn-primary" id="export-report-btn">
          <i class="fas fa-file-export ml-1"></i>
          تصدير التقرير
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
    document.getElementById('close-profit-report-modal').addEventListener('click', () => {
      hideModal('profit-analysis-report-modal');
    });
    
    document.getElementById('close-report-btn').addEventListener('click', () => {
      hideModal('profit-analysis-report-modal');
    });
    
    document.getElementById('export-report-btn').addEventListener('click', exportProfitAnalysisReport);
    
    // تحميل بيانات التقرير
    loadProfitAnalysisReportData();
  }, 10);
}

/**
 * تحميل بيانات تقرير تحليل الأرباح
 */
function loadProfitAnalysisReportData() {
  // الحصول على التاريخ الحالي
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // getMonth() يبدأ من 0
  
  // حساب بيانات الأرباح لكل مستثمر
  const investorsProfitData = [];
  
  for (const investor of investors) {
    const profitAnalysis = calculateInvestorMonthlyProfit(
      transactions, 
      investor.id, 
      currentYear, 
      currentMonth, 
      profitRate
    );
    
    investorsProfitData.push({
      investor,
      profitAnalysis
    });
  }
  
  // ترتيب المستثمرين حسب الربح (تنازلي)
  investorsProfitData.sort((a, b) => b.profitAnalysis.proportionalProfit - a.profitAnalysis.proportionalProfit);
  
  // حساب إجمالي الأرباح
  const totalProfit = investorsProfitData.reduce((sum, item) => sum + item.profitAnalysis.proportionalProfit, 0);
  
  // عرض ملخص الأرباح
  const summaryContainer = document.getElementById('profit-summary-container');
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="card p-3 mb-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-gray-500">إجمالي الأرباح الشهرية</p>
            <p class="font-bold text-lg">${numberWithCommas(Math.round(totalProfit))} د.ع</p>
          </div>
          <div>
            <p class="text-gray-500">عدد المستثمرين</p>
            <p class="font-bold text-lg">${investors.length}</p>
          </div>
          <div>
            <p class="text-gray-500">متوسط الربح للمستثمر</p>
            <p class="font-bold text-lg">${numberWithCommas(Math.round(totalProfit / investors.length))} د.ع</p>
          </div>
          <div>
            <p class="text-gray-500">نسبة الربح الشهرية</p>
            <p class="font-bold text-lg">${profitRate / 12}%</p>
          </div>
        </div>
      </div>
    `;
  }
  
  // عرض تفاصيل الأرباح لكل مستثمر
  const detailsContainer = document.getElementById('profit-details-container');
  if (detailsContainer) {
    let html = '';
    
    for (const item of investorsProfitData) {
      const { investor, profitAnalysis } = item;
      
      html += `
        <div class="card mb-3 p-3">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2">
              <div class="badge badge-primary" style="width: 30px; height: 30px;">
                ${investor.name.charAt(0)}
              </div>
              <h4 class="font-bold">${investor.name}</h4>
            </div>
            <div class="text-sm">
              <span class="text-gray-500">هاتف:</span> ${investor.phone || 'غير متوفر'}
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p class="text-sm text-gray-500">متوسط الرصيد اليومي</p>
              <p class="font-bold">${numberWithCommas(Math.round(profitAnalysis.averageDailyBalance))} د.ع</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">الربح الشهري المتوقع</p>
              <p class="font-bold text-green-600">${numberWithCommas(Math.round(profitAnalysis.proportionalProfit))} د.ع</p>
            </div>
          </div>
          
          <div class="text-xs text-gray-500">
            تم حساب الربح بناءً على متوسط الرصيد اليومي خلال شهر ${getCurrentMonthName()}
          </div>
        </div>
      `;
    }
    
    detailsContainer.innerHTML = html || 'لا توجد بيانات متاحة.';
  }
}

/**
 * تصدير تقرير تحليل الأرباح
 */
function exportProfitAnalysisReport() {
  // إنشاء نص التقرير
  let reportText = 'تقرير تحليل الأرباح الشهرية\n';
  reportText += '===========================\n\n';
  
  // إضافة التاريخ
  reportText += `التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n`;
  reportText += `الشهر: ${getCurrentMonthName()}\n\n`;
  
  // إضافة ملخص الأرباح
  reportText += 'ملخص الأرباح:\n';
  reportText += '--------------\n';
  
  // حساب إجمالي الأرباح
  let totalProfit = 0;
  for (const investor of investors) {
    const profitAnalysis = calculateInvestorMonthlyProfit(
      transactions, 
      investor.id, 
      new Date().getFullYear(), 
      new Date().getMonth() + 1, 
      profitRate
    );
    
    totalProfit += profitAnalysis.proportionalProfit;
  }
  
  reportText += `إجمالي الأرباح الشهرية: ${numberWithCommas(Math.round(totalProfit))} د.ع\n`;
  reportText += `عدد المستثمرين: ${investors.length}\n`;
  reportText += `متوسط الربح للمستثمر: ${numberWithCommas(Math.round(totalProfit / investors.length))} د.ع\n`;
  reportText += `نسبة الربح الشهرية: ${profitRate / 12}%\n\n`;
  
  // إضافة تفاصيل الأرباح لكل مستثمر
  reportText += 'تفاصيل الأرباح حسب المستثمر:\n';
  reportText += '----------------------------\n\n';
  
  for (const investor of investors) {
    const profitAnalysis = calculateInvestorMonthlyProfit(
      transactions, 
      investor.id, 
      new Date().getFullYear(), 
      new Date().getMonth() + 1, 
      profitRate
    );
    
    reportText += `المستثمر: ${investor.name}\n`;
    reportText += `الهاتف: ${investor.phone || 'غير متوفر'}\n`;
    reportText += `متوسط الرصيد اليومي: ${numberWithCommas(Math.round(profitAnalysis.averageDailyBalance))} د.ع\n`;
    reportText += `الربح الشهري المتوقع: ${numberWithCommas(Math.round(profitAnalysis.proportionalProfit))} د.ع\n\n`;
  }
  
  // إنشاء رابط التنزيل
  const blob = new Blob([reportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير_الأرباح_${getCurrentMonthName()}.txt`;
  a.click();
  
  // تحرير الموارد
  URL.revokeObjectURL(url);
  
  // عرض إشعار
  showNotification('تم تصدير التقرير بنجاح', 'success');
}
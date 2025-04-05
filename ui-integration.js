// === تكامل واجهة المستخدم مع نظام حساب الأرباح النسبية ===

/**
 * تحديث صفحة تفاصيل المستثمر لإضافة قسم تحليل الأرباح
 */
function enhanceInvestorDetailsPage() {
  // تعديل دالة renderInvestorDetailsPage لإضافة قسم تحليل الأرباح
  const originalRenderInvestorDetailsPage = renderInvestorDetailsPage;
  
  renderInvestorDetailsPage = function() {
    // استدعاء الدالة الأصلية أولاً
    originalRenderInvestorDetailsPage();
    
    // إذا لم يكن هناك مستثمر محدد، لا تفعل شيئاً
    if (!selectedInvestor) return;
    
    // الحصول على العناصر الحالية
    const mainContent = document.getElementById('main-content');
    const container = mainContent.querySelector('.container');
    
    // إنشاء تاريخ الشهر الحالي
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() يبدأ من 0
    
    // حساب الأرباح النسبية للشهر الحالي
    const profitAnalysis = calculateInvestorMonthlyProfit(
      transactions, 
      selectedInvestor.id, 
      currentYear, 
      currentMonth, 
      profitRate
    );
    
    // إنشاء قسم تحليل الأرباح
    const profitAnalysisSection = document.createElement('div');
    profitAnalysisSection.className = 'card mb-4';
    profitAnalysisSection.innerHTML = `
      <h3 class="font-bold mb-3 flex items-center gap-2">
        <i class="fas fa-chart-line text-blue-600"></i>
        تحليل الأرباح الشهرية
      </h3>
      
      <div class="mb-4">
        <div class="flex justify-between mb-2">
          <span class="text-gray-500">متوسط الرصيد اليومي:</span>
          <span class="font-bold">${numberWithCommas(Math.round(profitAnalysis.averageDailyBalance))} د.ع</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="text-gray-500">الربح المتوقع للشهر الحالي:</span>
          <span class="font-bold text-green-600">${numberWithCommas(Math.round(profitAnalysis.proportionalProfit))} د.ع</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">ربح اليوم:</span>
          <span class="font-bold text-blue-600">${numberWithCommas(Math.round(profitAnalysis.proportionalProfit / profitAnalysis.daysInMonth))} د.ع</span>
        </div>
      </div>
      
      <div class="mb-3">
        <div class="flex justify-between mb-2">
          <h4 class="font-bold">تطور الرصيد خلال الشهر</h4>
          <span class="text-sm text-gray-500">${getCurrentMonthName()}</span>
        </div>
        <div class="balance-chart" id="balance-chart" style="height: 200px; position: relative;">
          <!-- سيتم إضافة الرسم البياني هنا -->
          <div class="text-center py-4 text-gray-500">
            جاري تحميل الرسم البياني...
          </div>
        </div>
      </div>
      
      <div class="alert alert-info mt-3">
        <i class="fas fa-info-circle text-blue-600"></i>
        <div>
          <p class="text-sm">يتم حساب الأرباح بناءً على متوسط الرصيد اليومي خلال الشهر، مما يضمن دقة الحساب عند إجراء إيداعات أو سحوبات متعددة.</p>
        </div>
      </div>
    `;
    
    // إضافة القسم إلى الصفحة قبل قسم المعاملات
    const transactionsHeading = container.querySelector('h3');
    if (transactionsHeading && transactionsHeading.parentNode) {
      container.insertBefore(profitAnalysisSection, transactionsHeading.parentNode);
    } else {
      container.appendChild(profitAnalysisSection);
    }
    
    // إنشاء الرسم البياني باستخدام Canvas
    renderBalanceChart('balance-chart', profitAnalysis);
  };
}

/**
 * إنشاء رسم بياني لعرض تطور الرصيد خلال الشهر
 * @param {string} elementId - معرف عنصر HTML لعرض الرسم البياني فيه
 * @param {Object} profitAnalysis - نتائج تحليل الربح
 */
function renderBalanceChart(elementId, profitAnalysis) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  // إفراغ المحتوى الحالي
  container.innerHTML = '';
  
  // إنشاء عنصر canvas
  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // تحديد حدود الرسم
  const padding = 30;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  
  // تحديد النطاق (scale) للبيانات
  const balances = profitAnalysis.dailyBalances;
  const maxBalance = Math.max(...balances) * 1.1; // إضافة هامش بنسبة 10%
  const minBalance = Math.min(0, Math.min(...balances) * 0.9); // إضافة هامش بنسبة 10%
  
  // رسم الإطار والمحاور
  ctx.fillStyle = '#f8fafc'; // خلفية فاتحة
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(padding, padding, chartWidth, chartHeight);
  ctx.stroke();
  
  // رسم خطوط الشبكة الأفقية (5 خطوط)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = padding + chartHeight - (chartHeight * i) / 5;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
    
    // كتابة قيم المحور Y
    const value = minBalance + ((maxBalance - minBalance) * i) / 5;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Cairo';
    ctx.textAlign = 'right';
    ctx.fillText(numberWithCommas(Math.round(value)), padding - 5, y + 3);
  }
  
  // رسم خط المحور X (الأيام)
  const days = profitAnalysis.dateLabels;
  const dayStep = Math.max(1, Math.floor(days.length / 10)); // عرض 10 أيام كحد أقصى
  
  for (let i = 0; i < days.length; i += dayStep) {
    const x = padding + (chartWidth * i) / (days.length - 1);
    
    // رسم خطوط عمودية متقطعة
    ctx.strokeStyle = '#e2e8f0';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, padding + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // كتابة قيم المحور X (الأيام)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText(days[i].toString(), x, padding + chartHeight + 15);
  }
  
  // رسم خط الرصيد
  ctx.strokeStyle = '#3b82f6'; // أزرق
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < balances.length; i++) {
    const x = padding + (chartWidth * i) / (balances.length - 1);
    const balanceRatio = (balances[i] - minBalance) / (maxBalance - minBalance);
    const y = padding + chartHeight - chartHeight * balanceRatio;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  
  // إضافة منطقة تحت الخط
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // أزرق شفاف
  ctx.beginPath();
  
  // النقطة الأولى في الزاوية السفلية اليسرى
  ctx.moveTo(padding, padding + chartHeight);
  
  // رسم خط الرصيد
  for (let i = 0; i < balances.length; i++) {
    const x = padding + (chartWidth * i) / (balances.length - 1);
    const balanceRatio = (balances[i] - minBalance) / (maxBalance - minBalance);
    const y = padding + chartHeight - chartHeight * balanceRatio;
    ctx.lineTo(x, y);
  }
  
  // إكمال المسار إلى الزاوية السفلية اليمنى
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.closePath();
  ctx.fill();
  
  // إضافة نقاط لتمثيل المعاملات
  const monthTransactions = transactions.filter(t => {
    const transDate = new Date(t.date);
    return t.investorId === profitAnalysis.investorId && 
           transDate.getFullYear() === profitAnalysis.year && 
           transDate.getMonth() === profitAnalysis.month - 1;
  });
  
  for (const transaction of monthTransactions) {
    const transDate = new Date(transaction.date);
    const day = transDate.getDate() - 1; // تحويل إلى فهرس (0-based)
    
    const x = padding + (chartWidth * day) / (balances.length - 1);
    const balanceRatio = (balances[day] - minBalance) / (maxBalance - minBalance);
    const y = padding + chartHeight - chartHeight * balanceRatio;
    
    // رسم دائرة للمعاملة
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    
    if (transaction.type === 'investment') {
      ctx.fillStyle = '#10b981'; // أخضر للاستثمارات
    } else if (transaction.type === 'payout') {
      ctx.fillStyle = '#ef4444'; // أحمر للمدفوعات
    } else if (transaction.type === 'withdrawal') {
      ctx.fillStyle = '#f59e0b'; // برتقالي للسحوبات
    } else {
      ctx.fillStyle = '#6b7280'; // رمادي للأنواع الأخرى
    }
    
    ctx.fill();
  }
}

/**
 * تعديل نموذج إضافة المعاملات لإظهار تأثير المعاملة على الأرباح
 */
function enhanceTransactionModal() {
  // الحصول على العناصر
  const transactionForm = document.getElementById('add-transaction-modal');
  const modalBody = transactionForm.querySelector('.modal-body');
  
  // إنشاء عنصر لإظهار تأثير المعاملة
  const impactPreview = document.createElement('div');
  impactPreview.className = 'transaction-impact-preview alert alert-info hidden mt-3';
  impactPreview.innerHTML = `
    <i class="fas fa-info-circle text-blue-600"></i>
    <div>
      <p class="font-bold">تأثير المعاملة:</p>
      <p id="transaction-impact-text">سيتم احتساب تأثير المعاملة على الأرباح...</p>
    </div>
  `;
  
  // إضافة العنصر إلى النموذج
  modalBody.appendChild(impactPreview);
  
  // إضافة مستمعي الأحداث للحقول
  const investorSelect = document.getElementById('transaction-investor-id');
  const typeSelect = document.getElementById('transaction-type');
  const amountInput = document.getElementById('transaction-amount');
  const dateInput = document.getElementById('transaction-date');
  
  // دالة لتحديث معاينة التأثير
  function updateImpactPreview() {
    const investorId = investorSelect.value;
    const type = typeSelect.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value || getCurrentDate();
    
    // إخفاء المعاينة إذا كانت البيانات غير مكتملة
    if (!investorId || isNaN(amount) || amount <= 0) {
      impactPreview.classList.add('hidden');
      return;
    }
    
    // استخراج بيانات المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) {
      impactPreview.classList.add('hidden');
      return;
    }
    
    // استخراج معلومات التاريخ
    const transDate = new Date(date);
    const currentYear = transDate.getFullYear();
    const currentMonth = transDate.getMonth() + 1; // getMonth() يبدأ من 0
    const currentDay = transDate.getDate();
    
    // إعداد نسخة من المعاملات مع إضافة المعاملة الجديدة
    const simulatedTransactions = [...transactions];
    
    // إضافة المعاملة المحتملة
    simulatedTransactions.push({
      id: 'temp-transaction',
      investorId,
      type,
      amount,
      date
    });
    
    // حساب الأرباح قبل وبعد المعاملة
    const profitBefore = calculateInvestorMonthlyProfit(
      transactions, 
      investorId, 
      currentYear, 
      currentMonth, 
      profitRate
    );
    
    const profitAfter = calculateInvestorMonthlyProfit(
      simulatedTransactions, 
      investorId, 
      currentYear, 
      currentMonth, 
      profitRate
    );
    
    // حساب الفرق
    const profitDifference = profitAfter.proportionalProfit - profitBefore.proportionalProfit;
    
    // عرض التأثير
    let impactMessage = '';
    
    if (type === 'investment') {
      impactMessage = `
        ستزيد هذه المعاملة الربح الشهري المتوقع بمقدار 
        <span class="text-green-600 font-bold">${numberWithCommas(Math.round(profitDifference))} د.ع</span>
        (بنسبة ${Math.round((profitDifference / profitBefore.proportionalProfit) * 100)}%).
        <br>
        نظراً لأن المعاملة ستتم في يوم ${currentDay} من الشهر، سيتم احتساب الربح عن ${profitAnalysis.daysInMonth - currentDay + 1} يوم فقط من هذا الشهر.currentDay} من الشهر، سيتم احتساب الربح عن ${
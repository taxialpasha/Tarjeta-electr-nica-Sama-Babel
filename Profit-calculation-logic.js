// === وظائف حساب الأرباح النسبية ===

/**
 * حساب عدد أيام الشهر
 * @param {number} year - السنة
 * @param {number} month - الشهر (1-12)
 * @returns {number} عدد الأيام في الشهر
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * حساب الرصيد في تاريخ معين بناءً على المعاملات السابقة
 * @param {Array} transactions - قائمة المعاملات
 * @param {string} investorId - معرف المستثمر
 * @param {Date} date - التاريخ المطلوب حساب الرصيد فيه
 * @returns {number} الرصيد في التاريخ المحدد
 */
function calculateBalanceAtDate(transactions, investorId, date) {
  // تحويل التاريخ إلى كائن Date إذا كان سلسلة نصية
  const targetDate = new Date(date);
  
  // استخراج المعاملات ذات الصلة للمستثمر حتى التاريخ المحدد
  const relevantTransactions = transactions.filter(t => {
    return t.investorId === investorId && new Date(t.date) <= targetDate;
  });
  
  // حساب الرصيد بناءً على جميع المعاملات
  let balance = 0;
  for (const trans of relevantTransactions) {
    if (trans.type === 'investment') {
      balance += trans.amount;
    } else if (trans.type === 'payout') {
      // ملاحظة: عمليات الدفع لا تؤثر على الرصيد الاستثماري الأساسي
      // ولكن يمكن تغيير هذا السلوك حسب منطق التطبيق
    } else if (trans.type === 'withdrawal') {
      // إذا كنت تدعم عمليات السحب
      balance -= trans.amount;
    }
  }
  
  return balance;
}

/**
 * حساب الأرصدة اليومية لشهر معين
 * @param {Array} transactions - قائمة المعاملات
 * @param {string} investorId - معرف المستثمر
 * @param {number} year - السنة
 * @param {number} month - الشهر (1-12)
 * @returns {Array} مصفوفة من الأرصدة اليومية
 */
function calculateDailyBalancesForMonth(transactions, investorId, year, month) {
  // حساب عدد أيام الشهر
  const daysInMonth = getDaysInMonth(year, month);
  
  // حساب تاريخ بداية الشهر ونهايته
  const startOfMonth = new Date(year, month - 1, 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(year, month, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  // حساب الرصيد في بداية الشهر
  const startingBalance = calculateBalanceAtDate(transactions, investorId, startOfMonth);
  
  // إنشاء مصفوفة لتخزين الرصيد اليومي، مبدئياً بالرصيد الافتتاحي
  const dailyBalances = Array(daysInMonth).fill(startingBalance);
  
  // استخراج المعاملات التي تمت خلال الشهر
  const monthTransactions = transactions.filter(t => {
    const transDate = new Date(t.date);
    return t.investorId === investorId && 
           transDate >= startOfMonth && 
           transDate <= endOfMonth;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // تحديث الأرصدة اليومية بناءً على المعاملات
  for (const transaction of monthTransactions) {
    const transDate = new Date(transaction.date);
    const day = transDate.getDate(); // يوم الشهر (1-31)
    
    let amountChange = 0;
    
    if (transaction.type === 'investment') {
      amountChange = transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      amountChange = -transaction.amount;
    }
    
    // تحديث الرصيد من يوم المعاملة حتى نهاية الشهر
    for (let i = day - 1; i < daysInMonth; i++) {
      dailyBalances[i] += amountChange;
    }
  }
  
  return dailyBalances;
}

/**
 * حساب الربح النسبي للشهر بناءً على الأرصدة اليومية
 * @param {Array} dailyBalances - مصفوفة من الأرصدة اليومية
 * @param {number} monthlyProfitRate - نسبة الربح الشهرية (كنسبة مئوية)
 * @returns {number} الربح الشهري
 */
function calculateProportionalProfit(dailyBalances, monthlyProfitRate) {
  // حساب متوسط الرصيد المرجح
  const totalBalance = dailyBalances.reduce((sum, balance) => sum + balance, 0);
  const averageBalance = totalBalance / dailyBalances.length;
  
  // حساب الربح بناءً على المتوسط المرجح ونسبة الربح الشهرية
  const profitRateDecimal = monthlyProfitRate / 100;
  return averageBalance * profitRateDecimal;
}

/**
 * الدالة الرئيسية لحساب الأرباح النسبية للمستثمر في شهر معين
 * @param {Array} transactions - قائمة المعاملات
 * @param {string} investorId - معرف المستثمر
 * @param {number} year - السنة
 * @param {number} month - الشهر (1-12)
 * @param {number} annualProfitRate - نسبة الربح السنوية بالمليون
 * @returns {Object} كائن يحتوي على معلومات الربح والأرصدة
 */
function calculateInvestorMonthlyProfit(transactions, investorId, year, month, annualProfitRate) {
  // حساب نسبة الربح الشهرية من النسبة السنوية
  const monthlyProfitRate = annualProfitRate / 12;
  
  // حساب الأرصدة اليومية للشهر
  const dailyBalances = calculateDailyBalancesForMonth(transactions, investorId, year, month);
  
  // حساب متوسط الرصيد اليومي
  const totalBalance = dailyBalances.reduce((sum, balance) => sum + balance, 0);
  const averageDailyBalance = totalBalance / dailyBalances.length;
  
  // حساب الربح النسبي
  const proportionalProfit = calculateProportionalProfit(dailyBalances, monthlyProfitRate);
  
  // إعداد كائن نتائج مفصل
  const daysInMonth = dailyBalances.length;
  const dateLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  return {
    investorId,
    year,
    month,
    daysInMonth,
    dailyBalances,
    dateLabels,
    averageDailyBalance,
    monthlyProfitRate,
    proportionalProfit,
    // معلومات إضافية قد تكون مفيدة
    startingBalance: dailyBalances[0],
    endingBalance: dailyBalances[dailyBalances.length - 1]
  };
}

/**
 * حساب الأرباح المستحقة حتى اليوم الحالي في الشهر
 * @param {Array} dailyBalances - مصفوفة من الأرصدة اليومية
 * @param {number} monthlyProfitRate - نسبة الربح الشهرية
 * @param {number} currentDay - اليوم الحالي من الشهر (1-31)
 * @returns {number} الربح المستحق حتى اليوم
 */
function calculateProfitUntilDay(dailyBalances, monthlyProfitRate, currentDay) {
  // التأكد من أن اليوم ضمن الحدود
  const day = Math.min(currentDay, dailyBalances.length);
  
  // استخراج الأرصدة حتى اليوم المحدد
  const balancesUntilDay = dailyBalances.slice(0, day);
  
  // حساب متوسط الرصيد
  const totalBalance = balancesUntilDay.reduce((sum, balance) => sum + balance, 0);
  const averageBalance = totalBalance / balancesUntilDay.length;
  
  // حساب الربح النسبي حتى اليوم المحدد
  const profitRateDecimal = monthlyProfitRate / 100;
  const dailyRate = profitRateDecimal / dailyBalances.length;
  
  return averageBalance * dailyRate * day;
}

/**
 * توقع الربح الشهري بناءً على الرصيد الحالي وأنماط المعاملات السابقة
 * @param {Array} transactions - قائمة المعاملات
 * @param {string} investorId - معرف المستثمر
 * @param {number} currentBalance - الرصيد الحالي
 * @param {number} annualProfitRate - نسبة الربح السنوية
 * @returns {number} الربح المتوقع للشهر القادم
 */
function predictNextMonthProfit(transactions, investorId, currentBalance, annualProfitRate) {
  // الحصول على التاريخ الحالي
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() يبدأ من 0
  
  // حساب الشهر التالي
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  
  // تحليل أنماط المعاملات للأشهر الثلاثة الماضية
  const pastTransactions = [];
  for (let i = 0; i < 3; i++) {
    let pastMonth = currentMonth - i;
    let pastYear = currentYear;
    
    if (pastMonth <= 0) {
      pastMonth += 12;
      pastYear--;
    }
    
    const startOfMonth = new Date(pastYear, pastMonth - 1, 1);
    const endOfMonth = new Date(pastYear, pastMonth, 0);
    
    const monthTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return t.investorId === investorId && 
             transDate >= startOfMonth && 
             transDate <= endOfMonth;
    });
    
    pastTransactions.push(...monthTransactions);
  }
  
  // إذا كانت هناك أنماط متكررة، استخدمها للتنبؤ
  // للتبسيط، نفترض أن الرصيد الحالي سيستمر دون تغيير
  
  // حساب نسبة الربح الشهرية
  const monthlyProfitRate = annualProfitRate / 12;
  
  // حساب الربح المتوقع على أساس الرصيد الحالي
  const expectedProfit = currentBalance * (monthlyProfitRate / 100);
  
  return expectedProfit;
}
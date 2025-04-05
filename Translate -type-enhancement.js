// === إضافة نوع معاملة سحب (Withdrawal) وتحديثات ذات صلة ===

/**
 * تعديل نموذج إضافة المعاملات لدعم عمليات السحب
 */
function enhanceTransactionTypes() {
  // تعديل دالة showAddTransactionModal
  const originalShowAddTransactionModal = showAddTransactionModal;
  
  showAddTransactionModal = function(type, investor = null) {
    // استدعاء الدالة الأصلية
    originalShowAddTransactionModal(type, investor);
    
    // الحصول على عنصر تحديد نوع المعاملة
    const typeSelect = document.getElementById('transaction-type');
    
    // إضافة خيار السحب إذا لم يكن موجوداً
    let hasWithdrawalOption = false;
    for (let i = 0; i < typeSelect.options.length; i++) {
      if (typeSelect.options[i].value === 'withdrawal') {
        hasWithdrawalOption = true;
        break;
      }
    }
    
    if (!hasWithdrawalOption) {
      const withdrawalOption = document.createElement('option');
      withdrawalOption.value = 'withdrawal';
      withdrawalOption.textContent = 'سحب من الاستثمار';
      typeSelect.appendChild(withdrawalOption);
    }
    
    // تحديد الخيار المناسب إذا تم تمرير نوع
    if (type) {
      typeSelect.value = type;
    }
    
    // تعديل عنوان النموذج بناءً على النوع المحدد
    updateTransactionModalTitle();
    
    // إضافة مستمع حدث لتغيير العنوان عند تغيير النوع
    typeSelect.addEventListener('change', updateTransactionModalTitle);
  };
  
  // دالة لتحديث عنوان نموذج المعاملة
  function updateTransactionModalTitle() {
    const typeSelect = document.getElementById('transaction-type');
    const titleElement = document.getElementById('transaction-modal-title');
    
    if (typeSelect && titleElement) {
      const selectedType = typeSelect.value;
      
      switch (selectedType) {
        case 'investment':
          titleElement.textContent = 'إضافة استثمار جديد';
          break;
        case 'payout':
          titleElement.textContent = 'تسجيل دفع ربح';
          break;
        case 'withdrawal':
          titleElement.textContent = 'تسجيل سحب من الاستثمار';
          break;
        default:
          titleElement.textContent = 'إضافة معاملة جديدة';
      }
    }
  }
  
  // تعديل دالة addTransaction لدعم عمليات السحب
  const originalAddTransaction = addTransaction;
  
  addTransaction = function() {
    const investorId = document.getElementById('transaction-investor-id').value;
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const date = document.getElementById('transaction-date').value || getCurrentDate();
    const notes = document.getElementById('transaction-notes').value;
    
    // التحقق من صحة البيانات
    if (!investorId || isNaN(amount) || amount <= 0) {
      showNotification('الرجاء تحديد المستثمر والمبلغ', 'error');
      return;
    }
    
    // للسحب، تأكد من أن المبلغ لا يتجاوز رصيد المستثمر
    if (type === 'withdrawal') {
      const investor = investors.find(inv => inv.id === investorId);
      if (investor && amount > investor.amount) {
        showNotification('مبلغ السحب يتجاوز رصيد المستثمر الحالي', 'error');
        return;
      }
    }
    
    const transaction = {
      id: Date.now().toString(),
      investorId,
      type,
      amount,
      date,
      notes
    };
    
    transactions.push(transaction);
    
    // تحديث رصيد المستثمر ومعلومات ملخص اليوم
    const investor = investors.find(inv => inv.id === investorId);
    if (investor) {
      if (type === 'investment') {
        // زيادة رصيد المستثمر للاستثمارات
        investor.amount += amount;
        dailySummary.totalInvestments += amount;
      } else if (type === 'withdrawal') {
        // خفض رصيد المستثمر للسحوبات
        investor.amount -= amount;
        dailySummary.totalInvestments -= amount;
      } else if (type === 'payout') {
        // تحديث إجمالي المدفوعات
        dailySummary.totalPayouts += amount;
      }
      
      // تحديث المستثمر المحدد إذا كان هو نفسه
      if (selectedInvestor && selectedInvestor.id === investorId) {
        selectedInvestor = investor;
      }
    }
    
    // إعادة حساب الإشعارات
    calculateUpcomingPayments();
    
    // حفظ البيانات في التخزين المحلي
    saveData();
    
    // إغلاق النموذج
    hideModal('add-transaction-modal');
    
    // تحديث الواجهة
    if (selectedInvestor && selectedInvestor.id === investorId) {
      renderInvestorDetailsPage();
    } else if (currentPage === 'transactions') {
      renderTransactionsPage();
    } else if (currentPage === 'home') {
      renderHomePage();
    }
    
    // عرض إشعار نجاح مخصص حسب نوع المعاملة
    let transactionTypeMessage = '';
    switch (type) {
      case 'investment':
        transactionTypeMessage = 'استثمار';
        break;
      case 'payout':
        transactionTypeMessage = 'دفع ربح';
        break;
      case 'withdrawal':
        transactionTypeMessage = 'سحب';
        break;
      default:
        transactionTypeMessage = 'معاملة';
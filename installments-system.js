/**
 * نظام إدارة الأقساط واستقطاعها من الأرباح
 * يوفر وظائف إضافة وإدارة الأقساط المستحقة على المستثمرين
 * واستقطاعها تلقائياً من الأرباح عند عملية دفع الأرباح
 */

// نظام إدارة الأقساط
const InstallmentSystem = (function() {
    // المتغيرات الخاصة بالنظام
    let installedSystem = false;
    
    /**
     * تهيئة نظام الأقساط
     */
    function initialize() {
        console.log('تهيئة نظام إدارة الأقساط...');
        
        // فحص وإصلاح بنية البيانات للمستثمرين
        fixInvestorsDataStructure();
        
        // استبدال دوال النظام الأصلية
        overrideOriginalFunctions();
        
        // إضافة واجهة إدارة الأقساط
        addInstallmentManagementUI();
        
        // إضافة أنماط CSS
        addInstallmentStyles();
        
        // تحديث حالة التثبيت
        installedSystem = true;
        
        console.log('تم تهيئة نظام إدارة الأقساط بنجاح');
    }
    
    /**
     * فحص وإصلاح بنية البيانات للمستثمرين
     * للتأكد من وجود صفيف الأقساط
     */
    function fixInvestorsDataStructure() {
        try {
            if (!Array.isArray(window.investors)) {
                console.warn('مصفوفة المستثمرين غير موجودة');
                return;
            }
            
            // إضافة صفيف الأقساط للمستثمرين إذا لم يكن موجوداً
            window.investors.forEach(investor => {
                if (!investor.installments) {
                    investor.installments = [];
                }
            });
            
            // حفظ التغييرات
            if (typeof window.saveData === 'function') {
                window.saveData();
            }
            
            console.log('تم إصلاح بنية بيانات المستثمرين');
        } catch (error) {
            console.error('خطأ في إصلاح بنية بيانات المستثمرين:', error);
        }
    }
    
    /**
     * استبدال دوال النظام الأصلية
     */
    function overrideOriginalFunctions() {
        try {
            // حفظ دالة دفع الأرباح الأصلية
            if (typeof window.payProfit === 'function') {
                window._originalPayProfit = window.payProfit;
                
                // استبدال الدالة بنسخة محسنة
                window.payProfit = enhancedPayProfit;
                console.log('تم استبدال دالة دفع الأرباح بنجاح');
            }
            
            // حفظ دالة حساب الأرباح
            if (typeof window.calculateProfitForInvestor === 'function') {
                window._originalCalculateProfitForInvestor = window.calculateProfitForInvestor;
                
                // استبدال الدالة بنسخة محسنة
                window.calculateProfitForInvestor = enhancedCalculateProfitForInvestor;
                console.log('تم استبدال دالة حساب الأرباح بنجاح');
            }
            
            // حفظ دالة عرض تفاصيل المستثمر
            if (typeof window.showInvestorDetails === 'function') {
                window._originalShowInvestorDetails = window.showInvestorDetails;
                
                // استبدال الدالة بنسخة محسنة
                window.showInvestorDetails = enhancedShowInvestorDetails;
                console.log('تم استبدال دالة عرض تفاصيل المستثمر بنجاح');
            }
        } catch (error) {
            console.error('خطأ في استبدال الدوال الأصلية:', error);
        }
    }
    
    /**
     * نسخة محسنة من دالة دفع الأرباح
     * تقوم بخصم الأقساط المستحقة من الأرباح
     */
    function enhancedPayProfit() {
        console.log('دفع الأرباح مع استقطاع الأقساط المستحقة...');
        
        // الحصول على معرف المستثمر
        const profitInvestorSelect = document.getElementById('profit-investor');
        if (!profitInvestorSelect) {
            showNotification('خطأ في النموذج: لم يتم العثور على عنصر اختيار المستثمر', 'error');
            return;
        }
        
        const investorId = profitInvestorSelect.value;
        if (!investorId) {
            showNotification('الرجاء اختيار مستثمر', 'error');
            return;
        }
        
        // البحث عن المستثمر
        const investor = window.investors.find(inv => inv.id === investorId);
        if (!investor) {
            showNotification('لم يتم العثور على بيانات المستثمر', 'error');
            return;
        }
        
        // حساب إجمالي الأرباح المستحقة
        let totalProfit = 0;
        
        // حساب الأرباح للاستثمارات النشطة فقط
        investor.investments.forEach(inv => {
            // تجاهل الاستثمارات ذات المبلغ الصفري
            if (inv.amount <= 0) return;
            
            const start = new Date(inv.date);
            const today = new Date();
            const profit = typeof window.calculateInterest === 'function' 
                ? window.calculateInterest(inv.amount, inv.date, today.toISOString().split('T')[0])
                : 0;
                
            totalProfit += profit;
        });
        
        // استدعاء نافذة تأكيد استقطاع الأقساط
        showInstallmentConfirmationModal(investor, totalProfit, function(proceedWithDeduction) {
            if (!proceedWithDeduction) {
                // استمرار بدون خصم الأقساط (استخدام الدالة الأصلية)
                if (typeof window._originalPayProfit === 'function') {
                    window._originalPayProfit();
                }
                return;
            }
            
            // حساب إجمالي الأقساط المستحقة
            const dueInstallments = getDueInstallments(investor);
            const totalDueAmount = dueInstallments.reduce((sum, installment) => sum + installment.remainingAmount, 0);
            
            // حساب الربح النهائي بعد استقطاع الأقساط
            const finalProfit = Math.max(0, totalProfit - totalDueAmount);
            
            // تسجيل عملية دفع الأرباح مع استقطاع الأقساط
            processInstallmentDeduction(investor, dueInstallments, totalDueAmount, totalProfit, finalProfit);
        });
    }
    
    /**
     * نسخة محسنة من دالة حساب الأرباح للمستثمر
     * تقوم بإظهار الأقساط المستحقة وتأثيرها على الأرباح
     */
    function enhancedCalculateProfitForInvestor() {
        console.log('حساب الأرباح للمستثمر مع عرض الأقساط المستحقة...');
        
        // استدعاء الدالة الأصلية
        if (typeof window._originalCalculateProfitForInvestor === 'function') {
            window._originalCalculateProfitForInvestor();
        }
        
        // الحصول على اختيار المستثمر
        const investorSelect = document.getElementById('profit-investor');
        if (!investorSelect) return;
        
        const investorId = investorSelect.value;
        const profitDetails = document.getElementById('profit-details');
        
        if (!investorId || !profitDetails) {
            return;
        }
        
        // البحث عن المستثمر
        const investor = window.investors.find(inv => inv.id === investorId);
        if (!investor) return;
        
        // التحقق من وجود أقساط مستحقة
        if (!investor.installments || investor.installments.length === 0) {
            return;
        }
        
        // إضافة قسم الأقساط المستحقة إلى تفاصيل الأرباح
        const dueInstallments = getDueInstallments(investor);
        
        // إذا لم توجد أقساط مستحقة، نخرج
        if (dueInstallments.length === 0) {
            return;
        }
        
        // إعداد قسم الأقساط المستحقة
        const installmentsSection = document.createElement('div');
        installmentsSection.className = 'installments-section section';
        
        // حساب إجمالي الأرباح المحسوبة سابقاً
        const totalProfitElement = profitDetails.querySelector('tfoot tr:last-child td:last-child strong');
        let totalProfit = 0;
        
        if (totalProfitElement) {
            // استخراج الرقم من النص
            const profitText = totalProfitElement.textContent;
            totalProfit = parseFloat(profitText.replace(/[^\d.-]/g, '')) || 0;
        }
        
        // حساب إجمالي الأقساط المستحقة
        const totalDueAmount = dueInstallments.reduce((sum, installment) => sum + installment.remainingAmount, 0);
        
        // حساب الربح النهائي بعد استقطاع الأقساط
        const finalProfit = Math.max(0, totalProfit - totalDueAmount);
        
        // إنشاء محتوى قسم الأقساط
        installmentsSection.innerHTML = `
            <h3 class="section-title">الأقساط المستحقة</h3>
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>يوجد ${dueInstallments.length} قسط مستحق بقيمة إجمالية ${formatCurrency(totalDueAmount)}. سيتم استقطاعها تلقائياً من الأرباح.</span>
            </div>
            <table class="installments-table">
                <thead>
                    <tr>
                        <th>الوصف</th>
                        <th>تاريخ الاستحقاق</th>
                        <th>إجمالي القسط</th>
                        <th>المبلغ المتبقي</th>
                    </tr>
                </thead>
                <tbody>
                    ${dueInstallments.map(installment => `
                        <tr>
                            <td>${installment.description}</td>
                            <td>${formatDate(installment.dueDate)}</td>
                            <td>${formatCurrency(installment.amount)}</td>
                            <td>${formatCurrency(installment.remainingAmount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>إجمالي الأقساط المستحقة</strong></td>
                        <td><strong>${formatCurrency(totalDueAmount)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="profit-summary">
                <div class="summary-row">
                    <div class="summary-label">إجمالي الربح المستحق:</div>
                    <div class="summary-value">${formatCurrency(totalProfit)}</div>
                </div>
                <div class="summary-row deduction">
                    <div class="summary-label">خصم الأقساط المستحقة:</div>
                    <div class="summary-value">- ${formatCurrency(totalDueAmount)}</div>
                </div>
                <div class="summary-row total">
                    <div class="summary-label">صافي الربح بعد الاستقطاع:</div>
                    <div class="summary-value">${formatCurrency(finalProfit)}</div>
                </div>
            </div>
        `;
        
        // إضافة قسم الأقساط إلى تفاصيل الأرباح
        profitDetails.appendChild(installmentsSection);
    }
    
    /**
     * نسخة محسنة من دالة عرض تفاصيل المستثمر
     * تقوم بإضافة قسم الأقساط في نافذة التفاصيل
     */
    function enhancedShowInvestorDetails(investorId) {
        console.log(`عرض تفاصيل المستثمر مع الأقساط: ${investorId}`);
        
        // التحقق من وجود المستثمر
        const investor = window.investors.find(inv => inv.id === investorId);
        if (!investor) {
            if (window._originalShowInvestorDetails) {
                window._originalShowInvestorDetails(investorId);
            }
            
            return;
        }
        
        // استدعاء الدالة الأصلية
        if (window._originalShowInvestorDetails) {
            window._originalShowInvestorDetails(investorId);
        }
        
        // بعد فترة قصيرة، نضيف قسم الأقساط
        setTimeout(() => {
            addInstallmentsToInvestorDetails(investor);
        }, 300);
    }
    
    /**
     * إضافة قسم الأقساط إلى نافذة تفاصيل المستثمر
     * @param {Object} investor - بيانات المستثمر
     */
    function addInstallmentsToInvestorDetails(investor) {
        // البحث عن عنصر التفاصيل
        const detailsContainer = document.querySelector('#investor-details-content');
        if (!detailsContainer) return;
        
        // التحقق من عدم وجود قسم الأقساط مسبقاً
        let installmentsSection = detailsContainer.querySelector('.installments-detail-group');
        if (installmentsSection) {
            installmentsSection.remove();
        }
        
        // إنشاء قسم الأقساط
        installmentsSection = document.createElement('div');
        installmentsSection.className = 'detail-group installments-detail-group';
        
        // الحصول على الأقساط المستحقة وغير المستحقة
        const dueInstallments = getDueInstallments(investor);
        const upcomingInstallments = investor.installments
            ? investor.installments.filter(installment => 
                installment.status !== 'paid' && 
                new Date(installment.dueDate) > new Date())
            : [];
        
        // حساب إجمالي الأقساط المستحقة
        const totalDueAmount = dueInstallments.reduce((sum, installment) => sum + installment.remainingAmount, 0);
        
        // حساب إجمالي الأقساط القادمة
        const totalUpcomingAmount = upcomingInstallments.reduce((sum, installment) => sum + installment.remainingAmount, 0);
        
        // تحديد عدد أقساط حالة المستثمر
        let statusMessage = '';
        let statusClass = '';
        
        if (dueInstallments.length > 0) {
            statusMessage = `${dueInstallments.length} قسط مستحق`;
            statusClass = 'status-urgent';
        } else if (upcomingInstallments.length > 0) {
            statusMessage = `${upcomingInstallments.length} قسط قادم`;
            statusClass = 'status-upcoming';
        } else if (investor.installments && investor.installments.some(i => i.status === 'paid')) {
            statusMessage = 'جميع الأقساط مسددة';
            statusClass = 'status-paid';
        } else {
            statusMessage = 'لا توجد أقساط';
            statusClass = 'status-none';
        }
        
        // إنشاء محتوى قسم الأقساط
        installmentsSection.innerHTML = `
            <h3 class="detail-group-title">
                الأقساط
                <span class="installment-status ${statusClass}">${statusMessage}</span>
                <button class="btn btn-sm btn-primary add-installment-btn" data-investor-id="${investor.id}">
                    <i class="fas fa-plus"></i>
                    <span>إضافة قسط</span>
                </button>
            </h3>
            
            ${dueInstallments.length > 0 ? `
                <div class="installments-summary due">
                    <div class="summary-title">
                        <i class="fas fa-exclamation-circle"></i>
                        أقساط مستحقة
                    </div>
                    <div class="summary-amount">${formatCurrency(totalDueAmount)}</div>
                </div>
                
                <div class="mini-table-container">
                    <table class="mini-table installments-table">
                        <thead>
                            <tr>
                                <th>الوصف</th>
                                <th>تاريخ الاستحقاق</th>
                                <th>المبلغ المتبقي</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dueInstallments.map(installment => `
                                <tr class="due-installment">
                                    <td>${installment.description}</td>
                                    <td>${formatDate(installment.dueDate)}</td>
                                    <td>${formatCurrency(installment.remainingAmount)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-success pay-installment-btn" data-investor-id="${investor.id}" data-installment-id="${installment.id}">
                                            <i class="fas fa-coins"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline edit-installment-btn" data-investor-id="${investor.id}" data-installment-id="${installment.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            ${upcomingInstallments.length > 0 ? `
                <div class="installments-summary upcoming">
                    <div class="summary-title">
                        <i class="fas fa-calendar-alt"></i>
                        أقساط قادمة
                    </div>
                    <div class="summary-amount">${formatCurrency(totalUpcomingAmount)}</div>
                </div>
                
                <div class="mini-table-container">
                    <table class="mini-table installments-table">
                        <thead>
                            <tr>
                                <th>الوصف</th>
                                <th>تاريخ الاستحقاق</th>
                                <th>المبلغ المتبقي</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${upcomingInstallments.map(installment => `
                                <tr class="upcoming-installment">
                                    <td>${installment.description}</td>
                                    <td>${formatDate(installment.dueDate)}</td>
                                    <td>${formatCurrency(installment.remainingAmount)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline edit-installment-btn" data-investor-id="${investor.id}" data-installment-id="${installment.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            ${(dueInstallments.length === 0 && upcomingInstallments.length === 0) ? `
                <div class="empty-installments">
                    <p>لا توجد أقساط حالية. يمكنك إضافة قسط جديد عن طريق الضغط على زر "إضافة قسط".</p>
                </div>
            ` : ''}
            
            ${investor.installments && investor.installments.some(i => i.status === 'paid') ? `
                <div class="view-history-link">
                    <a href="#" class="view-paid-installments" data-investor-id="${investor.id}">
                        <i class="fas fa-history"></i>
                        عرض سجل الأقساط المدفوعة
                    </a>
                </div>
            ` : ''}
        `;
        
        // إضافة قسم الأقساط إلى التفاصيل
        detailsContainer.appendChild(installmentsSection);
        
        // إضافة مستمعي الأحداث للأزرار
        setupInstallmentButtonsListeners(installmentsSection);
    }
    
    /**
     * إضافة واجهة إدارة الأقساط
     */
    function addInstallmentManagementUI() {
        // إضافة زر في القائمة الرئيسية
        const adminMenu = document.querySelector('.nav-list');
        if (adminMenu) {
            // التحقق من عدم وجود القائمة مسبقاً
            if (!document.querySelector('.nav-link[data-page="installments"]')) {
                // إنشاء عنصر القائمة
                const menuItem = document.createElement('li');
                menuItem.className = 'nav-item';
                menuItem.innerHTML = `
                    <a class="nav-link" data-page="installments" href="#">
                        <div class="nav-icon">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <span>الأقساط</span>
                    </a>
                `;
                
                // إضافة عنصر القائمة قبل عنصر الإعدادات
                const settingsMenuItem = document.querySelector('.nav-link[data-page="settings"]');
                if (settingsMenuItem) {
                    const settingsItem = settingsMenuItem.closest('.nav-item');
                    adminMenu.insertBefore(menuItem, settingsItem);
                } else {
                    adminMenu.appendChild(menuItem);
                }
                
                // إضافة مستمع حدث للتنقل
                menuItem.querySelector('.nav-link').addEventListener('click', function(e) {
                    e.preventDefault();
                    showInstallmentsPage();
                });
                
                console.log('تم إضافة زر الأقساط إلى القائمة الرئيسية');
            }
        }
        
        // إضافة صفحة الأقساط إذا لم تكن موجودة
        addInstallmentsPage();
        
        // إضافة النوافذ المنبثقة للأقساط
        addInstallmentModals();
    }
    
    /**
     * إضافة صفحة الأقساط
     */
    function addInstallmentsPage() {
        // التحقق من عدم وجود الصفحة مسبقاً
        if (document.getElementById('installments-page')) {
            return;
        }
        
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.className = 'page';
        pageElement.id = 'installments-page';
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">إدارة الأقساط</h1>
                <div class="header-actions">
                    <div class="search-box">
                        <input class="search-input" placeholder="بحث عن مستثمر..." type="text" />
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <button class="btn btn-primary" id="add-global-installment-btn">
                        <i class="fas fa-plus"></i>
                        <span>إضافة قسط جديد</span>
                    </button>
                </div>
            </div>
            
            <div class="installments-dashboard">
                <div class="dashboard-cards">
                    <div class="card">
                        <div class="card-pattern">
                            <i class="fas fa-money-check-alt"></i>
                        </div>
                        <div class="card-header">
                            <div>
                                <div class="card-title">إجمالي الأقساط المستحقة</div>
                                <div class="card-value" id="total-due-installments">0 دينار</div>
                                <div class="card-change">
                                    <span id="total-due-count">0 قسط</span>
                                </div>
                            </div>
                            <div class="card-icon danger">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-pattern">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="card-header">
                            <div>
                                <div class="card-title">الأقساط القادمة</div>
                                <div class="card-value" id="total-upcoming-installments">0 دينار</div>
                                <div class="card-change">
                                    <span id="total-upcoming-count">0 قسط</span>
                                </div>
                            </div>
                            <div class="card-icon warning">
                                <i class="fas fa-calendar-plus"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-pattern">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="card-header">
                            <div>
                                <div class="card-title">الأقساط المدفوعة</div>
                                <div class="card-value" id="total-paid-installments">0 دينار</div>
                                <div class="card-change">
                                    <span id="total-paid-count">0 قسط</span>
                                </div>
                            </div>
                            <div class="card-icon success">
                                <i class="fas fa-check-double"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-pattern">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="card-header">
                            <div>
                                <div class="card-title">نسبة التحصيل</div>
                                <div class="card-value" id="collection-rate">0%</div>
                                <div class="card-change">
                                    <i id="collection-trend" class="fas fa-arrow-up"></i>
                                    <span id="collection-change">0% من الشهر السابق</span>
                                </div>
                            </div>
                            <div class="card-icon info">
                                <i class="fas fa-chart-line"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">الأقساط المستحقة</h2>
                    <div class="section-actions">
                        <div class="btn-group">
                            <button class="btn btn-outline btn-sm active" data-filter="all">الكل</button>
                            <button class="btn btn-outline btn-sm" data-filter="overdue">متأخرة</button>
                            <button class="btn btn-outline btn-sm" data-filter="today">اليوم</button>
                            <button class="btn btn-outline btn-sm" data-filter="upcoming">قادمة</button>
                        </div>
                        <button class="btn btn-outline btn-sm" title="تصدير">
                            <i class="fas fa-download"></i>
                            <span>تصدير</span>
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table id="installments-table">
                        <thead>
                            <tr>
                                <th>المستثمر</th>
                                <th>وصف القسط</th>
                                <th>تاريخ الاستحقاق</th>
                                <th>المبلغ الإجمالي</th>
                                <th>المبلغ المتبقي</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- سيتم ملؤها ديناميكياً -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // إضافة الصفحة إلى المحتوى الرئيسي
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
            console.log('تم إضافة صفحة الأقساط بنجاح');
        }
        
        // إضافة مستمعي الأحداث للصفحة
        setupInstallmentsPageListeners(pageElement);
    }
    
    /**
     * إضافة النوافذ المنبثقة للأقساط
     */
    function addInstallmentModals() {
        // إضافة نافذة إضافة/تعديل قسط إذا لم تكن موجودة
        if (!document.getElementById('add-installment-modal')) {
            const modalElement = document.createElement('div');
            modalElement.className = 'modal-overlay';
            modalElement.id = 'add-installment-modal';
            
            modalElement.innerHTML = `
                <div class="modal animate__animated animate__fadeInUp">
                    <div class="modal-header">
                        <h3 class="modal-title" id="installment-modal-title">إضافة قسط جديد</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="installment-form">
                            <input type="hidden" id="installment-id" value="">
                            <input type="hidden" id="installment-investor-id" value="">
                            
                            <div class="form-group" id="investor-select-container">
                                <label class="form-label">المستثمر</label>
                                <select class="form-select" id="installment-investor" required>
                                    <option value="">اختر المستثمر</option>
                                    <!-- سيتم ملؤها ديناميكياً -->
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">وصف القسط</label>
                                <input type="text" class="form-input" id="installment-description" placeholder="مثال: قسط السيارة، قسط القرض، إلخ" required>
                            </div>
                            
                            <div class="grid-cols-2">
                                <div class="form-group">
                                    <label class="form-label">المبلغ الإجمالي</label>
                                    <input type="number" class="form-input" id="installment-amount" min="1" step="1000" required>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">تاريخ الاستحقاق</label>
                                    <input type="date" class="form-input" id="installment-due-date" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">ملاحظات</label>
                                <textarea class="form-input" id="installment-notes" rows="3"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <div class="form-check">
                                    <input type="checkbox" id="installment-priority" value="high">
                                    <label for="installment-priority">قسط ذو أولوية عالية</label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close-btn">إلغاء</button>
                        <button class="btn btn-primary" id="save-installment-btn">حفظ</button>
                    </div>
                </div>
            `;
            
            // إضافة النافذة للجسم
            document.body.appendChild(modalElement);
            
            // إضافة مستمعي الأحداث للنافذة
            setupInstallmentModalListeners(modalElement);
        }
        
        // إضافة نافذة تأكيد استقطاع الأقساط
        if (!document.getElementById('installment-confirmation-modal')) {
            const confirmationModal = document.createElement('div');
            confirmationModal.className = 'modal-overlay';
            confirmationModal.id = 'installment-confirmation-modal';
            
            confirmationModal.innerHTML = `
                <div class="modal animate__animated animate__fadeInUp">
                    <div class="modal-header">
                        <h3 class="modal-title">تأكيد استقطاع الأقساط</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="confirmation-content">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                <span>يوجد أقساط مستحقة على المستثمر. هل ترغب في استقطاعها من الأرباح؟</span>
                            </div>
                            
                            <div id="installment-deduction-details"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" id="pay-without-deduction-btn">دفع الأرباح بدون استقطاع</button>
                        <button class="btn btn-primary" id="pay-with-deduction-btn">دفع مع استقطاع الأقساط</button>
                    </div>
                </div>
            `;
            
            // إضافة النافذة للجسم
            document.body.appendChild(confirmationModal);
            
            // إضافة مستمعي الأحداث للنافذة
            setupConfirmationModalListeners(confirmationModal);
        }
        
        // إضافة نافذة تفاصيل سجل الأقساط المدفوعة
        if (!document.getElementById('installment-history-modal')) {
            const historyModal = document.createElement('div');
            historyModal.className = 'modal-overlay';
            historyModal.id = 'installment-history-modal';
            
            historyModal.innerHTML = `
                <div class="modal animate__animated animate__fadeInUp">
                    <div class="modal-header">
                        <h3 class="modal-title">سجل الأقساط المدفوعة</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="installment-history-content"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close-btn">إغلاق</button>
                        <button class="btn btn-outline" id="export-history-btn">
                            <i class="fas fa-download"></i>
                            <span>تصدير السجل</span>
                        </button>
                    </div>
                </div>
            `;
            
            // إضافة النافذة للجسم
            document.body.appendChild(historyModal);
            
            // إضافة مستمعي الأحداث للنافذة
            setupHistoryModalListeners(historyModal);
        }
    }
    
    /**
     * إضافة مستمعي الأحداث لنافذة إضافة/تعديل قسط
     * @param {HTMLElement} modalElement - عنصر النافذة المنبثقة
     */
    function setupInstallmentModalListeners(modalElement) {
        // زر حفظ القسط
        const saveButton = modalElement.querySelector('#save-installment-btn');
        if (saveButton) {
            saveButton.addEventListener('click', function() {
                saveInstallment();
            });
        }
        
        // تعيين التاريخ الافتراضي
        const dueDateInput = modalElement.querySelector('#installment-due-date');
        if (dueDateInput) {
            // تعيين تاريخ اليوم كقيمة افتراضية
            dueDateInput.value = new Date().toISOString().split('T')[0];
        }
    }
    
    /**
     * إضافة مستمعي الأحداث لنافذة تأكيد استقطاع الأقساط
     * @param {HTMLElement} modalElement - عنصر النافذة المنبثقة
     */
    function setupConfirmationModalListeners(modalElement) {
        // زر دفع الأرباح مع استقطاع الأقساط
        const payWithDeductionBtn = modalElement.querySelector('#pay-with-deduction-btn');
        if (payWithDeductionBtn) {
            payWithDeductionBtn.addEventListener('click', function() {
                const callback = modalElement._confirmCallback;
                if (typeof callback === 'function') {
                    callback(true);
                }
                closeModal('installment-confirmation-modal');
            });
        }
        
        // زر دفع الأرباح بدون استقطاع الأقساط
        const payWithoutDeductionBtn = modalElement.querySelector('#pay-without-deduction-btn');
        if (payWithoutDeductionBtn) {
            payWithoutDeductionBtn.addEventListener('click', function() {
                const callback = modalElement._confirmCallback;
                if (typeof callback === 'function') {
                    callback(false);
                }
                closeModal('installment-confirmation-modal');
            });
        }
    }
    
    /**
     * إضافة مستمعي الأحداث لنافذة سجل الأقساط المدفوعة
     * @param {HTMLElement} modalElement - عنصر النافذة المنبثقة
     */
    function setupHistoryModalListeners(modalElement) {
        // زر تصدير السجل
        const exportButton = modalElement.querySelector('#export-history-btn');
        if (exportButton) {
            exportButton.addEventListener('click', function() {
                exportInstallmentHistory();
            });
        }
    }
    
    /**
     * إضافة مستمعي الأحداث لصفحة الأقساط
     * @param {HTMLElement} pageElement - عنصر الصفحة
     */
    function setupInstallmentsPageListeners(pageElement) {
        // أزرار التصفية
        const filterButtons = pageElement.querySelectorAll('.btn-group .btn[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // إزالة الكلاس النشط من جميع الأزرار
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // إضافة الكلاس النشط للزر المحدد
                this.classList.add('active');
                
                // تصفية الأقساط حسب الفلتر المحدد
                const filter = this.getAttribute('data-filter');
                filterInstallments(filter);
            });
        });
        
        // زر إضافة قسط جديد
        const addButton = pageElement.querySelector('#add-global-installment-btn');
        if (addButton) {
            addButton.addEventListener('click', function() {
                showAddInstallmentModal();
            });
        }
        
        // حقل البحث
        const searchInput = pageElement.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchInstallments(this.value);
            });
        }
    }
    
    /**
     * إضافة مستمعي الأحداث لأزرار الأقساط في تفاصيل المستثمر
     * @param {HTMLElement} container - حاوية تفاصيل المستثمر
     */
    function setupInstallmentButtonsListeners(container) {
        // زر إضافة قسط
        const addButton = container.querySelector('.add-installment-btn');
        if (addButton) {
            addButton.addEventListener('click', function() {
                const investorId = this.getAttribute('data-investor-id');
                showAddInstallmentModal(investorId);
            });
        }
        
        // أزرار دفع الأقساط
        const payButtons = container.querySelectorAll('.pay-installment-btn');
        payButtons.forEach(button => {
            button.addEventListener('click', function() {
                const investorId = this.getAttribute('data-investor-id');
                const installmentId = this.getAttribute('data-installment-id');
                payInstallment(investorId, installmentId);
            });
        });
        
        // أزرار تعديل الأقساط
        const editButtons = container.querySelectorAll('.edit-installment-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const investorId = this.getAttribute('data-investor-id');
                const installmentId = this.getAttribute('data-installment-id');
                editInstallment(investorId, installmentId);
            });
        });
        
        // رابط عرض سجل الأقساط المدفوعة
        const historyLink = container.querySelector('.view-paid-installments');
        if (historyLink) {
            historyLink.addEventListener('click', function(e) {
                e.preventDefault();
                const investorId = this.getAttribute('data-investor-id');
                showInstallmentHistory(investorId);
            });
        }
    }
    
    /**
     * عرض نافذة إضافة قسط جديد
     * @param {string} investorId - معرف المستثمر (اختياري)
     */
    function showAddInstallmentModal(investorId = null) {
        // إعادة تعيين النموذج
        const form = document.getElementById('installment-form');
        if (form) {
            form.reset();
        }
        
        // تعيين العنوان
        const title = document.getElementById('installment-modal-title');
        if (title) {
            title.textContent = 'إضافة قسط جديد';
        }
        
        // تعيين تاريخ اليوم كقيمة افتراضية
        const dueDateInput = document.getElementById('installment-due-date');
        if (dueDateInput) {
            dueDateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // إعادة تعيين حقول المعرفات
        document.getElementById('installment-id').value = '';
        document.getElementById('installment-investor-id').value = investorId || '';
        
        // التعامل مع حاوية اختيار المستثمر
        const investorSelectContainer = document.getElementById('investor-select-container');
        const investorSelect = document.getElementById('installment-investor');
        
        if (investorId) {
            // إخفاء قائمة اختيار المستثمر عند تحديد مستثمر مسبقاً
            if (investorSelectContainer) {
                investorSelectContainer.style.display = 'none';
            }
        } else {
            // إظهار قائمة اختيار المستثمر وملؤها
            if (investorSelectContainer) {
                investorSelectContainer.style.display = 'block';
            }
            
            if (investorSelect) {
                // ملء قائمة المستثمرين
                populateInvestorsList(investorSelect);
            }
        }
        
        // فتح النافذة
        openModal('add-installment-modal');
    }
    
    /**
     * عرض نافذة تعديل قسط محدد
     * @param {string} investorId - معرف المستثمر
     * @param {string} installmentId - معرف القسط
     */
    function editInstallment(investorId, installmentId) {
        // البحث عن المستثمر والقسط
        const investor = window.investors.find(inv => inv.id === investorId);
        if (!investor || !investor.installments) {
            showNotification('لم يتم العثور على بيانات المستثمر أو الأقساط', 'error');
            return;
        }
        
        const installment = investor.installments.find(inst => inst.id === installmentId);
        if (!installment) {
            showNotification('لم يتم العثور على بيانات القسط', 'error');
            return;
        }
        
        // تعيين العنوان
        const title = document.getElementById('installment-modal-title');
        if (title) {
            title.textContent = 'تعديل القسط';
        }
        
        // ملء النموذج ببيانات القسط
        document.getElementById('installment-id').value = installmentId;
        document.getElementById('installment-investor-id').value = investorId;
        document.getElementById('installment-description').value = installment.description || '';
        document.getElementById('installment-amount').value = installment.amount || 0;
        document.getElementById('installment-due-date').value = installment.dueDate || '';
        document.getElementById('installment-notes').value = installment.notes || '';
        
        const priorityCheckbox = document.getElementById('installment-priority');
        if (priorityCheckbox) {
            priorityCheckbox.checked = installment.priority === 'high';
        }
        
        // إخفاء قائمة اختيار المستثمر
        const investorSelectContainer = document.getElementById('investor-select-container');
        if (investorSelectContainer) {
            investorSelectContainer.style.display = 'none';
        }
        
        // فتح النافذة
        openModal('add-installment-modal');
    }
    
    /**
     * حفظ بيانات القسط (إضافة جديد أو تعديل قائم)
     */
    function saveInstallment() {
        // الحصول على بيانات النموذج
        const installmentId = document.getElementById('installment-id').value;
        let investorId = document.getElementById('installment-investor-id').value;
        
        // إذا لم يتم تحديد مستثمر مسبقاً، نحصل عليه من القائمة
        if (!investorId) {
            const investorSelect = document.getElementById('installment-investor');
            if (investorSelect) {
                investorId = investorSelect.value;
            }
        }
        
        // التحقق من اختيار مستثمر
        if (!investorId) {
            showNotification('الرجاء اختيار مستثمر', 'error');
            return;
        }
        
        // الحصول على باقي البيانات
        const description = document.getElementById('installment-description').value;
        const amount = parseFloat(document.getElementById('installment-amount').value);
        const dueDate = document.getElementById('installment-due-date').value;
        const notes = document.getElementById('installment-notes').value;
        const priorityCheckbox = document.getElementById('installment-priority');
        const priority = priorityCheckbox && priorityCheckbox.checked ? 'high' : 'normal';
        
        // التحقق من صحة البيانات
        if (!description || isNaN(amount) || amount <= 0 || !dueDate) {
            showNotification('الرجاء ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
            return;
        }
        
        // البحث عن المستثمر
        const investor = window.investors.find(inv => inv.id === investorId);
        if (!investor) {
            showNotification('لم يتم العثور على بيانات المستثمر', 'error');
            return;
        }
        
        // التأكد من وجود مصفوفة الأقساط
        if (!investor.installments) {
            investor.installments = [];
        }
        
        // تحديد ما إذا كنا نضيف قسطاً جديداً أو نعدل قسطاً موجوداً
        if (installmentId) {
            // تعديل قسط موجود
            const existingIndex = investor.installments.findIndex(inst => inst.id === installmentId);
            if (existingIndex === -1) {
                showNotification('لم يتم العثور على بيانات القسط', 'error');
                return;
            }
            
            // الحفاظ على المبلغ المدفوع من القسط الأصلي
            const paidAmount = investor.installments[existingIndex].paidAmount || 0;
            const remainingAmount = Math.max(0, amount - paidAmount);
            
            // تحديث بيانات القسط
            investor.installments[existingIndex] = {
                ...investor.installments[existingIndex],
                description,
                amount,
                dueDate,
                notes,
                priority,
                remainingAmount,
                updatedAt: new Date().toISOString()
            };
            
            // تحديث حالة القسط بناءً على المبلغ المتبقي
            if (remainingAmount <= 0) {
                investor.installments[existingIndex].status = 'paid';
            } else {
                investor.installments[existingIndex].status = 'active';
            }
            
            showNotification('تم تحديث بيانات القسط بنجاح', 'success');
        } else {
            // إضافة قسط جديد
            const newInstallment = {
                id: Date.now().toString(),
                description,
                amount,
                dueDate,
                notes,
                priority,
                status: 'active',
                paidAmount: 0,
                remainingAmount: amount,
                createdAt: new Date().toISOString()
            };
            
            investor.installments.push(newInstallment);
            showNotification('تم إضافة القسط الجديد بنجاح', 'success');
        }
        
        // حفظ البيانات
        if (typeof window.saveData === 'function') {
            window.saveData();
        }
        
        // إغلاق النافذة
        closeModal('add-installment-modal');
        
        // تحديث واجهة المستخدم
        if (document.querySelector('#installments-page.active')) {
            renderInstallmentsTable();
            updateInstallmentsDashboard();
        } else if (document.getElementById('investor-details-content')) {
            // إذا كنا في صفحة تفاصيل المستثمر، نقوم بتحديثها
            setTimeout(() => {
                addInstallmentsToInvestorDetails(investor);
            }, 100);
        }
    }
    
    /**
     * دفع قسط محدد
     * @param {string} investorId - معرف المستثمر
     * @param {string} installmentId - معرف القسط
     */
    function payInstallment(investorId, installmentId) {
        // البحث عن المستثمر والقسط
        const investor = window.investors.find(inv => inv.id === investorId);
        if (!investor || !investor.installments) {
            showNotification('لم يتم العثور على بيانات المستثمر أو الأقساط', 'error');
            return;
        }
        
        const installmentIndex = investor.installments.findIndex(inst => inst.id === installmentId);
        if (installmentIndex === -1) {
            showNotification('لم يتم العثور على بيانات القسط', 'error');
            return;
        }
        
        const installment = investor.installments[installmentIndex];
        
        // التحقق من حالة القسط
        if (installment.status === 'paid') {
            showNotification('هذا القسط مدفوع بالفعل', 'warning');
            return;
        }
        
        // طلب تأكيد دفع القسط
        if (confirm(`هل أنت متأكد من رغبتك في تسديد القسط "${installment.description}" بقيمة ${formatCurrency(installment.remainingAmount)}؟`)) {
            // تسجيل عملية دفع القسط
            const paymentTransaction = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                type: 'دفع قسط',
                investorId,
                investorName: investor.name,
                amount: installment.remainingAmount,
                notes: `دفع قسط: ${installment.description}`
            };
            
            // إضافة العملية إلى سجل العمليات
            if (Array.isArray(window.transactions)) {
                window.transactions.push(paymentTransaction);
            }
            
            // تحديث بيانات القسط
            installment.status = 'paid';
            installment.paidAmount = installment.amount;
            installment.remainingAmount = 0;
            installment.paidDate = new Date().toISOString().split('T')[0];
            installment.paymentMethod = 'manual';
            
            // حفظ البيانات
            if (typeof window.saveData === 'function') {
                window.saveData();
            }
            
            showNotification('تم تسديد القسط بنجاح', 'success');
            
            // تحديث واجهة المستخدم
            if (document.querySelector('#installments-page.active')) {
                renderInstallmentsTable();
                updateInstallmentsDashboard();
            } else if (document.getElementById('investor-details-content')) {
                // إذا كنا في صفحة تفاصيل المستثمر، نقوم بتحديثها
                setTimeout(() => {
                    addInstallmentsToInvestorDetails(investor);
                }, 100);
            }
        }
    }
    
    /**
     * عرض سجل الأقساط المدفوعة لمستثمر محدد
     * @param {string} investorId - معرف المستثمر
     */
    function showInstallmentHistory(investorId) {
        // البحث عن المستثمر
        const investor = window.investors.find(inv => inv.id === investorId);
        if (!investor || !investor.installments) {
            showNotification('لم يتم العثور على بيانات المستثمر أو الأقساط', 'error');
            return;
        }
        
        // الحصول على الأقساط المدفوعة
        const paidInstallments = investor.installments.filter(inst => inst.status === 'paid');
        
        // إعداد محتوى السجل
        const historyContent = document.getElementById('installment-history-content');
        if (!historyContent) return;
        
        if (paidInstallments.length === 0) {
            historyContent.innerHTML = `
                <div class="empty-history">
                    <p>لا توجد أقساط مدفوعة لهذا المستثمر.</p>
                </div>
            `;
        } else {
            // ترتيب الأقساط المدفوعة حسب تاريخ الدفع (الأحدث أولاً)
            paidInstallments.sort((a, b) => new Date(b.paidDate || b.updatedAt || b.createdAt) - new Date(a.paidDate || a.updatedAt || a.createdAt));
            
            historyContent.innerHTML = `
                <div class="investor-profile">
                    <div class="investor-avatar large">${investor.name.charAt(0)}</div>
                    <h2 class="investor-fullname">${investor.name}</h2>
                </div>
                
                <h3 class="section-title">سجل الأقساط المدفوعة</h3>
                
                <div class="table-container">
                    <table class="installments-table">
                        <thead>
                            <tr>
                                <th>وصف القسط</th>
                                <th>تاريخ الاستحقاق</th>
                                <th>المبلغ</th>
                                <th>تاريخ الدفع</th>
                                <th>طريقة السداد</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paidInstallments.map(inst => `
                                <tr>
                                    <td>${inst.description}</td>
                                    <td>${formatDate(inst.dueDate)}</td>
                                    <td>${formatCurrency(inst.amount)}</td>
                                    <td>${formatDate(inst.paidDate || inst.updatedAt)}</td>
                                    <td>${inst.paymentMethod === 'auto' ? 'تلقائي (من الأرباح)' : 'يدوي'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2"><strong>إجمالي المدفوعات</strong></td>
                                <td colspan="3"><strong>${formatCurrency(paidInstallments.reduce((sum, inst) => sum + inst.amount, 0))}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }
        
        // فتح النافذة
        openModal('installment-history-modal');
    }
    
    /**
     * تصدير سجل الأقساط المدفوعة
     */
    function exportInstallmentHistory() {
        // التحقق من وجود بيانات
        const historyContent = document.getElementById('installment-history-content');
        if (!historyContent) return;
        
        try {
            // البحث عن اسم المستثمر
            const investorName = historyContent.querySelector('.investor-fullname')?.textContent || 'مستثمر';
            
            // تحويل جدول الأقساط إلى CSV
            const table = historyContent.querySelector('table');
            if (!table) {
                showNotification('لا توجد بيانات للتصدير', 'error');
                return;
            }
            
            // تجميع البيانات
            const rows = [];
            
            // إضافة العناوين
            const headers = [];
            table.querySelectorAll('thead th').forEach(th => {
                headers.push(th.textContent.trim());
            });
            rows.push(headers.join(','));
            
            // إضافة البيانات
            table.querySelectorAll('tbody tr').forEach(tr => {
                const rowData = [];
                tr.querySelectorAll('td').forEach(td => {
                    // تنظيف النص من الفواصل
                    const text = td.textContent.trim().replace(/,/g, ' ');
                    rowData.push(text);
                });
                rows.push(rowData.join(','));
            });
            
            // إضافة المجموع
            const footerRow = [];
            table.querySelectorAll('tfoot td').forEach(td => {
                footerRow.push(td.textContent.trim().replace(/,/g, ' '));
            });
            rows.push(footerRow.join(','));
            
            // إنشاء CSV
            const csvContent = rows.join('\n');
            
            // إنشاء رابط التنزيل
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `سجل_أقساط_${investorName}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.display = 'none';
            
            // إضافة الرابط وتنفيذ النقر
            document.body.appendChild(link);
            link.click();
            
            // تنظيف
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('تم تصدير سجل الأقساط بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في تصدير سجل الأقساط:', error);
            showNotification('حدث خطأ أثناء تصدير البيانات', 'error');
        }
    }
    
    /**
     * عرض نافذة تأكيد استقطاع الأقساط
     * @param {Object} investor - بيانات المستثمر
     * @param {number} totalProfit - إجمالي الأرباح المستحقة
     * @param {Function} callback - دالة الاستدعاء عند اختيار المستخدم
     */
    function showInstallmentConfirmationModal(investor, totalProfit, callback) {
        // الحصول على الأقساط المستحقة
        const dueInstallments = getDueInstallments(investor);
        
        // إذا لم تكن هناك أقساط مستحقة، استدعاء دالة الاستدعاء ونخرج
        if (dueInstallments.length === 0) {
            callback(false);
            return;
        }
        
        // حساب إجمالي الأقساط المستحقة
        const totalDueAmount = dueInstallments.reduce((sum, installment) => sum + installment.remainingAmount, 0);
        
        // حساب الربح النهائي بعد استقطاع الأقساط
        const finalProfit = Math.max(0, totalProfit - totalDueAmount);
        
        // إعداد محتوى التأكيد
        const contentElement = document.getElementById('installment-deduction-details');
        if (!contentElement) {
            callback(false);
            return;
        }
        
        contentElement.innerHTML = `
            <div class="installment-confirmation-details">
                <div class="investor-info-banner">
                    <div class="investor-avatar">${investor.name.charAt(0)}</div>
                    <div class="investor-details">
                        <div class="investor-name">${investor.name}</div>
                        <div class="installments-badge">${dueInstallments.length} قسط مستحق</div>
                    </div>
                </div>
                
                <div class="profit-summary">
                    <div class="summary-row">
                        <div class="summary-label">إجمالي الربح المستحق:</div>
                        <div class="summary-value">${formatCurrency(totalProfit)}</div>
                    </div>
                    <div class="summary-row deduction">
                        <div class="summary-label">خصم الأقساط المستحقة:</div>
                        <div class="summary-value">- ${formatCurrency(totalDueAmount)}</div>
                    </div>
                    <div class="separator"></div>
                    <div class="summary-row total">
                        <div class="summary-label">صافي الربح بعد الاستقطاع:</div>
                        <div class="summary-value">${formatCurrency(finalProfit)}</div>
                    </div>
                </div>
                
                <table class="installments-table">
                    <thead>
                        <tr>
                            <th>وصف القسط</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>المبلغ المستحق</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dueInstallments.map(installment => `
                            <tr>
                                <td>${installment.description}</td>
                                <td>${formatDate(installment.dueDate)}</td>
                                <td>${formatCurrency(installment.remainingAmount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2"><strong>إجمالي الأقساط المستحقة</strong></td>
                            <td><strong>${formatCurrency(totalDueAmount)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
        
        // حفظ دالة الاستدعاء في النافذة
        const modalElement = document.getElementById('installment-confirmation-modal');
        if (modalElement) {
            modalElement._confirmCallback = callback;
        }
        
        // فتح النافذة
        openModal('installment-confirmation-modal');
    }
    
    /**
     * معالجة استقطاع الأقساط من الأرباح
     * @param {Object} investor - بيانات المستثمر
     * @param {Array} dueInstallments - الأقساط المستحقة
     * @param {number} totalDueAmount - إجمالي الأقساط المستحقة
     * @param {number} totalProfit - إجمالي الأرباح
     * @param {number} finalProfit - صافي الربح بعد الاستقطاع
     */
    function processInstallmentDeduction(investor, dueInstallments, totalDueAmount, totalProfit, finalProfit) {
        try {
            // التأكد من أن المبلغ المستقطع أقل من أو يساوي إجمالي الأرباح
            const deductionAmount = Math.min(totalDueAmount, totalProfit);
            
            // تسجيل عملية دفع الأرباح بعد الاستقطاع
            // تسجيل عملية دفع الأرباح المتبقية
            investor.profits.push({
                date: new Date().toISOString().split('T')[0],
                amount: finalProfit
            });
            
            // إضافة عملية جديدة بنوع "دفع أرباح"
            addTransaction('دفع أرباح', investor.id, finalProfit, 'دفع أرباح مستحقة بعد استقطاع الأقساط');
            
            // معالجة الأقساط المستحقة
            if (deductionAmount > 0) {
                // ترتيب الأقساط حسب الأولوية (عالية أولاً) ثم حسب تاريخ الاستحقاق
                const sortedInstallments = [...dueInstallments].sort((a, b) => {
                    // الترتيب حسب الأولوية أولاً
                    if (a.priority === 'high' && b.priority !== 'high') return -1;
                    if (a.priority !== 'high' && b.priority === 'high') return 1;
                    
                    // ثم حسب تاريخ الاستحقاق (الأقدم أولاً)
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                
                let remainingDeduction = deductionAmount;
                
                // تسديد الأقساط بالترتيب حتى استنفاد المبلغ المستقطع
                for (let i = 0; i < sortedInstallments.length && remainingDeduction > 0; i++) {
                    const installment = sortedInstallments[i];
                    
                    // العثور على القسط في مصفوفة المستثمر
                    const originalIndex = investor.installments.findIndex(inst => inst.id === installment.id);
                    if (originalIndex === -1) continue;
                    
                    // تحديد المبلغ المستقطع من هذا القسط
                    const amountToDeduct = Math.min(remainingDeduction, installment.remainingAmount);
                    
                    // تحديث المبلغ المدفوع والمتبقي
                    const currentPaidAmount = investor.installments[originalIndex].paidAmount || 0;
                    investor.installments[originalIndex].paidAmount = currentPaidAmount + amountToDeduct;
                    investor.installments[originalIndex].remainingAmount = Math.max(0, installment.remainingAmount - amountToDeduct);
                    
                    // تحديث حالة القسط إذا تم سداده بالكامل
                    if (investor.installments[originalIndex].remainingAmount <= 0) {
                        investor.installments[originalIndex].status = 'paid';
                        investor.installments[originalIndex].paidDate = new Date().toISOString().split('T')[0];
                        investor.installments[originalIndex].paymentMethod = 'auto';
                    }
                    
                    // تحديث المبلغ المتبقي للاستقطاع
                    remainingDeduction -= amountToDeduct;
                    
                    // تسجيل عملية دفع القسط
                    addTransaction('دفع قسط', investor.id, amountToDeduct, `سداد قسط: ${installment.description} (من الأرباح)`);
                }
                
                // إضافة عملية استقطاع الأقساط من الأرباح
                addTransaction('استقطاع أقساط', investor.id, deductionAmount, `استقطاع أقساط مستحقة من الأرباح`);
            }
            
            // حفظ البيانات
            saveData();
            
            // عرض إشعار النجاح
            showNotification(`تم دفع الأرباح مع استقطاع الأقساط المستحقة بنجاح!`, 'success');
            
            // إغلاق النافذة المنبثقة
            closeModal('pay-profit-modal');
        } catch (error) {
            console.error('خطأ في معالجة استقطاع الأقساط:', error);
            showNotification('حدث خطأ أثناء معالجة استقطاع الأقساط', 'error');
        }
    }
    
    /**
     * الحصول على الأقساط المستحقة لمستثمر محدد
     * @param {Object} investor - بيانات المستثمر
     * @returns {Array} - مصفوفة الأقساط المستحقة
     */
    function getDueInstallments(investor) {
        if (!investor || !investor.installments) {
            return [];
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return investor.installments.filter(installment => {
            // التحقق من أن القسط غير مدفوع
            if (installment.status === 'paid') {
                return false;
            }
            
            // التحقق من تاريخ الاستحقاق
            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            // القسط مستحق إذا كان تاريخ استحقاقه يسبق أو يساوي اليوم
            return dueDate <= today && installment.remainingAmount > 0;
        });
    }
    
    /**
     * عرض صفحة الأقساط وتحديثها
     */
    function showInstallmentsPage() {
        // تنشيط صفحة الأقساط
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        const installmentsPage = document.getElementById('installments-page');
        if (installmentsPage) {
            installmentsPage.classList.add('active');
            
            // تحديث الروابط النشطة في القائمة
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            const installmentsLink = document.querySelector('.nav-link[data-page="installments"]');
            if (installmentsLink) {
                installmentsLink.classList.add('active');
            }
            
            // تحديث بيانات الصفحة
            renderInstallmentsTable();
            updateInstallmentsDashboard();
        }
    }
    
    /**
     * تصيير جدول الأقساط
     * @param {string} filter - فلتر لاستخدامه (all, overdue, today, upcoming)
     */
    function renderInstallmentsTable(filter = 'all') {
        const tableBody = document.querySelector('#installments-table tbody');
        if (!tableBody) return;
        
        // تجميع جميع الأقساط من جميع المستثمرين
        const allInstallments = [];
        
        investors.forEach(investor => {
            if (!investor.installments) return;
            
            investor.installments.forEach(installment => {
                if (installment.status === 'paid') return; // تجاهل الأقساط المدفوعة
                
                allInstallments.push({
                    ...installment,
                    investorId: investor.id,
                    investorName: investor.name
                });
            });
        });
        
        // تصفية الأقساط حسب الفلتر المحدد
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredInstallments = allInstallments.filter(installment => {
            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            switch (filter) {
                case 'overdue':
                    return dueDate < today;
                case 'today':
                    return dueDate.getTime() === today.getTime();
                case 'upcoming':
                    return dueDate > today;
                default:
                    return true;
            }
        });
        
        // ترتيب الأقساط حسب تاريخ الاستحقاق
        filteredInstallments.sort((a, b) => {
            // الترتيب حسب الأولوية أولاً
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            
            // ثم حسب تاريخ الاستحقاق
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // إنشاء صفوف الجدول
        if (filteredInstallments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">لا توجد أقساط مستحقة</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = filteredInstallments.map(installment => {
            const dueDate = new Date(installment.dueDate);
            const isOverdue = dueDate < today;
            const isDueToday = dueDate.getTime() === today.getTime();
            
            let statusClass = '';
            let statusText = '';
            
            if (isOverdue) {
                statusClass = 'status-overdue';
                statusText = 'متأخر';
            } else if (isDueToday) {
                statusClass = 'status-today';
                statusText = 'اليوم';
            } else {
                statusClass = 'status-upcoming';
                statusText = 'قادم';
            }
            
            return `
                <tr class="${statusClass} ${installment.priority === 'high' ? 'priority-high' : ''}">
                    <td>
                        <div class="investor-info">
                            <div class="investor-avatar">${installment.investorName.charAt(0)}</div>
                            <div>
                                <div class="investor-name">${installment.investorName}</div>
                                <div class="investor-id">${installment.investorId}</div>
                            </div>
                        </div>
                    </td>
                    <td>${installment.description}
                        ${installment.priority === 'high' ? '<span class="priority-badge">أولوية عالية</span>' : ''}
                    </td>
                    <td>${formatDate(installment.dueDate)}</td>
                    <td>${formatCurrency(installment.amount)}</td>
                    <td>${formatCurrency(installment.remainingAmount)}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-success pay-installment-btn" data-investor-id="${installment.investorId}" data-installment-id="${installment.id}" title="دفع القسط">
                                <i class="fas fa-coins"></i>
                            </button>
                            <button class="btn btn-sm btn-outline edit-installment-btn" data-investor-id="${installment.investorId}" data-installment-id="${installment.id}" title="تعديل القسط">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline investor-details-btn" data-investor-id="${installment.investorId}" title="تفاصيل المستثمر">
                                <i class="fas fa-user"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // إضافة مستمعي الأحداث للأزرار
        setupInstallmentTableButtonsListeners(tableBody);
    }
    
    /**
     * إضافة مستمعي الأحداث لأزرار جدول الأقساط
     * @param {HTMLElement} tableBody - جسم الجدول
     */
    function setupInstallmentTableButtonsListeners(tableBody) {
        // أزرار دفع الأقساط
        const payButtons = tableBody.querySelectorAll('.pay-installment-btn');
        payButtons.forEach(button => {
            button.addEventListener('click', function() {
                const investorId = this.getAttribute('data-investor-id');
                const installmentId = this.getAttribute('data-installment-id');
                payInstallment(investorId, installmentId);
            });
        });
        
        // أزرار تعديل الأقساط
        const editButtons = tableBody.querySelectorAll('.edit-installment-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const investorId = this.getAttribute('data-investor-id');
                const installmentId = this.getAttribute('data-installment-id');
                editInstallment(investorId, installmentId);
            });
        });
        
        // أزرار تفاصيل المستثمر
        const detailsButtons = tableBody.querySelectorAll('.investor-details-btn');
        detailsButtons.forEach(button => {
            button.addEventListener('click', function() {
                const investorId = this.getAttribute('data-investor-id');
                if (typeof window.showInvestorDetails === 'function') {
                    window.showInvestorDetails(investorId);
                }
            });
        });
    }
    
    /**
     * تصفية جدول الأقساط
     * @param {string} filter - الفلتر المطلوب (all, overdue, today, upcoming)
     */
    function filterInstallments(filter) {
        renderInstallmentsTable(filter);
    }
    
    /**
     * البحث في جدول الأقساط
     * @param {string} searchText - نص البحث
     */
    function searchInstallments(searchText) {
        if (!searchText) {
            renderInstallmentsTable();
            return;
        }
        
        searchText = searchText.toLowerCase();
        
        const tableBody = document.querySelector('#installments-table tbody');
        if (!tableBody) return;
        
        // إخفاء الصفوف غير المطابقة
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const investorName = row.querySelector('.investor-name')?.textContent || '';
            const description = row.querySelector('td:nth-child(2)')?.textContent || '';
            
            if (investorName.toLowerCase().includes(searchText) || description.toLowerCase().includes(searchText)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    /**
     * تحديث لوحة معلومات الأقساط
     */
    function updateInstallmentsDashboard() {
        // تجميع إحصائيات الأقساط
        let totalDueAmount = 0;
        let totalDueCount = 0;
        
        let totalUpcomingAmount = 0;
        let totalUpcomingCount = 0;
        
        let totalPaidAmount = 0;
        let totalPaidCount = 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        investors.forEach(investor => {
            if (!investor.installments) return;
            
            investor.installments.forEach(installment => {
                const dueDate = new Date(installment.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                
                if (installment.status === 'paid') {
                    totalPaidAmount += installment.amount;
                    totalPaidCount++;
                } else if (dueDate <= today) {
                    totalDueAmount += installment.remainingAmount;
                    totalDueCount++;
                } else {
                    totalUpcomingAmount += installment.remainingAmount;
                    totalUpcomingCount++;
                }
            });
        });
        
        // تحديث عناصر لوحة المعلومات
        const totalDueElement = document.getElementById('total-due-installments');
        const totalDueCountElement = document.getElementById('total-due-count');
        if (totalDueElement) totalDueElement.textContent = formatCurrency(totalDueAmount, false) + ' ' + (window.settings?.currency || 'دينار');
        if (totalDueCountElement) totalDueCountElement.textContent = formatInstallmentCount(totalDueCount);
        
        const totalUpcomingElement = document.getElementById('total-upcoming-installments');
        const totalUpcomingCountElement = document.getElementById('total-upcoming-count');
        if (totalUpcomingElement) totalUpcomingElement.textContent = formatCurrency(totalUpcomingAmount, false) + ' ' + (window.settings?.currency || 'دينار');
        if (totalUpcomingCountElement) totalUpcomingCountElement.textContent = formatInstallmentCount(totalUpcomingCount);
        
        const totalPaidElement = document.getElementById('total-paid-installments');
        const totalPaidCountElement = document.getElementById('total-paid-count');
        if (totalPaidElement) totalPaidElement.textContent = formatCurrency(totalPaidAmount, false) + ' ' + (window.settings?.currency || 'دينار');
        if (totalPaidCountElement) totalPaidCountElement.textContent = formatInstallmentCount(totalPaidCount);
        
        // حساب نسبة التحصيل
        const totalAmount = totalDueAmount + totalUpcomingAmount + totalPaidAmount;
        const collectionRate = totalAmount > 0 ? (totalPaidAmount / totalAmount * 100).toFixed(1) : 0;
        
        const collectionRateElement = document.getElementById('collection-rate');
        if (collectionRateElement) collectionRateElement.textContent = collectionRate + '%';
        
        // تحديث اتجاه التحصيل (هذا يتطلب بيانات تاريخية، نستخدم قيمة افتراضية هنا)
        const collectionTrendElement = document.getElementById('collection-trend');
        const collectionChangeElement = document.getElementById('collection-change');
        
        if (collectionTrendElement && collectionChangeElement) {
            // للتبسيط، نفترض اتجاهاً تصاعدياً دائماً
            collectionTrendElement.className = 'fas fa-arrow-up';
            collectionChangeElement.textContent = '5% من الشهر السابق';
        }
    }
    
    /**
     * ملء قائمة المستثمرين
     * @param {HTMLSelectElement} selectElement - عنصر القائمة
     */
    function populateInvestorsList(selectElement) {
        if (!selectElement) return;
        
        // إعادة تعيين القائمة
        selectElement.innerHTML = '<option value="">اختر المستثمر</option>';
        
        // ترتيب المستثمرين أبجدياً
        const sortedInvestors = [...investors].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        // إضافة المستثمرين إلى القائمة
        sortedInvestors.forEach(investor => {
            const option = document.createElement('option');
            option.value = investor.id;
            option.textContent = `${investor.name} (${investor.phone || 'بدون رقم'})`;
            selectElement.appendChild(option);
        });
    }
    
    /**
     * تنسيق عدد الأقساط بصيغة عربية صحيحة
     * @param {number} count - عدد الأقساط
     * @returns {string} - النص المنسق
     */
    function formatInstallmentCount(count) {
        if (count === 0) {
            return 'لا توجد أقساط';
        } else if (count === 1) {
            return 'قسط واحد';
        } else if (count === 2) {
            return 'قسطان';
        } else if (count >= 3 && count <= 10) {
            return `${count} أقساط`;
        } else {
            return `${count} قسط`;
        }
    }
    
    /**
     * تنسيق التاريخ بشكل مناسب
     * @param {string} dateStr - نص التاريخ بصيغة ISO
     * @returns {string} - التاريخ المنسق
     */
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        
        try {
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
        } catch (e) {
            return dateStr;
        }
    }
    
    /**
     * تنسيق المبالغ المالية
     * @param {number} amount - المبلغ
     * @param {boolean} addCurrency - إضافة رمز العملة
     * @returns {string} - المبلغ المنسق
     */
    function formatCurrency(amount, addCurrency = true) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(amount, addCurrency);
        }
        
        // نسخة بسيطة من الدالة إذا لم تكن موجودة في النافذة
        if (amount === undefined || amount === null || isNaN(amount)) {
            return addCurrency ? "0 " + (window.settings?.currency || 'دينار') : "0";
        }
        
        amount = parseFloat(amount);
        if (amount % 1 !== 0) {
            amount = amount.toFixed(2);
        }
        
        const parts = amount.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        const formattedAmount = parts.join('.');
        
        if (addCurrency) {
            return formattedAmount + " " + (window.settings?.currency || 'دينار');
        } else {
            return formattedAmount;
        }
    }
    
    /**
     * إضافة عملية جديدة إلى سجل العمليات
     * @param {string} type - نوع العملية
     * @param {string} investorId - معرف المستثمر
     * @param {number} amount - المبلغ
     * @param {string} notes - ملاحظات
     * @returns {Object} - العملية الجديدة أو null في حالة الفشل
     */
    function addTransaction(type, investorId, amount, notes = '') {
        if (typeof window.addTransaction === 'function') {
            return window.addTransaction(type, investorId, amount, notes);
        } else {
            console.warn('دالة addTransaction غير موجودة في النافذة');
            
            // نسخة بسيطة من الدالة إذا لم تكن موجودة في النافذة
            const investor = window.investors.find(inv => inv.id === investorId);
            if (!investor) {
                console.error(`لم يتم العثور على المستثمر: ${investorId}`);
                return null;
            }
            
            // تحديد رصيد المستثمر بعد العملية
            let balanceAfter = 0;
            
            if (type === 'إيداع') {
                // تحديث رصيد المستثمر
                investor.amount = (investor.amount || 0) + amount;
                balanceAfter = investor.amount;
            } else if (type === 'سحب' || type === 'دفع قسط' || type === 'استقطاع أقساط') {
                // تحديث رصيد المستثمر في حالة السحب
                investor.amount = (investor.amount || 0) - amount;
                balanceAfter = investor.amount;
            } else {
                // في حالة الأرباح، لا نضيف للرصيد الأساسي
                balanceAfter = investor.amount || 0;
            }
            
            const newTransaction = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                type,
                investorId,
                investorName: investor ? investor.name : 'غير معروف',
                amount,
                balanceAfter,
                notes
            };
            
            // إضافة العملية إلى سجل العمليات
            window.transactions.push(newTransaction);
            
            // حفظ البيانات
            if (typeof window.saveData === 'function') {
                window.saveData();
            }
            
            // إطلاق حدث تحديث العمليات
            const event = new CustomEvent('transaction:update');
            document.dispatchEvent(event);
            
            return newTransaction;
        }
    }
    
    /**
     * فتح نافذة منبثقة
     * @param {string} modalId - معرف النافذة
     */
    function openModal(modalId) {
        if (typeof window.openModal === 'function') {
            window.openModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
            }
        }
    }
    
    /**
     * إغلاق نافذة منبثقة
     * @param {string} modalId - معرف النافذة
     */
    function closeModal(modalId) {
        if (typeof window.closeModal === 'function') {
            window.closeModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        }
    }
    
    /**
     * عرض إشعار للمستخدم
     * @param {string} message - نص الإشعار
     * @param {string} type - نوع الإشعار (success, error, warning, info)
     */
    function showNotification(message, type = 'success') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`إشعار (${type}): ${message}`);
            alert(message);
        }
    }
    
    /**
     * إضافة أنماط CSS لنظام الأقساط
     */
    function addInstallmentStyles() {
        // التحقق من وجود أنماط مسبقة
        if (document.getElementById('installment-system-styles')) {
            return;
        }
        
        // إنشاء عنصر نمط جديد
        const styleElement = document.createElement('style');
        styleElement.id = 'installment-system-styles';
        
        // إضافة أنماط CSS
        styleElement.textContent = `
            /* أنماط عامة لنظام الأقساط */
            .installments-section {
                margin-top: 20px;
                border-top: 1px dashed #e0e0e0;
                padding-top: 20px;
            }
            
            .installments-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1.5rem;
            }
            
            .installments-table th, .installments-table td {
                padding: 0.75rem;
                text-align: start;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .installments-table th {
                background-color: #f4f6fa;
                font-weight: 600;
            }
            
            .installments-table tbody tr:hover {
                background-color: #f8f9fb;
            }
            
            /* حالات القسط */
            .status-overdue {
                background-color: rgba(244, 67, 54, 0.05);
            }
            
            .status-today {
                background-color: rgba(255, 152, 0, 0.05);
            }
            
            .status-upcoming {
                background-color: rgba(33, 150, 243, 0.05);
            }
            
            .status-paid {
                background-color: rgba(76, 175, 80, 0.05);
            }
            
            /* شارات الحالة */
            .status-badge {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .status-badge.status-overdue {
                background-color: #ffebee;
                color: #f44336;
            }
            
            .status-badge.status-today {
                background-color: #fff8e1;
                color: #ffa000;
            }
            
            .status-badge.status-upcoming {
                background-color: #e3f2fd;
                color: #2196f3;
            }
            
            .status-badge.status-paid {
                background-color: #e8f5e9;
                color: #4caf50;
            }
            
            .status-badge.status-urgent {
                background-color: #ffebee;
                color: #f44336;
            }
            
            .status-badge.status-none {
                background-color: #eeeeee;
                color: #757575;
            }
            
            /* شارة الأولوية */
            .priority-high {
                position: relative;
            }
            
            .priority-badge {
                display: inline-block;
                background-color: #ff5252;
                color: white;
                font-size: 0.65rem;
                padding: 0.15rem 0.4rem;
                border-radius: 0.25rem;
                margin-right: 0.5rem;
                font-weight: 600;
                vertical-align: middle;
            }
            
            /* ملخص الأقساط */
            .installments-summary {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1rem;
                margin: 1rem 0;
                border-radius: 0.5rem;
            }
            
            .installments-summary.due {
                background-color: #ffebee;
            }
            
            .installments-summary.upcoming {
                background-color: #e3f2fd;
            }
            
            .installments-summary.paid {
                background-color: #e8f5e9;
            }
            
            .summary-title {
                font-weight: 600;
                display: flex;
                align-items: center;
            }
            
            .summary-title i {
                margin-left: 0.5rem;
            }
            
            .summary-amount {
                font-weight: 700;
                font-size: 1.1rem;
            }
            
            /* أنماط تفاصيل الأقساط في نافذة المستثمر */
            .installments-detail-group {
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid #e0e0e0;
            }
            
            .installment-status {
                font-size: 0.8rem;
                margin-right: 0.75rem;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                vertical-align: middle;
            }
            
            .empty-installments {
                display: flex;
                justify-content: center;
                padding: 2rem;
                background-color: #f5f5f5;
                border-radius: 0.5rem;
                color: #757575;
            }
            
            .view-history-link {
                text-align: center;
                margin-top: 1rem;
            }
            
            .view-history-link a {
                color: #3b82f6;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
            }
            
            .view-history-link a i {
                margin-left: 0.5rem;
            }
            
            /* أنماط نافذة تأكيد استقطاع الأقساط */
            .installment-confirmation-details {
                max-width: 100%;
                margin: 0 auto;
            }
            
            .investor-info-banner {
                display: flex;
                align-items: center;
                background-color: #f0f4ff;
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 1.5rem;
            }
            
            .installments-badge {
                background-color: #ffebee;
                color: #f44336;
                font-size: 0.8rem;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                margin-top: 0.25rem;
            }
            
            .profit-summary {
                margin-bottom: 1.5rem;
                background-color: #f8f9fa;
                padding: 1rem;
                border-radius: 0.5rem;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
            }
            
            .summary-label {
                font-weight: 500;
            }
            
            .summary-row.deduction .summary-value {
                color: #f44336;
            }
            
            .summary-row.total {
                font-weight: 700;
                font-size: 1.1rem;
            }
            
            .separator {
                height: 1px;
                background-color: #dee2e6;
                margin: 0.75rem 0;
            }
        `;
        
        // إضافة عنصر النمط إلى رأس الصفحة
        document.head.appendChild(styleElement);
        console.log('تم إضافة أنماط CSS لنظام الأقساط');
    }
    
    // تصدير الواجهة العامة
    return {
        initialize,
        getDueInstallments,
        showAddInstallmentModal,
        showInstallmentsPage
    };
})();

// تهيئة نظام الأقساط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    InstallmentSystem.initialize();
    
    console.log('تم تحميل نظام إدارة الأقساط بنجاح');
});

// تصدير نظام الأقساط للاستخدام العام
window.InstallmentSystem = InstallmentSystem;
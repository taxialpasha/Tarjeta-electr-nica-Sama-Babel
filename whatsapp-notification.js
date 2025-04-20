/**
 * whatsapp-notification.js
 * نظام إرسال إشعارات واتساب تلقائية للمستثمرين في نظام الاستثمار المتكامل
 * 
 * هذا الملف يوفر وظائف إرسال رسائل واتساب تلقائية للمستثمرين عند إضافتهم إلى النظام
 * أو عند إجراء عمليات مالية على حساباتهم
 */

// نظام إشعارات الواتساب
const WhatsAppNotification = (function() {
    
    /**
     * إرسال رسالة واتساب عند إضافة مستثمر جديد
     * @param {Object} investor بيانات المستثمر الجديد
     * @returns {boolean} نجاح العملية
     */
    function sendNewInvestorNotification(investor) {
        if (!investor || !investor.phone) {
            console.error('خطأ: بيانات المستثمر غير مكتملة');
            return false;
        }
        
        try {
            // تنسيق رقم الهاتف (إزالة الأصفار المتقدمة إذا وجدت وإضافة رمز الدولة إذا لم يكن موجوداً)
            const phoneNumber = formatPhoneNumber(investor.phone);
            
            // إنشاء نص الرسالة
            const message = createInvestorMessage(investor);
            
            // إرسال الرسالة باستخدام رابط واتساب
            openWhatsAppLink(phoneNumber, message);
            
            console.log(`تم فتح رابط واتساب لإرسال رسالة إلى المستثمر: ${investor.name}`);
            return true;
        } catch (error) {
            console.error('خطأ في إرسال إشعار واتساب:', error);
            
            // في حالة حدوث خطأ، نعرض إشعاراً للمستخدم
            if (typeof showNotification === 'function') {
                showNotification('حدث خطأ في فتح واتساب، يرجى التحقق من إتصال الإنترنت.', 'error');
            }
            
            return false;
        }
    }
    
    /**
     * إرسال إشعار واتساب عند إجراء عملية إيداع
     * @param {Object} investor بيانات المستثمر
     * @param {Object} transaction بيانات العملية
     * @returns {boolean} نجاح العملية
     */
    function sendDepositNotification(investor, transaction) {
        if (!investor || !investor.phone || !transaction) {
            console.error('خطأ: البيانات المطلوبة غير مكتملة');
            return false;
        }
        
        try {
            // تنسيق رقم الهاتف
            const phoneNumber = formatPhoneNumber(investor.phone);
            
            // إنشاء نص الرسالة
            const message = createDepositMessage(investor, transaction);
            
            // إرسال الرسالة
            openWhatsAppLink(phoneNumber, message);
            
            console.log(`تم فتح رابط واتساب لإرسال إشعار إيداع إلى المستثمر: ${investor.name}`);
            return true;
        } catch (error) {
            console.error('خطأ في إرسال إشعار واتساب للإيداع:', error);
            return false;
        }
    }
    
    /**
     * إرسال إشعار واتساب عند إجراء عملية سحب
     * @param {Object} investor بيانات المستثمر
     * @param {Object} transaction بيانات العملية
     * @returns {boolean} نجاح العملية
     */
    function sendWithdrawalNotification(investor, transaction) {
        if (!investor || !investor.phone || !transaction) {
            console.error('خطأ: البيانات المطلوبة غير مكتملة');
            return false;
        }
        
        try {
            // تنسيق رقم الهاتف
            const phoneNumber = formatPhoneNumber(investor.phone);
            
            // إنشاء نص الرسالة
            const message = createWithdrawalMessage(investor, transaction);
            
            // إرسال الرسالة
            openWhatsAppLink(phoneNumber, message);
            
            console.log(`تم فتح رابط واتساب لإرسال إشعار سحب إلى المستثمر: ${investor.name}`);
            return true;
        } catch (error) {
            console.error('خطأ في إرسال إشعار واتساب للسحب:', error);
            return false;
        }
    }
    
    /**
     * إرسال إشعار واتساب عند دفع الأرباح
     * @param {Object} investor بيانات المستثمر
     * @param {number} profitAmount مبلغ الربح
     * @returns {boolean} نجاح العملية
     */
    function sendProfitNotification(investor, profitAmount) {
        if (!investor || !investor.phone || !profitAmount) {
            console.error('خطأ: البيانات المطلوبة غير مكتملة');
            return false;
        }
        
        try {
            // تنسيق رقم الهاتف
            const phoneNumber = formatPhoneNumber(investor.phone);
            
            // إنشاء نص الرسالة
            const message = createProfitMessage(investor, profitAmount);
            
            // إرسال الرسالة
            openWhatsAppLink(phoneNumber, message);
            
            console.log(`تم فتح رابط واتساب لإرسال إشعار أرباح إلى المستثمر: ${investor.name}`);
            return true;
        } catch (error) {
            console.error('خطأ في إرسال إشعار واتساب للأرباح:', error);
            return false;
        }
    }
    
    /**
     * تنسيق رقم الهاتف للاستخدام مع واتساب
     * @param {string} phoneNumber رقم الهاتف
     * @returns {string} رقم الهاتف المنسق
     */
    function formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';
        
        // إزالة أي مسافات أو رموز
        let formattedNumber = phoneNumber.replace(/\s+/g, '').replace(/[-()+]/g, '');
        
        // إزالة الصفر في البداية إذا وجد
        if (formattedNumber.startsWith('0')) {
            formattedNumber = formattedNumber.substring(1);
        }
        
        // التحقق من وجود رمز الدولة وإضافته إذا لم يكن موجوداً
        // نفترض أن الرقم عراقي إذا لم يبدأ برمز دولة
        if (!formattedNumber.startsWith('964') && !formattedNumber.startsWith('+964')) {
            formattedNumber = '964' + formattedNumber;
        }
        
        // إزالة علامة + إذا وجدت (لأن رابط واتساب يستخدم فقط الأرقام)
        formattedNumber = formattedNumber.replace('+', '');
        
        return formattedNumber;
    }
    
    /**
     * إنشاء رسالة ترحيب للمستثمر الجديد
     * @param {Object} investor بيانات المستثمر
     * @returns {string} نص الرسالة
     */
    function createInvestorMessage(investor) {
        // الحصول على اسم التطبيق من الإعدادات أو استخدام القيمة الافتراضية
        const appName = window.settings && window.settings.systemName ? 
                        window.settings.systemName : 'نظام الاستثمار المتكامل';
        
        // تنسيق نص الرسالة بتباعد الأسطر
        let message = `مرحباً ${investor.name}، 🌟\n\n`;
        message += `تم تسجيلك بنجاح في ${appName}.\n\n`;
        message += `معلومات حسابك:\n`;
        message += `رقم الحساب: ${investor.id}\n`;
        message += `الاسم: ${investor.name}\n`;
        message += `رقم الهاتف: ${investor.phone}\n\n`;
        
        // إضافة معلومات الاستثمار الأولي إذا وجدت
        if (investor.amount) {
            const currency = window.settings && window.settings.currency ? 
                             window.settings.currency : 'دينار';
            message += `المبلغ المستثمر: ${investor.amount.toLocaleString()} ${currency}\n`;
            
            // إضافة معلومات نسبة الربح إذا كانت متاحة
            if (window.settings && window.settings.interestRate) {
                message += `نسبة الربح الشهري: ${window.settings.interestRate}%\n\n`;
            }
        }
        
        message += `شكراً لثقتكم بنا! 🙏\n`;
        message += `للاستفسارات، يرجى التواصل معنا على نفس الرقم.`;
        
        return message;
    }
    
    /**
     * إنشاء رسالة إشعار للإيداع
     * @param {Object} investor بيانات المستثمر
     * @param {Object} transaction بيانات العملية
     * @returns {string} نص الرسالة
     */
    function createDepositMessage(investor, transaction) {
        const currency = window.settings && window.settings.currency ? 
                         window.settings.currency : 'دينار';
        
        let message = `مرحباً ${investor.name}، 💰\n\n`;
        message += `تم إجراء عملية إيداع في حسابك بنجاح.\n\n`;
        message += `تفاصيل العملية:\n`;
        message += `التاريخ: ${transaction.date}\n`;
        message += `المبلغ: ${transaction.amount.toLocaleString()} ${currency}\n`;
        message += `رقم العملية: ${transaction.id}\n\n`;
        
        // إضافة الرصيد الجديد إذا كان متاحاً
        if (transaction.balanceAfter !== undefined) {
            message += `الرصيد الحالي: ${transaction.balanceAfter.toLocaleString()} ${currency}\n\n`;
        }
        
        message += `شكراً لاستثمارك معنا! 🌹`;
        
        return message;
    }
    
    /**
     * إنشاء رسالة إشعار للسحب
     * @param {Object} investor بيانات المستثمر
     * @param {Object} transaction بيانات العملية
     * @returns {string} نص الرسالة
     */
    function createWithdrawalMessage(investor, transaction) {
        const currency = window.settings && window.settings.currency ? 
                         window.settings.currency : 'دينار';
        
        let message = `مرحباً ${investor.name}، ⚠️\n\n`;
        message += `تم إجراء عملية سحب من حسابك بنجاح.\n\n`;
        message += `تفاصيل العملية:\n`;
        message += `التاريخ: ${transaction.date}\n`;
        message += `المبلغ المسحوب: ${transaction.amount.toLocaleString()} ${currency}\n`;
        message += `رقم العملية: ${transaction.id}\n\n`;
        
        // إضافة الرصيد الجديد إذا كان متاحاً
        if (transaction.balanceAfter !== undefined) {
            message += `الرصيد المتبقي: ${transaction.balanceAfter.toLocaleString()} ${currency}\n\n`;
        }
        
        // إضافة ملاحظة عن قطع الفائدة
        message += `ملاحظة: سيتم قطع فائدة المبلغ المسحوب للشهر الحالي.\n\n`;
        
        message += `شكراً لتعاملك معنا.`;
        
        return message;
    }
    
    /**
     * إنشاء رسالة إشعار لدفع الأرباح
     * @param {Object} investor بيانات المستثمر
     * @param {number} profitAmount مبلغ الربح
     * @returns {string} نص الرسالة
     */
    function createProfitMessage(investor, profitAmount) {
        const currency = window.settings && window.settings.currency ? 
                         window.settings.currency : 'دينار';
        
        let message = `مرحباً ${investor.name}، 🎉\n\n`;
        message += `تم دفع الأرباح المستحقة لحسابك.\n\n`;
        message += `تفاصيل الأرباح:\n`;
        message += `التاريخ: ${new Date().toISOString().split('T')[0]}\n`;
        message += `مبلغ الربح: ${profitAmount.toLocaleString()} ${currency}\n\n`;
        
        // إضافة الرصيد الإجمالي إذا كان متاحاً
        if (investor.amount !== undefined) {
            message += `المبلغ المستثمر: ${investor.amount.toLocaleString()} ${currency}\n\n`;
        }
        
        message += `نشكرك على استثمارك معنا! 🌹\n`;
        message += `للمزيد من المعلومات، يرجى التواصل معنا.`;
        
        return message;
    }
    
    /**
     * فتح رابط واتساب لإرسال رسالة
     * @param {string} phoneNumber رقم الهاتف
     * @param {string} message نص الرسالة
     */
    function openWhatsAppLink(phoneNumber, message) {
        // ترميز الرسالة لاستخدامها في الرابط
        const encodedMessage = encodeURIComponent(message);
        
        // إنشاء رابط واتساب
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // عرض مربع حوار للمستخدم للتأكيد على إرسال الرسالة
        if (typeof showConfirmationDialog === 'function') {
            showConfirmationDialog(
                'إرسال إشعار واتساب',
                'هل ترغب في إرسال رسالة واتساب إلى المستثمر؟',
                function() {
                    // فتح الرابط في نافذة جديدة
                    window.open(whatsappLink, '_blank');
                }
            );
        } else {
            // إذا لم تكن دالة التأكيد موجودة، نسأل المستخدم مباشرة
            if (confirm('هل ترغب في إرسال رسالة واتساب إلى المستثمر؟')) {
                window.open(whatsappLink, '_blank');
            }
        }
    }
    
    /**
     * عرض مربع حوار للتأكيد
     * @param {string} title عنوان مربع الحوار
     * @param {string} message نص الرسالة
     * @param {Function} onConfirm دالة يتم استدعاؤها عند التأكيد
     */
    function showConfirmationDialog(title, message, onConfirm) {
        // التحقق من وجود مربع حوار مسبق
        const existingDialog = document.getElementById('whatsapp-confirmation-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // إنشاء مربع الحوار
        const dialog = document.createElement('div');
        dialog.id = 'whatsapp-confirmation-dialog';
        dialog.className = 'modal-overlay';
        
        dialog.innerHTML = `
            <div class="modal animate__animated animate__fadeInUp">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline modal-close-btn">إلغاء</button>
                    <button class="btn btn-primary" id="confirm-whatsapp-btn">إرسال</button>
                </div>
            </div>
        `;
        
        // إضافة مربع الحوار إلى الصفحة
        document.body.appendChild(dialog);
        
        // إضافة الأحداث
        dialog.querySelector('.modal-close').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('.modal-close-btn').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('#confirm-whatsapp-btn').addEventListener('click', () => {
            dialog.remove();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        
        // عرض مربع الحوار
        dialog.classList.add('active');
    }
    
    // الواجهة العامة للوحدة
    return {
        sendNewInvestorNotification,
        sendDepositNotification,
        sendWithdrawalNotification,
        sendProfitNotification,
        formatPhoneNumber,
        openWhatsAppLink
    };
})();

// دمج النظام مع دوال إضافة المستثمر والعمليات
(function() {
    console.log('تهيئة نظام إشعارات الواتساب...');
    
    // حفظ الدوال الأصلية
    const originalAddNewInvestor = window.addNewInvestor;
    const originalAddDeposit = window.addDeposit;
    const originalWithdrawAmount = window.withdrawAmount;
    const originalPayProfit = window.payProfit;
    
    // استبدال دالة إضافة مستثمر جديد
    window.addNewInvestor = function() {
        // استدعاء الدالة الأصلية وتخزين النتيجة
        const result = originalAddNewInvestor.apply(this, arguments);
        
        // إذا تمت العملية بنجاح، نرسل إشعار واتساب
        if (result !== false) {
            // الحصول على بيانات المستثمر المضاف حديثاً
            const newInvestor = window.investors[window.investors.length - 1];
            
            if (newInvestor) {
                // إرسال إشعار الواتساب
                setTimeout(() => {
                    WhatsAppNotification.sendNewInvestorNotification(newInvestor);
                }, 800); // تأخير قليل لضمان إتمام عملية الإضافة
            }
        }
        
        return result;
    };
    
    // استبدال دالة إضافة إيداع
    window.addDeposit = function() {
        // استدعاء الدالة الأصلية وتخزين النتيجة
        const result = originalAddDeposit.apply(this, arguments);
        
        // إذا تمت العملية بنجاح، نرسل إشعار واتساب
        if (result !== false) {
            try {
                // الحصول على معرف المستثمر
                const depositInvestorSelect = document.getElementById('deposit-investor');
                const investorId = depositInvestorSelect ? depositInvestorSelect.value : null;
                
                if (investorId) {
                    // البحث عن المستثمر
                    const investor = window.investors.find(inv => inv.id === investorId);
                    
                    // البحث عن آخر عملية إيداع
                    const lastDeposit = window.transactions
                        .filter(tr => tr.investorId === investorId && tr.type === 'إيداع')
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                    
                    if (investor && lastDeposit) {
                        // إرسال إشعار الواتساب
                        setTimeout(() => {
                            WhatsAppNotification.sendDepositNotification(investor, lastDeposit);
                        }, 800);
                    }
                }
            } catch (error) {
                console.error('خطأ في إرسال إشعار واتساب للإيداع:', error);
            }
        }
        
        return result;
    };
    
    // استبدال دالة السحب
    window.withdrawAmount = function() {
        // استدعاء الدالة الأصلية وتخزين النتيجة
        const result = originalWithdrawAmount.apply(this, arguments);
        
        // إذا تمت العملية بنجاح، نرسل إشعار واتساب
        if (result !== false) {
            try {
                // الحصول على معرف المستثمر
                const withdrawInvestorSelect = document.getElementById('withdraw-investor');
                const investorId = withdrawInvestorSelect ? withdrawInvestorSelect.value : null;
                
                if (investorId) {
                    // البحث عن المستثمر
                    const investor = window.investors.find(inv => inv.id === investorId);
                    
                    // البحث عن آخر عملية سحب
                    const lastWithdrawal = window.transactions
                        .filter(tr => tr.investorId === investorId && tr.type === 'سحب')
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                    
                    if (investor && lastWithdrawal) {
                        // إرسال إشعار الواتساب
                        setTimeout(() => {
                            WhatsAppNotification.sendWithdrawalNotification(investor, lastWithdrawal);
                        }, 800);
                    }
                }
            } catch (error) {
                console.error('خطأ في إرسال إشعار واتساب للسحب:', error);
            }
        }
        
        return result;
    };
    
    // استبدال دالة دفع الأرباح
    window.payProfit = function() {
        // استدعاء الدالة الأصلية وتخزين النتيجة
        const result = originalPayProfit.apply(this, arguments);
        
        // إذا تمت العملية بنجاح، نرسل إشعار واتساب
        if (result !== false) {
            try {
                // الحصول على معرف المستثمر
                const profitInvestorSelect = document.getElementById('profit-investor');
                const investorId = profitInvestorSelect ? profitInvestorSelect.value : null;
                
                if (investorId) {
                    // البحث عن المستثمر
                    const investor = window.investors.find(inv => inv.id === investorId);
                    
                    // البحث عن آخر عملية دفع أرباح
                    const lastProfit = window.transactions
                        .filter(tr => tr.investorId === investorId && tr.type === 'دفع أرباح')
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                    
                    if (investor && lastProfit) {
                        // إرسال إشعار الواتساب
                        setTimeout(() => {
                            WhatsAppNotification.sendProfitNotification(investor, lastProfit.amount);
                        }, 800);
                    }
                }
            } catch (error) {
                console.error('خطأ في إرسال إشعار واتساب للأرباح:', error);
            }
        }
        
        return result;
    };
    
    // إضافة أزرار إرسال الواتساب المباشر في تفاصيل المستثمر
    document.addEventListener('click', function(e) {
        // البحث عن زر عرض تفاصيل المستثمر
        const viewButton = e.target.closest('.view-investor');
        if (viewButton) {
            const investorId = viewButton.getAttribute('data-id');
            if (!investorId) return;
            
            // الانتظار حتى يتم عرض التفاصيل
            setTimeout(() => {
                // البحث عن نافذة التفاصيل
                const detailsContainer = document.querySelector('.investor-actions-big');
                if (!detailsContainer) return;
                
                // البحث عن زر الواتساب الموجود (لتجنب الإضافة المتكررة)
                if (detailsContainer.querySelector('.whatsapp-btn')) return;
                
                // إضافة زر واتساب
                const whatsappButton = document.createElement('button');
                whatsappButton.className = 'btn btn-success whatsapp-btn';
                whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> إرسال رسالة واتساب';
                whatsappButton.style.backgroundColor = '#25D366';
                whatsappButton.style.borderColor = '#25D366';
                
                // إضافة الحدث
                whatsappButton.addEventListener('click', function() {
                    const investor = window.investors.find(inv => inv.id === investorId);
                    if (investor) {
                        WhatsAppNotification.sendNewInvestorNotification(investor);
                    }
                });
                
                // إضافة الزر إلى الشريط
                detailsContainer.appendChild(whatsappButton);
            }, 300);
        }
    });
    
    console.log('تم تهيئة نظام إشعارات الواتساب بنجاح');
})();

// إضافة أيقونة فونت أوسوم للواتساب
(function() {
    // التحقق من وجود فونت أوسوم
    if (document.querySelector('link[href*="font-awesome"]')) {
        // إضافة CSS لأيقونة الواتساب
        const style = document.createElement('style');
        style.textContent = `
            .fab.fa-whatsapp {
                color: #fff;
            }
            
            .whatsapp-btn {
                background-color: #25D366 !important;
                border-color: #25D366 !important;
            }
            
            .whatsapp-btn:hover {
                background-color: #128C7E !important;
                border-color: #128C7E !important;
            }
        `;
        document.head.appendChild(style);
    }
})();
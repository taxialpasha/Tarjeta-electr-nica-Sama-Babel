/**
 * دمج أزرار إدارة المستخدمين مع زر التحديث
 * يضمن هذا الملف عمل جميع الأزرار بشكل صحيح ويضيف زر التحديث للشريط العلوي
 */

// تنفيذ وظائف إدارة المستخدمين مع زر التحديث
document.addEventListener('DOMContentLoaded', function() {
    console.log('تهيئة وظائف إدارة المستخدمين وزر التحديث...');
    
    // إضافة زر التحديث للشريط العلوي
    addRefreshButton();
    
    // مراقبة إضافة أزرار إدارة المستخدمين
    setupUserActionsObserver();
    
    // مراقبة تغيرات DOM لتفعيل الوظائف تلقائياً
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                // البحث عن جدول المستخدمين
                const usersTable = document.getElementById('users-table');
                if (usersTable && usersTable.querySelector('tbody')) {
                    setupUserActionButtons();
                }
            }
        });
    });
    
    // بدء المراقبة على المستند
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('تم تهيئة وظائف إدارة المستخدمين وزر التحديث بنجاح');
});

/**
 * إضافة زر التحديث إلى شريط العنوان
 */
function addRefreshButton() {
    // التحقق من وجود شريط العنوان
    const titlebar = document.querySelector('.custom-titlebar');
    if (!titlebar) {
        console.warn('لم يتم العثور على شريط العنوان');
        return;
    }
    
    // التحقق من عدم وجود زر التحديث مسبقاً
    if (document.getElementById('refresh-btn')) {
        console.log('زر التحديث موجود بالفعل');
        return;
    }
    
    // إنشاء زر التحديث
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-btn';
    refreshButton.className = 'btn-refresh';
    refreshButton.title = 'تحديث التطبيق';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
    
    // إضافة الزر إلى منطقة السحب في شريط العنوان
    const dragArea = titlebar.querySelector('.window-drag-area');
    if (dragArea) {
        // إضافة الزر قبل عناصر التحكم في النافذة
        const currencyWidget = dragArea.querySelector('#currency-widget');
        if (currencyWidget) {
            dragArea.insertBefore(refreshButton, currencyWidget.nextSibling);
        } else {
            dragArea.appendChild(refreshButton);
        }
    }
    
    // إضافة أنماط CSS للزر
    addRefreshButtonStyles();
    
    // إضافة مستمع الحدث للزر
    refreshButton.addEventListener('click', refreshApplication);
    
    console.log('تم إضافة زر التحديث إلى شريط العنوان');
}

/**
 * إضافة أنماط CSS لزر التحديث
 */
function addRefreshButtonStyles() {
    // التحقق من وجود أنماط مسبقة
    if (document.getElementById('refresh-button-styles')) {
        return;
    }
    
    // إنشاء عنصر نمط جديد
    const style = document.createElement('style');
    style.id = 'refresh-button-styles';
    style.textContent = `
    .btn-refresh {
        background: transparent;
        border: none;
        color: #fff;
        cursor: pointer;
        font-size: 16px;
        margin: 0 10px;
        padding: 5px;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, transform 0.3s;
    }
    
    .btn-refresh:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    .btn-refresh:active {
        background-color: rgba(255, 255, 255, 0.2);
    }
    
    .btn-refresh.rotating i {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    `;
    
    // إضافة أنماط إلى رأس الصفحة
    document.head.appendChild(style);
    console.log('تم إضافة أنماط CSS لزر التحديث');
}

/**
 * تحديث التطبيق
 */
function refreshApplication() {
    console.log('جارٍ تحديث التطبيق...');
    
    // تغيير حالة الزر ليعكس أن التحديث جارٍ
    const refreshButton = document.getElementById('refresh-btn');
    if (refreshButton) {
        refreshButton.classList.add('rotating');
    }
    
    // عرض إشعار بالتحديث
    if (window.showNotification) {
        window.showNotification('جاري تحديث التطبيق...', 'info');
    }
    
    try {
        // 1. تحديث البيانات من التخزين المحلي
        if (window.loadData) {
            window.loadData();
        }
        
        // 2. تحديث الصفحة الحالية
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id.replace('-page', '');
            console.log(`تحديث الصفحة النشطة: ${pageId}`);
            
            // تحديث المحتوى حسب نوع الصفحة
            switch (pageId) {
                case 'dashboard':
                    if (window.updateDashboard) window.updateDashboard();
                    if (window.renderRecentTransactions) window.renderRecentTransactions();
                    if (window.initCharts) window.initCharts();
                    break;
                case 'investors':
                    if (window.renderInvestorsTable) window.renderInvestorsTable();
                    break;
                case 'transactions':
                    if (window.renderTransactionsTable) window.renderTransactionsTable();
                    break;
                case 'profits':
                    if (window.renderProfitsTable) window.renderProfitsTable();
                    break;
                case 'reports':
                    if (window.updateCharts) window.updateCharts();
                    break;
                case 'user-management':
                    // تحديث جدول المستخدمين
                    refreshUsersList();
                    break;
                case 'settings':
                    // لا يحتاج إلى تحديث خاص
                    break;
            }
        }
        
        // 3. تحديث العناصر المشتركة
        if (window.populateInvestorSelects) {
            window.populateInvestorSelects();
        }
        
        // 4. إعادة تهيئة الأزرار والمستمعين
        setupUserActionButtons();
        
        // عرض إشعار بنجاح التحديث بعد فترة قصيرة
        setTimeout(() => {
            if (window.showNotification) {
                window.showNotification('تم تحديث التطبيق بنجاح', 'success');
            }
            
            // إزالة حالة الدوران من الزر
            if (refreshButton) {
                refreshButton.classList.remove('rotating');
            }
        }, 1000);
    } catch (error) {
        console.error('خطأ في تحديث التطبيق:', error);
        
        // عرض رسالة الخطأ
        if (window.showNotification) {
            window.showNotification('حدث خطأ أثناء تحديث التطبيق', 'error');
        }
        
        // إزالة حالة الدوران من الزر
        if (refreshButton) {
            refreshButton.classList.remove('rotating');
        }
    }
}

/**
 * تحديث قائمة المستخدمين
 */
function refreshUsersList() {
    console.log('تحديث قائمة المستخدمين...');
    
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) {
        console.warn('لم يتم العثور على جدول المستخدمين');
        return;
    }
    
    // عرض رسالة التحميل
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loader"></div><p>جارٍ تحميل بيانات المستخدمين...</p></td></tr>';
    
    // استخدام Firebase للحصول على قائمة المستخدمين
    if (window.firebase && window.firebase.database) {
        firebase.database().ref('users').once('value')
            .then(snapshot => {
                // جمع المستخدمين
                const users = [];
                
                snapshot.forEach(childSnapshot => {
                    const userId = childSnapshot.key;
                    const userData = childSnapshot.val();
                    
                    if (userData && userData.profile) {
                        users.push({
                            uid: userId,
                            ...userData.profile
                        });
                    }
                });
                
                // عرض المستخدمين في الجدول
                renderUsersTable(users);
            })
            .catch(error => {
                console.error('خطأ في تحميل المستخدمين:', error);
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">خطأ في تحميل بيانات المستخدمين</td></tr>';
            });
    } else {
        // بيانات مثال للعرض
        const demoUsers = [
            {
                uid: 'admin1',
                email: 'admin@example.com',
                fullName: 'مدير النظام',
                type: 'admin',
                createdAt: '2023-01-01T00:00:00.000Z',
                isActive: true
            },
            {
                uid: 'manager1',
                email: 'manager@example.com',
                fullName: 'مدير',
                type: 'manager',
                createdAt: '2023-02-15T00:00:00.000Z',
                isActive: true
            },
            {
                uid: 'user1',
                email: 'user@example.com',
                fullName: 'مستخدم عادي',
                type: 'user',
                createdAt: '2023-03-20T00:00:00.000Z',
                isActive: false
            }
        ];
        
        // إظهار بيانات المثال بعد تأخير قصير (لمحاكاة التحميل)
        setTimeout(() => {
            renderUsersTable(demoUsers);
        }, 500);
    }
}

/**
 * إصلاح خطأ عرض معرف المستخدم في جدول المستخدمين
 * يحل مشكلة: TypeError: Cannot read properties of undefined (reading 'substring')
 */

/**
 * عرض المستخدمين في الجدول مع التحقق من وجود معرف المستخدم
 * @param {Array} users - قائمة المستخدمين
 */
function renderUsersTable(users) {
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) return;
    
    // مسح محتوى الجدول
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد مستخدمين</td></tr>';
        return;
    }
    
    // ترتيب المستخدمين حسب تاريخ الإنشاء (الأحدث أولاً)
    const sortedUsers = [...users].sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    
    // إنشاء صفوف الجدول
    sortedUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // التحقق من وجود معرف المستخدم قبل استخدامه
        const userId = user.uid || user.id || '';
        row.setAttribute('data-id', userId);
        
        // تنسيق التاريخ
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-';
        
        // تحديد حالة المستخدم
        const statusBadge = user.isActive !== false ? 
            '<span class="badge success">نشط</span>' : 
            '<span class="badge danger">معطل</span>';
        
        // عرض معرف المستخدم بطريقة آمنة (مع التحقق من وجوده)
        const displayUserId = userId ? (userId.length > 10 ? userId.substring(0, 10) + '...' : userId) : 'غير محدد';
            
        row.innerHTML = `
            <td>${displayUserId}</td>
            <td>
                <div class="user-info-cell">
                    <div class="user-avatar small">${user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</div>
                    <div>
                        <div class="user-name">${user.fullName || 'مستخدم'}</div>
                        <div class="user-role">${user.email || ''}</div>
                    </div>
                </div>
            </td>
            <td>${user.email || '-'}</td>
            <td><span class="badge ${user.type || 'user'}">${getUserTypeLabel(user.type || 'user')}</span></td>
            <td>${createdAt}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline edit-user-btn" data-id="${userId}" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline permissions-user-btn" data-id="${userId}" title="الصلاحيات">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-sm btn-outline btn-danger delete-user-btn" data-id="${userId}" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // إضافة مستمعي الأحداث للأزرار
    setupUserActionButtons();
}

/**
 * جلب بيانات المستخدم من قاعدة البيانات
 * @param {string} userId - معرف المستخدم
 * @returns {Promise<Object>} - وعد يحتوي على بيانات المستخدم
 */
function fetchUserData(userId) {
    return new Promise((resolve, reject) => {
        if (!userId) {
            reject(new Error('معرف المستخدم غير صالح'));
            return;
        }
        
        // استخدام Firebase للوصول إلى بيانات المستخدم
        if (window.firebase && window.firebase.database) {
            firebase.database().ref(`users/${userId}/profile`).once('value')
                .then(snapshot => {
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        // إضافة معرف المستخدم إلى الكائن المُرجع
                        userData.uid = userId;
                        resolve(userData);
                    } else {
                        // محاولة جلب البيانات من المسار القديم
                        firebase.database().ref(`users/${userId}`).once('value')
                            .then(oldSnapshot => {
                                if (oldSnapshot.exists()) {
                                    const userData = oldSnapshot.val();
                                    // إضافة معرف المستخدم إلى الكائن المُرجع
                                    userData.uid = userId;
                                    resolve(userData);
                                } else {
                                    reject(new Error('لم يتم العثور على بيانات المستخدم'));
                                }
                            })
                            .catch(error => {
                                console.error('خطأ في جلب بيانات المستخدم من المسار القديم:', error);
                                reject(error);
                            });
                    }
                })
                .catch(error => {
                    console.error('خطأ في جلب بيانات المستخدم:', error);
                    reject(error);
                });
        } else {
            // في حالة عدم وجود Firebase، نرجع بيانات افتراضية (للاختبار فقط)
            setTimeout(() => {
                resolve({
                    uid: userId,
                    email: 'user@example.com',
                    fullName: 'مستخدم تجريبي',
                    type: 'user',
                    isActive: true,
                    permissions: getDefaultPermissions('user')
                });
            }, 500);
        }
    });
}

/**
 * تحديث قائمة المستخدمين مع معالجة الأخطاء المحتملة
 */
function refreshUsersList() {
    console.log('تحديث قائمة المستخدمين...');
    
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) {
        console.warn('لم يتم العثور على جدول المستخدمين');
        return;
    }
    
    // عرض رسالة التحميل
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loader"></div><p>جارٍ تحميل بيانات المستخدمين...</p></td></tr>';
    
    // استخدام Firebase للحصول على قائمة المستخدمين
    if (window.firebase && window.firebase.database) {
        try {
            firebase.database().ref('users').once('value')
                .then(snapshot => {
                    // جمع المستخدمين
                    const users = [];
                    
                    snapshot.forEach(childSnapshot => {
                        const userId = childSnapshot.key;
                        // التحقق من وجود بيانات المستخدم
                        const userData = childSnapshot.val();
                        
                        if (userData) {
                            // التحقق من هيكل البيانات (الصيغة القديمة أو الجديدة)
                            if (userData.profile) {
                                // الصيغة الجديدة (البيانات في مفتاح profile)
                                users.push({
                                    uid: userId,
                                    ...userData.profile
                                });
                            } else {
                                // الصيغة القديمة (البيانات مباشرة)
                                users.push({
                                    uid: userId,
                                    ...userData
                                });
                            }
                        }
                    });
                    
                    console.log(`تم تحميل ${users.length} مستخدم من قاعدة البيانات`);
                    
                    // عرض المستخدمين في الجدول
                    renderUsersTable(users);
                })
                .catch(error => {
                    console.error('خطأ في تحميل المستخدمين:', error);
                    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        خطأ في تحميل بيانات المستخدمين: ${error.message || 'خطأ غير معروف'}
                    </td></tr>`;
                    
                    // عرض إشعار بالخطأ
                    if (window.showNotification) {
                        window.showNotification('حدث خطأ أثناء تحميل بيانات المستخدمين', 'error');
                    }
                });
        } catch (e) {
            console.error('خطأ في استخدام Firebase:', e);
            
            // عرض بيانات مثال في حالة الخطأ
            showDemoUsers(tableBody);
        }
    } else {
        console.warn('Firebase غير متاح. عرض بيانات المثال...');
        
        // عرض بيانات مثال للعرض
        showDemoUsers(tableBody);
    }
}

/**
 * عرض بيانات مستخدمين تجريبية للاختبار
 * @param {HTMLElement} tableBody - عنصر جسم الجدول
 */
function showDemoUsers(tableBody) {
    const demoUsers = [
        {
            uid: 'admin1',
            id: 'admin1',  // نسخة احتياطية من المعرف
            email: 'admin@example.com',
            fullName: 'مدير النظام',
            type: 'admin',
            createdAt: '2023-01-01T00:00:00.000Z',
            isActive: true
        },
        {
            uid: 'manager1',
            id: 'manager1',
            email: 'manager@example.com',
            fullName: 'مدير',
            type: 'manager',
            createdAt: '2023-02-15T00:00:00.000Z',
            isActive: true
        },
        {
            uid: 'user1',
            id: 'user1',
            email: 'user@example.com',
            fullName: 'مستخدم عادي',
            type: 'user',
            createdAt: '2023-03-20T00:00:00.000Z',
            isActive: false
        }
    ];
    
    // إظهار بيانات المثال بعد تأخير قصير (لمحاكاة التحميل)
    setTimeout(() => {
        renderUsersTable(demoUsers);
    }, 500);
}

/**
 * الحصول على تسمية نوع المستخدم
 * @param {string} userType - نوع المستخدم
 * @returns {string} - تسمية نوع المستخدم
 */
function getUserTypeLabel(userType) {
    switch (userType) {
        case 'admin':
            return 'مسؤول النظام';
        case 'manager':
            return 'مدير';
        case 'user':
        default:
            return 'مستخدم عادي';
    }
}

/**
 * الحصول على الصلاحيات الافتراضية حسب نوع المستخدم
 * @param {string} userType - نوع المستخدم
 * @returns {Object} - كائن الصلاحيات
 */
function getDefaultPermissions(userType) {
    switch (userType) {
        case 'admin':
            return {
                canViewUsers: true,
                canCreateUsers: true,
                canEditUsers: true,
                canDeleteUsers: true,
                canCreateInvestors: true,
                canEditInvestors: true,
                canDeleteInvestors: true,
                canCreateTransactions: true,
                canEditTransactions: true,
                canDeleteTransactions: true,
                canPayProfits: true,
                canExportData: true,
                canImportData: true,
                canCreateBackup: true,
                canRestoreBackup: true,
                canViewReports: true,
                canManageSettings: true
            };
        case 'manager':
            return {
                canViewUsers: true,
                canCreateUsers: true,
                canEditUsers: true,
                canDeleteUsers: false,
                canCreateInvestors: true,
                canEditInvestors: true,
                canDeleteInvestors: true,
                canCreateTransactions: true,
                canEditTransactions: true,
                canDeleteTransactions: false,
                canPayProfits: true,
                canExportData: true,
                canImportData: true,
                canCreateBackup: true,
                canRestoreBackup: false,
                canViewReports: true,
                canManageSettings: false
            };
        case 'user':
        default:
            return {
                canViewUsers: false,
                canCreateUsers: false,
                canEditUsers: false,
                canDeleteUsers: false,
                canCreateInvestors: true,
                canEditInvestors: true,
                canDeleteInvestors: false,
                canCreateTransactions: true,
                canEditTransactions: false,
                canDeleteTransactions: false,
                canPayProfits: false,
                canExportData: true,
                canImportData: false,
                canCreateBackup: false,
                canRestoreBackup: false,
                canViewReports: true,
                canManageSettings: false
            };
    }
}




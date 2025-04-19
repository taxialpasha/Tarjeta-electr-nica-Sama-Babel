/**
 * auth-manager.js
 * مدير المصادقة لنظام محفظتي للاستثمار المتكامل
 * يتعامل مع تسجيل الدخول، وإنشاء الحسابات، وربط المستخدمين بحسابات المستثمرين
 */

// كائن لإدارة المصادقة وعمليات تسجيل الدخول
const AuthManager = (function() {
    // المتغيرات الخاصة
    let currentUser = null;
    let investorData = null;
    let isAuthenticated = false;
    let authStateCallbacks = [];

    /**
     * تهيئة نظام المصادقة
     * @returns {Promise} وعد يشير إلى نجاح أو فشل التهيئة
     */
    function initialize() {
        return new Promise((resolve, reject) => {
            console.log("تهيئة نظام المصادقة...");
            
            // التحقق من وجود Firebase
            if (typeof firebase === 'undefined' || !firebase.auth) {
                console.error("لم يتم العثور على Firebase Auth");
                reject(new Error("لم يتم العثور على Firebase Auth"));
                return;
            }

            // الاستماع لتغيرات حالة المصادقة
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    // المستخدم مسجل الدخول
                    currentUser = user;
                    isAuthenticated = true;
                    console.log(`تم تسجيل الدخول: ${user.email}`);
                    
                    // محاولة استرجاع بيانات المستثمر إذا كانت مرتبطة
                    fetchInvestorDataForUser(user.uid)
                        .then(data => {
                            investorData = data;
                            
                            // إشعار المكونات المسجلة بتغير حالة المصادقة
                            notifyAuthStateChanged();
                            
                            // توجيه المستخدم إلى الصفحة الرئيسية
                            navigateToDashboard();
                            resolve(true);
                        })
                        .catch(error => {
                            console.warn("لم يتم العثور على بيانات المستثمر للمستخدم:", error);
                            notifyAuthStateChanged();
                            resolve(true);
                        });
                } else {
                    // المستخدم غير مسجل الدخول
                    currentUser = null;
                    investorData = null;
                    isAuthenticated = false;
                    console.log("المستخدم غير مسجل الدخول");
                    
                    // إشعار المكونات المسجلة بتغير حالة المصادقة
                    notifyAuthStateChanged();
                    
                    // عرض شاشة تسجيل الدخول
                    showLoginScreen();
                    resolve(false);
                }
            });
        });
    }

    /**
     * تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
     * @param {string} email البريد الإلكتروني
     * @param {string} password كلمة المرور
     * @returns {Promise} وعد يشير إلى نجاح أو فشل تسجيل الدخول
     */
    function login(email, password) {
        return new Promise((resolve, reject) => {
            // عرض حالة التحميل
            showLoaderOverlay("جاري تسجيل الدخول...");
            
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // تسجيل الدخول بنجاح
                    currentUser = userCredential.user;
                    isAuthenticated = true;
                    
                    // محاولة استرجاع بيانات المستثمر
                    return fetchInvestorDataForUser(currentUser.uid);
                })
                .then(data => {
                    investorData = data;
                    hideLoaderOverlay();
                    
                    // إشعار بنجاح تسجيل الدخول
                    showNotification("تم تسجيل الدخول بنجاح", "success");
                    
                    // توجيه المستخدم إلى الصفحة الرئيسية
                    navigateToDashboard();
                    
                    resolve(currentUser);
                })
                .catch(error => {
                    console.error("خطأ في تسجيل الدخول:", error);
                    hideLoaderOverlay();
                    
                    // ترجمة رسائل الخطأ
                    let errorMessage = "فشل تسجيل الدخول";
                    
                    switch(error.code) {
                        case 'auth/user-not-found':
                            errorMessage = "البريد الإلكتروني غير مسجل";
                            break;
                        case 'auth/wrong-password':
                            errorMessage = "كلمة المرور غير صحيحة";
                            break;
                        case 'auth/invalid-email':
                            errorMessage = "البريد الإلكتروني غير صالح";
                            break;
                        case 'auth/too-many-requests':
                            errorMessage = "عدد محاولات كثيرة، يرجى المحاولة لاحقًا";
                            break;
                    }
                    
                    showNotification(errorMessage, "error");
                    reject(error);
                });
        });
    }

    /**
     * إنشاء حساب جديد
     * @param {string} email البريد الإلكتروني
     * @param {string} password كلمة المرور
     * @param {string} investorId معرف المستثمر (اختياري)
     * @returns {Promise} وعد يشير إلى نجاح أو فشل إنشاء الحساب
     */
    function signup(email, password, investorId = null) {
        return new Promise((resolve, reject) => {
            // عرض حالة التحميل
            showLoaderOverlay("جاري إنشاء الحساب...");
            
            // التحقق من معرف المستثمر إذا كان موجودًا
            const verifyAndCreateAccount = () => {
                // إنشاء الحساب
                firebase.auth().createUserWithEmailAndPassword(email, password)
                    .then(userCredential => {
                        // إنشاء الحساب بنجاح
                        currentUser = userCredential.user;
                        isAuthenticated = true;
                        
                        // ربط معرف المستثمر إذا كان موجودًا
                        if (investorId) {
                            return linkInvestorToUser(currentUser.uid, investorId);
                        }
                        
                        return Promise.resolve();
                    })
                    .then(() => {
                        // إذا تم ربط معرف المستثمر، قم باسترجاع بياناته
                        if (investorId) {
                            return fetchInvestorDataForUser(currentUser.uid);
                        }
                        
                        return Promise.resolve(null);
                    })
                    .then(data => {
                        investorData = data;
                        hideLoaderOverlay();
                        
                        // إشعار بنجاح إنشاء الحساب
                        if (investorId) {
                            showNotification("تم إنشاء الحساب وربطه بحسابك الاستثماري بنجاح", "success");
                        } else {
                            showNotification("تم إنشاء الحساب بنجاح", "success");
                        }
                        
                        // توجيه المستخدم إلى الصفحة الرئيسية
                        navigateToDashboard();
                        
                        resolve(currentUser);
                    })
                    .catch(error => {
                        console.error("خطأ في إنشاء الحساب:", error);
                        hideLoaderOverlay();
                        
                        // ترجمة رسائل الخطأ
                        let errorMessage = "فشل إنشاء الحساب";
                        
                        switch(error.code) {
                            case 'auth/email-already-in-use':
                                errorMessage = "البريد الإلكتروني مستخدم بالفعل";
                                break;
                            case 'auth/invalid-email':
                                errorMessage = "البريد الإلكتروني غير صالح";
                                break;
                            case 'auth/weak-password':
                                errorMessage = "كلمة المرور ضعيفة";
                                break;
                        }
                        
                        showNotification(errorMessage, "error");
                        reject(error);
                    });
            };
            
            // إذا كان هناك معرف مستثمر، تحقق من صحته أولاً
            if (investorId) {
                verifyInvestorId(investorId)
                    .then(valid => {
                        if (!valid) {
                            hideLoaderOverlay();
                            showNotification("معرف المستثمر غير صالح أو غير موجود", "error");
                            reject(new Error("معرف المستثمر غير صالح"));
                            return;
                        }
                        
                        verifyAndCreateAccount();
                    })
                    .catch(error => {
                        hideLoaderOverlay();
                        console.error("خطأ في التحقق من معرف المستثمر:", error);
                        showNotification("حدث خطأ أثناء التحقق من معرف المستثمر", "error");
                        reject(error);
                    });
            } else {
                verifyAndCreateAccount();
            }
        });
    }

    /**
     * التحقق من صحة معرف المستثمر
     * @param {string} investorId معرف المستثمر
     * @returns {Promise<boolean>} وعد يشير إلى ما إذا كان المعرف صالحًا
     */
    function verifyInvestorId(investorId) {
        return new Promise((resolve, reject) => {
            console.log(`التحقق من معرف المستثمر: ${investorId}`);
            
            firebase.database().ref('investors').once('value')
                .then(snapshot => {
                    const data = snapshot.val();
                    let found = false;
                    
                    if (data) {
                        Object.keys(data).forEach(key => {
                            if (data[key].id && data[key].id.toString() === investorId.toString()) {
                                found = true;
                            }
                        });
                    }
                    
                    resolve(found);
                })
                .catch(error => {
                    console.error("خطأ في التحقق من معرف المستثمر:", error);
                    reject(error);
                });
        });
    }

    /**
     * ربط معرف المستثمر بحساب المستخدم
     * @param {string} userId معرف المستخدم
     * @param {string} investorId معرف المستثمر
     * @returns {Promise} وعد يشير إلى نجاح أو فشل عملية الربط
     */
    function linkInvestorToUser(userId, investorId) {
        return firebase.database().ref(`users/${userId}`).set({
            investorId: investorId,
            linkedAt: new Date().toISOString()
        });
    }

    /**
     * استرجاع بيانات المستثمر للمستخدم
     * @param {string} userId معرف المستخدم
     * @returns {Promise} وعد يحتوي على بيانات المستثمر أو خطأ
     */
    function fetchInvestorDataForUser(userId) {
        return new Promise((resolve, reject) => {
            // استرجاع معرف المستثمر المرتبط بالمستخدم
            firebase.database().ref(`users/${userId}`).once('value')
                .then(snapshot => {
                    const userData = snapshot.val();
                    
                    if (!userData || !userData.investorId) {
                        reject(new Error("لم يتم ربط المستخدم بمستثمر"));
                        return;
                    }
                    
                    const investorId = userData.investorId;
                    
                    // استرجاع بيانات المستثمر
                    return firebase.database().ref(`investors/${investorId}`).once('value');
                })
                .then(snapshot => {
                    const data = snapshot.val();
                    
                    if (!data) {
                        reject(new Error("لم يتم العثور على بيانات المستثمر"));
                        return;
                    }
                    
                    resolve(data);
                })
                .catch(error => {
                    console.error("خطأ في استرجاع بيانات المستثمر:", error);
                    reject(error);
                });
        });
    }

    /**
     * البحث عن مستثمر بمعرف محدد
     * @param {string} investorId معرف المستثمر
     * @returns {Promise} وعد يحتوي على بيانات المستثمر أو خطأ
     */
    function findInvestorById(investorId) {
        return new Promise((resolve, reject) => {
            if (!investorId) {
                reject(new Error("معرف المستثمر مطلوب"));
                return;
            }
            
            // عرض حالة التحميل
            showLoaderOverlay("جاري البحث عن بيانات المستثمر...");
            
            firebase.database().ref('investors').once('value')
                .then(snapshot => {
                    const data = snapshot.val();
                    let investor = null;
                    
                    if (data) {
                        // البحث عن المستثمر بالمعرف
                        Object.keys(data).forEach(key => {
                            if (data[key].id && data[key].id.toString() === investorId.toString()) {
                                investor = data[key];
                                investor.key = key; // حفظ المفتاح للاستخدام لاحقاً
                            }
                        });
                    }
                    
                    hideLoaderOverlay();
                    
                    if (investor) {
                        resolve(investor);
                    } else {
                        showNotification("لم يتم العثور على مستثمر بهذا المعرف", "error");
                        reject(new Error("لم يتم العثور على مستثمر"));
                    }
                })
                .catch(error => {
                    hideLoaderOverlay();
                    console.error("خطأ في البحث عن المستثمر:", error);
                    showNotification("حدث خطأ أثناء البحث عن المستثمر", "error");
                    reject(error);
                });
        });
    }

    /**
     * تسجيل الخروج
     * @returns {Promise} وعد يشير إلى نجاح أو فشل تسجيل الخروج
     */
    function logout() {
        return new Promise((resolve, reject) => {
            firebase.auth().signOut()
                .then(() => {
                    // تسجيل الخروج بنجاح
                    currentUser = null;
                    investorData = null;
                    isAuthenticated = false;
                    
                    // إشعار بنجاح تسجيل الخروج
                    showNotification("تم تسجيل الخروج بنجاح", "info");
                    
                    // عرض شاشة تسجيل الدخول
                    showLoginScreen();
                    
                    resolve(true);
                })
                .catch(error => {
                    console.error("خطأ في تسجيل الخروج:", error);
                    showNotification("فشل تسجيل الخروج", "error");
                    reject(error);
                });
        });
    }

    /**
     * إعادة تعيين كلمة المرور
     * @param {string} email البريد الإلكتروني
     * @returns {Promise} وعد يشير إلى نجاح أو فشل إعادة التعيين
     */
    function resetPassword(email) {
        return new Promise((resolve, reject) => {
            if (!email) {
                reject(new Error("البريد الإلكتروني مطلوب"));
                return;
            }
            
            // عرض حالة التحميل
            showLoaderOverlay("جاري إرسال رابط إعادة تعيين كلمة المرور...");
            
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    hideLoaderOverlay();
                    showNotification("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني", "success");
                    resolve(true);
                })
                .catch(error => {
                    hideLoaderOverlay();
                    console.error("خطأ في إعادة تعيين كلمة المرور:", error);
                    
                    let errorMessage = "فشل إرسال رابط إعادة تعيين كلمة المرور";
                    
                    if (error.code === 'auth/user-not-found') {
                        errorMessage = "البريد الإلكتروني غير مسجل";
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = "البريد الإلكتروني غير صالح";
                    }
                    
                    showNotification(errorMessage, "error");
                    reject(error);
                });
        });
    }

    /**
     * ربط حساب مستثمر بالمستخدم الحالي
     * @param {string} investorId معرف المستثمر
     * @returns {Promise} وعد يشير إلى نجاح أو فشل عملية الربط
     */
    function linkInvestorToCurrent(investorId) {
        return new Promise((resolve, reject) => {
            if (!currentUser) {
                reject(new Error("يجب تسجيل الدخول أولاً"));
                return;
            }
            
            if (!investorId) {
                reject(new Error("معرف المستثمر مطلوب"));
                return;
            }
            
            // عرض حالة التحميل
            showLoaderOverlay("جاري ربط حساب المستثمر...");
            
            // التحقق من صحة معرف المستثمر
            verifyInvestorId(investorId)
                .then(valid => {
                    if (!valid) {
                        hideLoaderOverlay();
                        showNotification("معرف المستثمر غير صالح أو غير موجود", "error");
                        reject(new Error("معرف المستثمر غير صالح"));
                        return;
                    }
                    
                    // ربط معرف المستثمر بالمستخدم الحالي
                    return linkInvestorToUser(currentUser.uid, investorId);
                })
                .then(() => {
                    // استرجاع بيانات المستثمر
                    return fetchInvestorDataForUser(currentUser.uid);
                })
                .then(data => {
                    investorData = data;
                    hideLoaderOverlay();
                    
                    // إشعار بنجاح الربط
                    showNotification("تم ربط حساب المستثمر بنجاح", "success");
                    
                    // توجيه المستخدم إلى الصفحة الرئيسية
                    navigateToDashboard();
                    
                    resolve(true);
                })
                .catch(error => {
                    hideLoaderOverlay();
                    console.error("خطأ في ربط حساب المستثمر:", error);
                    showNotification("حدث خطأ أثناء ربط حساب المستثمر", "error");
                    reject(error);
                });
        });
    }

    /**
     * عرض شاشة تسجيل الدخول
     */
    function showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    /**
     * عرض واجهة التطبيق الرئيسية
     */
    function showMainAppUI() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    }

    /**
     * توجيه المستخدم إلى الصفحة الرئيسية
     */
    function navigateToDashboard() {
        // عرض واجهة التطبيق الرئيسية
        showMainAppUI();
        
        // التوجيه إلى صفحة لوحة التحكم
        if (typeof navigateToPage === 'function') {
            navigateToPage('dashboard');
        }
        
        // تحديث الواجهة
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
        
        if (typeof updateUserProfile === 'function') {
            updateUserProfile();
        }
    }

    /**
     * عرض شاشة ربط المستثمر بالحساب
     */
    function showLinkInvestorScreen() {
        // إنشاء النافذة المنبثقة إذا لم تكن موجودة
        let linkModal = document.getElementById('link-investor-modal');
        
        if (!linkModal) {
            linkModal = document.createElement('div');
            linkModal.id = 'link-investor-modal';
            linkModal.className = 'modal-overlay';
            linkModal.innerHTML = `
                <div class="modal animate__animated animate__fadeInUp">
                    <div class="modal-header">
                        <h3 class="modal-title">ربط حساب المستثمر</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>يرجى إدخال معرف المستثمر الخاص بك لربطه بحسابك:</p>
                        <div class="form-group">
                            <label for="link-investor-id">معرف المستثمر</label>
                            <div class="input-group">
                                <i class="fas fa-id-card"></i>
                                <input type="text" id="link-investor-id" placeholder="أدخل معرف المستثمر" required>
                            </div>
                            <small class="form-hint">يمكنك الحصول على معرف المستثمر من مدير النظام أو من التقارير المرسلة إليك</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close-btn">إلغاء</button>
                        <button class="btn btn-primary" id="link-investor-btn">ربط الحساب</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(linkModal);
            
            // إضافة مستمعي الأحداث
            const closeButtons = linkModal.querySelectorAll('.modal-close, .modal-close-btn');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    linkModal.classList.remove('active');
                });
            });
            
            const linkButton = linkModal.querySelector('#link-investor-btn');
            linkButton.addEventListener('click', () => {
                const investorId = document.getElementById('link-investor-id').value;
                
                if (!investorId) {
                    showNotification("يرجى إدخال معرف المستثمر", "error");
                    return;
                }
                
                linkInvestorToCurrent(investorId)
                    .then(() => {
                        linkModal.classList.remove('active');
                    })
                    .catch(error => {
                        console.error("خطأ في ربط حساب المستثمر:", error);
                    });
            });
        }
        
        // عرض النافذة المنبثقة
        linkModal.classList.add('active');
    }

    /**
     * عرض شاشة البحث عن مستثمر
     */
    function showFindInvestorScreen() {
        // إنشاء النافذة المنبثقة إذا لم تكن موجودة
        let findModal = document.getElementById('find-investor-modal');
        
        if (!findModal) {
            findModal = document.createElement('div');
            findModal.id = 'find-investor-modal';
            findModal.className = 'modal-overlay';
            findModal.innerHTML = `
                <div class="modal animate__animated animate__fadeInUp">
                    <div class="modal-header">
                        <h3 class="modal-title">البحث عن مستثمر</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>يرجى إدخال معرف المستثمر للاطلاع على بياناته:</p>
                        <div class="form-group">
                            <label for="find-investor-id">معرف المستثمر</label>
                            <div class="input-group">
                                <i class="fas fa-search"></i>
                                <input type="text" id="find-investor-id" placeholder="أدخل معرف المستثمر" required>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close-btn">إلغاء</button>
                        <button class="btn btn-primary" id="find-investor-btn">بحث</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(findModal);
            
            // إضافة مستمعي الأحداث
            const closeButtons = findModal.querySelectorAll('.modal-close, .modal-close-btn');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    findModal.classList.remove('active');
                });
            });
            
            const findButton = findModal.querySelector('#find-investor-btn');
            findButton.addEventListener('click', () => {
                const investorId = document.getElementById('find-investor-id').value;
                
                if (!investorId) {
                    showNotification("يرجى إدخال معرف المستثمر", "error");
                    return;
                }
                
                findInvestorById(investorId)
                    .then(investor => {
                        // إغلاق النافذة المنبثقة
                        findModal.classList.remove('active');
                        
                        // عرض بيانات المستثمر
                        showInvestorDetails(investor);
                    })
                    .catch(error => {
                        console.error("خطأ في البحث عن المستثمر:", error);
                    });
            });
        }
        
        // عرض النافذة المنبثقة
        findModal.classList.add('active');
    }

    /**
     * عرض تفاصيل المستثمر
     * @param {Object} investor بيانات المستثمر
     */
    function showInvestorDetails(investor) {
        if (!investor) return;
        
        // إنشاء النافذة المنبثقة
        let detailsModal = document.createElement('div');
        detailsModal.className = 'modal-overlay';
        detailsModal.id = 'investor-details-modal';
        
        // حساب القيم المطلوبة
        const amount = investor.amount || 0;
        const investorName = investor.name || "غير معروف";
        const phone = investor.phone || "غير متوفر";
        
        // حساب الربح الشهري (إذا كان متاحاً)
        let monthlyProfit = 0;
        if (investor.investments && Array.isArray(investor.investments)) {
            monthlyProfit = investor.investments.reduce((total, inv) => {
                return total + (inv.interest || 0);
            }, 0);
        }
        
        // تحويل تاريخ الانضمام إلى صيغة مناسبة
        const joinDate = investor.joinDate || investor.createdAt || "";
        const formattedDate = joinDate ? new Date(joinDate).toLocaleDateString('ar-SA') : "غير متوفر";
        
        // إنشاء محتوى النافذة
        detailsModal.innerHTML = `
            <div class="modal animate__animated animate__fadeInUp">
                <div class="modal-header">
                    <h3 class="modal-title">تفاصيل المستثمر - ${investorName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="investor-profile">
                        <div class="investor-avatar large">${investorName.charAt(0)}</div>
                        <h2 class="investor-fullname">${investorName}</h2>
                        <span class="badge badge-success">${investor.status || 'نشط'}</span>
                    </div>
                    
                    <div class="investor-stats">
                        <div class="stat-item">
                            <div class="stat-value">${formatCurrency(amount)}</div>
                            <div class="stat-label">إجمالي الاستثمار</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatCurrency(monthlyProfit)}</div>
                            <div class="stat-label">الربح الشهري</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formattedDate}</div>
                            <div class="stat-label">تاريخ الانضمام</div>
                        </div>
                    </div>
                    
                    <div class="detail-group">
                        <h3 class="detail-group-title">معلومات الاتصال</h3>
                        <div class="detail-item">
                            <div class="detail-label">رقم الهاتف</div>
                            <div class="detail-value">${phone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">العنوان</div>
                            <div class="detail-value">${investor.address || 'غير محدد'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">رقم البطاقة</div>
                            <div class="detail-value">${investor.cardNumber || 'غير محدد'}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    ${!isAuthenticated ? 
                    `<button class="btn btn-primary" id="login-to-access-btn">تسجيل الدخول للوصول الكامل</button>` : 
                    currentUser && !investorData ? 
                    `<button class="btn btn-primary" id="link-to-account-btn" data-investor-id="${investor.id}">ربط بحسابي</button>` : ''}
                    <button class="btn btn-outline modal-close-btn">إغلاق</button>
                </div>
            </div>
        `;
        
        // إضافة النافذة إلى الصفحة
        document.body.appendChild(detailsModal);
        
        // إضافة مستمعي الأحداث
        const closeButtons = detailsModal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                detailsModal.remove();
            });
        });
        
        // إضافة مستمع حدث لزر تسجيل الدخول
        const loginButton = detailsModal.querySelector('#login-to-access-btn');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                detailsModal.remove();
                showLoginScreen();
            });
        }
        
        // إضافة مستمع حدث لزر ربط الحساب
        const linkButton = detailsModal.querySelector('#link-to-account-btn');
        if (linkButton) {
            linkButton.addEventListener('click', () => {
                const id = linkButton.getAttribute('data-investor-id');
                detailsModal.remove();
                linkInvestorToCurrent(id);
            });
        }
        
        // عرض النافذة
        detailsModal.classList.add('active');
    }

    /**
     * تسجيل مكون للاستماع لتغييرات حالة المصادقة
     * @param {Function} callback دالة الاستدعاء عند تغيير حالة المصادقة
     */
    function registerAuthStateCallback(callback) {
        if (typeof callback === 'function') {
            authStateCallbacks.push(callback);
        }
    }

    /**
     * إشعار المكونات المسجلة بتغير حالة المصادقة
     */
    function notifyAuthStateChanged() {
        const authState = {
            isAuthenticated,
            currentUser,
            investorData
        };
        
        // استدعاء جميع المستمعين المسجلين
        authStateCallbacks.forEach(callback => {
            try {
                callback(authState);
            } catch (error) {
                console.error("خطأ في استدعاء مستمع حالة المصادقة:", error);
            }
        });
    }

    /**
     * عرض شاشة التحميل
     * @param {string} message الرسالة المعروضة (اختياري)
     */
    function showLoaderOverlay(message = 'جاري التحميل...') {
        // إنشاء عنصر التحميل إذا لم يكن موجودًا
        let loader = document.getElementById('app-loader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'app-loader';
            
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <p id="loader-message">${message}</p>
                </div>
            `;
            
            document.body.appendChild(loader);
        } else {
            // تحديث الرسالة
            const loaderMessage = loader.querySelector('#loader-message');
            if (loaderMessage) {
                loaderMessage.textContent = message;
            }
            
            // عرض شاشة التحميل
            loader.style.display = 'flex';
            loader.style.opacity = '1';
        }
    }

    /**
     * إخفاء شاشة التحميل
     */
    function hideLoaderOverlay() {
        const loader = document.getElementById('app-loader');
        
        if (loader) {
            loader.style.opacity = '0';
            
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }

    /**
     * عرض إشعار للمستخدم
     * @param {string} message نص الإشعار
     * @param {string} type نوع الإشعار (success, error, warning, info)
     */
    function showNotification(message, type = 'info') {
        // استخدام دالة عرض الإشعارات الموجودة في التطبيق إذا كانت متاحة
        if (typeof window.showToast === 'function') {
            window.showToast(type === 'error' ? 'خطأ' : type === 'success' ? 'نجاح' : 'تنبيه', message, type);
            return;
        }
        
        // إنشاء إشعار جديد إذا لم تكن الدالة موجودة
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }

    // تصدير واجهة برمجة التطبيق العامة
    return {
        initialize,
        login,
        signup,
        logout,
        resetPassword,
        linkInvestorToCurrent,
        findInvestorById,
        
        showLoginScreen,
        showMainAppUI,
        showLinkInvestorScreen,
        showFindInvestorScreen,
        
        getCurrentUser: () => currentUser,
        getInvestorData: () => investorData,
        isUserAuthenticated: () => isAuthenticated,
        
        registerAuthStateCallback
    };
})();

// تهيئة مدير المصادقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إعداد مستمع الأحداث لنماذج المصادقة
    setupAuthForms();
    setupModifyLoginScreenInterface();
    
    // تهيئة مدير المصادقة
    AuthManager.initialize()
        .then(isLoggedIn => {
            console.log(`تهيئة مدير المصادقة اكتملت بنجاح. حالة تسجيل الدخول: ${isLoggedIn}`);
        })
        .catch(error => {
            console.error("خطأ في تهيئة مدير المصادقة:", error);
        });
});

/**
 * إعداد مستمعي الأحداث لنماذج المصادقة
 */
function setupAuthForms() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                AuthManager.showNotification("يرجى إدخال البريد الإلكتروني وكلمة المرور", "error");
                return;
            }
            
            AuthManager.login(email, password)
                .catch(error => console.error("خطأ في تسجيل الدخول:", error));
        });
    }
    
    // نموذج إنشاء حساب
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const investorId = document.getElementById('register-investor-id').value;
            
            if (!email || !password || !confirmPassword) {
                AuthManager.showNotification("يرجى إدخال جميع البيانات المطلوبة", "error");
                return;
            }
            
            if (password !== confirmPassword) {
                AuthManager.showNotification("كلمة المرور وتأكيدها غير متطابقين", "error");
                return;
            }
            
            AuthManager.signup(email, password, investorId)
                .catch(error => console.error("خطأ في إنشاء الحساب:", error));
        });
    }
    
    // رابط نسيت كلمة المرور
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // عرض نافذة منبثقة لإدخال البريد الإلكتروني
            showForgotPasswordModal();
        });
    }
    
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                AuthManager.logout()
                    .catch(error => console.error("خطأ في تسجيل الخروج:", error));
            }
        });
    }
}

/**
 * عرض نافذة منبثقة لإعادة تعيين كلمة المرور
 */
function showForgotPasswordModal() {
    // إنشاء النافذة المنبثقة
    let resetModal = document.createElement('div');
    resetModal.className = 'modal-overlay';
    resetModal.id = 'reset-password-modal';
    
    resetModal.innerHTML = `
        <div class="modal animate__animated animate__fadeInUp">
            <div class="modal-header">
                <h3 class="modal-title">إعادة تعيين كلمة المرور</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>يرجى إدخال البريد الإلكتروني المرتبط بحسابك. سيتم إرسال رابط إعادة تعيين كلمة المرور إليه.</p>
                <div class="form-group">
                    <label for="reset-email">البريد الإلكتروني</label>
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="reset-email" placeholder="أدخل البريد الإلكتروني" required>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline modal-close-btn">إلغاء</button>
                <button class="btn btn-primary" id="send-reset-link">إرسال الرابط</button>
            </div>
        </div>
    `;
    
    // إضافة النافذة إلى الصفحة
    document.body.appendChild(resetModal);
    
    // إضافة مستمعي الأحداث
    const closeButtons = resetModal.querySelectorAll('.modal-close, .modal-close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            resetModal.remove();
        });
    });
    
    const sendButton = resetModal.querySelector('#send-reset-link');
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const email = document.getElementById('reset-email').value;
            
            if (!email) {
                AuthManager.showNotification("يرجى إدخال البريد الإلكتروني", "error");
                return;
            }
            
            AuthManager.resetPassword(email)
                .then(() => {
                    resetModal.remove();
                })
                .catch(error => {
                    console.error("خطأ في إعادة تعيين كلمة المرور:", error);
                });
        });
    }
    
    // عرض النافذة
    resetModal.classList.add('active');
}

/**
 * تعديل واجهة شاشة تسجيل الدخول
 */
function setupModifyLoginScreenInterface() {
    // إضافة زر البحث عن مستثمر في شاشة تسجيل الدخول
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
        // التحقق من وجود الزر مسبقاً
        if (!document.getElementById('find-investor-button')) {
            // إنشاء العنصر
            const findButton = document.createElement('button');
            findButton.id = 'find-investor-button';
            findButton.className = 'btn btn-outline guest-only';
            findButton.style.marginTop = '20px';
            findButton.innerHTML = '<i class="fas fa-search"></i> البحث عن مستثمر برقم التعريف';
            
            // إضافة مستمع الحدث
            findButton.addEventListener('click', () => {
                AuthManager.showFindInvestorScreen();
            });
            
            // البحث عن مكان مناسب لإضافة الزر
            const authFooter = loginScreen.querySelector('.form-footer');
            if (authFooter) {
                authFooter.appendChild(document.createElement('br'));
                authFooter.appendChild(findButton);
            } else {
                // إضافة الزر في نهاية النموذج إذا لم يتم العثور على العنصر المناسب
                const loginFormContainer = loginScreen.querySelector('#login-tab');
                if (loginFormContainer) {
                    const divContainer = document.createElement('div');
                    divContainer.style.textAlign = 'center';
                    divContainer.style.marginTop = '20px';
                    divContainer.appendChild(findButton);
                    loginFormContainer.appendChild(divContainer);
                }
            }
        }
    }
}

/**
 * تنسيق المبالغ المالية
 * @param {number} amount المبلغ
 * @param {boolean} withCurrency إضافة اسم العملة (اختياري)
 * @returns {string} المبلغ المنسق
 */
function formatCurrency(amount, withCurrency = true) {
    // التحقق من صحة المبلغ
    if (amount === null || amount === undefined || isNaN(amount)) {
        return withCurrency ? "0 دينار" : "0";
    }
    
    // تنسيق المبلغ
    const formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // إضافة اسم العملة إذا كان مطلوباً
    if (withCurrency) {
        return `${formattedAmount} دينار`;
    } else {
        return formattedAmount;
    }
}
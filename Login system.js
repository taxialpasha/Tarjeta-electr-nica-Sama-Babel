// إضافة متغيرات لنظام الأمان
let users = [];
let currentUser = null;
let isAuthenticated = false;
const DEFAULT_ADMIN_CODE = 'admin123'; // الرمز الإداري الافتراضي

// دالة لإنشاء بيانات المستخدمين الأولية عند أول استخدام
function initSecuritySystem() {
  // التحقق من وجود بيانات المستخدمين في التخزين المحلي
  const savedUsers = localStorage.getItem('investmentAppUsers');
  
  if (savedUsers) {
    users = JSON.parse(savedUsers);
  } else {
    // إنشاء حساب المسؤول الافتراضي إذا لم يكن هناك مستخدمين
    users = [{
      id: 'admin',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    }];
    saveUsers();
  }
  
  // التحقق من وجود جلسة محفوظة
  const savedSession = localStorage.getItem('investmentAppSession');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      if (session && session.username) {
        const user = users.find(u => u.username === session.username);
        if (user) {
          currentUser = user;
          isAuthenticated = true;
          updateSecurityUI();
          return true; // المستخدم مسجل دخوله بالفعل
        }
      }
    } catch (e) {
      console.error('خطأ في قراءة بيانات الجلسة', e);
    }
  }
  
  // إذا لم يكن هناك جلسة صالحة، عرض صفحة تسجيل الدخول
  showLoginPage();
  return false;
}

// حفظ بيانات المستخدمين
function saveUsers() {
  localStorage.setItem('investmentAppUsers', JSON.stringify(users));
}

// إنشاء جلسة للمستخدم
function createSession(username) {
  const session = {
    username,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('investmentAppSession', JSON.stringify(session));
}

// إنهاء جلسة المستخدم
function destroySession() {
  localStorage.removeItem('investmentAppSession');
  currentUser = null;
  isAuthenticated = false;
}

// تحديث واجهة الأمان بناءً على حالة المستخدم
function updateSecurityUI() {
  const securityIcon = document.getElementById('toggle-security').querySelector('i');
  
  if (isAuthenticated) {
    securityIcon.classList.remove('fa-lock');
    securityIcon.classList.add('fa-unlock');
    
    // إخفاء صفحة تسجيل الدخول إذا كانت ظاهرة
    document.getElementById('login-page').classList.add('hidden');
    
    // إظهار المحتوى الرئيسي
    document.getElementById('main-content').style.display = 'block';
    document.querySelector('header').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    document.getElementById('floating-action').style.display = 'flex';
    
    // تحديث الصفحة الحالية
    navigateTo(currentPage);
    
    showNotification(`مرحباً ${currentUser.username}، تم تسجيل الدخول بنجاح`, 'success');
    
    // تحديث خيار إدارة المستخدمين (للمسؤولين فقط)
    const manageUsersItem = document.getElementById('manage-users-dropdown');
    if (manageUsersItem) {
      if (currentUser.role === 'admin') {
        manageUsersItem.style.display = 'flex';
      } else {
        manageUsersItem.style.display = 'none';
      }
    }
  } else {
    securityIcon.classList.remove('fa-unlock');
    securityIcon.classList.add('fa-lock');
  }
}

// إظهار صفحة تسجيل الدخول الرئيسية
function showLoginPage() {
  // إخفاء المحتوى الرئيسي
  document.getElementById('main-content').style.display = 'none';
  document.querySelector('header').style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'none';
  document.getElementById('floating-action').style.display = 'none';
  
  // إظهار صفحة تسجيل الدخول
  document.getElementById('login-page').classList.remove('hidden');
}

// إظهار نافذة تسجيل الدخول
function showLoginModal() {
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  showModal('login-modal');
}

// إظهار نافذة إنشاء حساب
function showRegisterModal() {
  document.getElementById('register-error').classList.add('hidden');
  document.getElementById('register-username').value = '';
  document.getElementById('register-password').value = '';
  document.getElementById('register-confirm-password').value = '';
  document.getElementById('register-admin-code').value = '';
  document.getElementById('register-role').value = 'user';
  showModal('register-modal');
}

// التحقق من صحة بيانات المستخدم
function authenticateUser(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    isAuthenticated = true;
    createSession(user.username);
    updateSecurityUI();
    return true;
  }
  return false;
}

// تسجيل خروج المستخدم
function logoutUser() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    destroySession();
    updateSecurityUI();
    showLoginPage();
  }
}

// إنشاء حساب جديد
function createUser(username, password, role, adminCode, createdBy) {
  // التحقق من أن اسم المستخدم غير موجود مسبقاً
  if (users.some(u => u.username === username)) {
    return {
      success: false,
      message: 'اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر'
    };
  }
  
  // التحقق من صحة الرمز الإداري
  const adminUser = users.find(u => u.role === 'admin');
  if (!adminUser && adminCode !== DEFAULT_ADMIN_CODE) {
    return {
      success: false,
      message: 'الرمز الإداري غير صحيح'
    };
  } else if (adminUser && adminCode !== adminUser.password && adminCode !== DEFAULT_ADMIN_CODE) {
    return {
      success: false,
      message: 'الرمز الإداري غير صحيح'
    };
  }
  
  // إنشاء المستخدم الجديد
  const newUser = {
    id: Date.now().toString(),
    username,
    password,
    role,
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'system'
  };
  
  users.push(newUser);
  saveUsers();
  
  return {
    success: true,
    user: newUser
  };
}

// حذف مستخدم
function deleteUser(userId) {
  // التأكد من أن المستخدم الحالي هو مسؤول
  if (!currentUser || currentUser.role !== 'admin') {
    return {
      success: false,
      message: 'ليس لديك صلاحية حذف المستخدمين'
    };
  }
  
  // التأكد من عدم حذف المستخدم لنفسه
  if (userId === currentUser.id) {
    return {
      success: false,
      message: 'لا يمكنك حذف حسابك الحالي'
    };
  }
  
  // البحث عن المستخدم وحذفه
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return {
      success: false,
      message: 'المستخدم غير موجود'
    };
  }
  
  users.splice(userIndex, 1);
  saveUsers();
  
  return {
    success: true,
    message: 'تم حذف المستخدم بنجاح'
  };
}

// عرض نافذة إدارة المستخدمين
function showUsersManagementModal() {
  // التأكد من أن المستخدم الحالي هو مسؤول
  if (!currentUser || currentUser.role !== 'admin') {
    showNotification('ليس لديك صلاحية لإدارة المستخدمين', 'error');
    return;
  }
  
  renderUsersList();
  showModal('users-management-modal');
}

// عرض قائمة المستخدمين
function renderUsersList() {
  const usersList = document.getElementById('users-list');
  
  if (users.length === 0) {
    usersList.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <i class="fas fa-users text-4xl mb-2"></i>
        <p>لا يوجد مستخدمين حالياً</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border text-right">اسم المستخدم</th>
            <th class="p-2 border text-right">الصلاحية</th>
            <th class="p-2 border text-right">تاريخ الإنشاء</th>
            <th class="p-2 border text-right">منشئ الحساب</th>
            <th class="p-2 border text-right">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  for (const user of users) {
    const createdAt = new Date(user.createdAt);
    const formattedDate = `${createdAt.getDate()}/${createdAt.getMonth()+1}/${createdAt.getFullYear()}`;
    
    const isCurrentUser = user.id === currentUser.id;
    const roleName = user.role === 'admin' ? 'مدير النظام' : 'مستخدم عادي';
    
    html += `
      <tr class="border-b ${isCurrentUser ? 'bg-blue-50' : ''}">
        <td class="p-2 border">
          ${user.username}
          ${isCurrentUser ? '<span class="badge badge-primary mr-1">أنت</span>' : ''}
        </td>
        <td class="p-2 border">
          <span class="badge ${user.role === 'admin' ? 'badge-red' : 'badge-green'}">${roleName}</span>
        </td>
        <td class="p-2 border">${formattedDate}</td>
        <td class="p-2 border">${user.createdBy}</td>
        <td class="p-2 border">
          <div class="flex justify-center gap-2">
            ${!isCurrentUser ? `
            <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">
              <i class="fas fa-trash"></i>
            </button>
            ` : '—'}
          </div>
        </td>
      </tr>
    `;
  }
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  usersList.innerHTML = html;
  
  // إضافة مستمعي الأحداث لأزرار الحذف
  const deleteButtons = document.getElementsByClassName('delete-user-btn');
  Array.from(deleteButtons).forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        const result = deleteUser(userId);
        if (result.success) {
          showNotification(result.message, 'success');
          renderUsersList(); // تحديث القائمة
        } else {
          showNotification(result.message, 'error');
        }
      }
    });
  });
  
  // خيار إدارة المستخدمين من القائمة المنسدلة
  document.getElementById('manage-users-dropdown')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('actions-dropdown').classList.remove('show');
    
    if (currentUser && currentUser.role === 'admin') {
      showUsersManagementModal();
    } else {
      showNotification('ليس لديك صلاحية لإدارة المستخدمين', 'error');
    }
  });
  
  // إغلاق نافذة إدارة المستخدمين
  document.getElementById('close-users-modal')?.addEventListener('click', function() {
    hideModal('users-management-modal');
  });
  
  document.getElementById('close-users-management-btn')?.addEventListener('click', function() {
    hideModal('users-management-modal');
  });
  
  // إضافة مستخدم جديد من نافذة إدارة المستخدمين
  document.getElementById('add-new-user-btn')?.addEventListener('click', function() {
    hideModal('users-management-modal');
    showRegisterModal();
  });
}

// تضمين مستمعي الأحداث لنظام الأمان
function addSecurityEventListeners() {
  // زر الأمان
  document.getElementById('toggle-security').addEventListener('click', function() {
    if (isAuthenticated) {
      logoutUser();
    } else {
      showLoginModal();
    }
  });
  
  // نموذج تسجيل الدخول الرئيسي
  document.getElementById('main-login-btn').addEventListener('click', function() {
    const username = document.getElementById('main-login-username').value;
    const password = document.getElementById('main-login-password').value;
    
    if (!username || !password) {
      document.getElementById('main-login-error').classList.remove('hidden');
      return;
    }
    
    if (authenticateUser(username, password)) {
      // تم تسجيل الدخول بنجاح
      document.getElementById('main-login-error').classList.add('hidden');
    } else {
      document.getElementById('main-login-error').classList.remove('hidden');
    }
  });
  
  // نموذج تسجيل الدخول المنبثق
  document.getElementById('login-btn').addEventListener('click', function() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      document.getElementById('login-error').classList.remove('hidden');
      return;
    }
    
    if (authenticateUser(username, password)) {
      // تم تسجيل الدخول بنجاح
      hideModal('login-modal');
    } else {
      document.getElementById('login-error').classList.remove('hidden');
    }
  });
  
  // التبديل بين نموذج تسجيل الدخول وإنشاء الحساب
  document.getElementById('goto-register-btn').addEventListener('click', function() {
    hideModal('login-modal');
    showRegisterModal();
  });
  
  document.getElementById('goto-login-btn').addEventListener('click', function() {
    hideModal('register-modal');
    showLoginModal();
  });
  
  // إنشاء حساب جديد
  document.getElementById('register-btn').addEventListener('click', function() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const adminCode = document.getElementById('register-admin-code').value;
    const role = document.getElementById('register-role').value;
    
    // التحقق من البيانات
    if (!username || !password || !confirmPassword || !adminCode) {
      showRegisterError('الرجاء إدخال جميع البيانات المطلوبة');
      return;
    }
    
    if (password !== confirmPassword) {
      showRegisterError('كلمات المرور غير متطابقة');
      return;
    }
    
    // إنشاء المستخدم
    const result = createUser(
      username, 
      password, 
      role, 
      adminCode, 
      currentUser ? currentUser.username : 'register_page'
    );
    
    if (result.success) {
      // تم إنشاء الحساب بنجاح
      hideModal('register-modal');
      showNotification('تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن', 'success');
      showLoginModal();
    } else {
      showRegisterError(result.message);
    }
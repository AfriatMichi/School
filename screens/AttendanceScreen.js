// Attendance Screen Component
class AttendanceScreen {
  constructor(className, onBack, onComplete) {
    this.className = className;
    this.onBack = onBack;
    this.onComplete = onComplete;
    this.students = window.dataService.getClassData(className);
    this.attendance = {};
    this.hasUnsavedChanges = false;
    this.isInitialized = false;
    this.existingCounts = []; // רשימת הספירות הקיימות ליום הנוכחי
    this.currentDate = new Date().toISOString().split('T')[0];
  }

  async init() {
    // טעינת נתוני נוכחות קיימים מה-DB
    await this.loadExistingAttendance();
    
    // טעינת הספירות הקיימות ליום הנוכחי (בשיטה פשוטה)
    await this.loadExistingCountsSimple();
    
    // הוספת event listener לעזיבת הדף
    this.setupBeforeUnloadListener();
    
    this.isInitialized = true;
  }

  setupBeforeUnloadListener() {
    this.beforeUnloadHandler = (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  cleanup() {
    // הסרת event listener בעת עזיבת המסך
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  async loadExistingAttendance() {
    try {
      // טעינת נתוני הכיתה מה-DB
      const classData = await window.databaseService.getClassData(this.className);
      if (classData && classData.students) {
        // יצירת אובייקט נוכחות מהנתונים הקיימים
        this.attendance = {};
        classData.students.forEach(student => {
          if (student.status && student.status > 0) {
            this.attendance[student.id] = {
              name: student.name,
              status: student.status,
              lastAttendance: student.lastAttendance,
              timestamp: student.timestamp
            };
          }
        });
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתוני נוכחות קיימים:', error);
      this.attendance = {};
    }
  }

  async loadExistingCounts() {
    try {
      // טעינת כל הספירות הקיימות ליום הנוכחי
      this.existingCounts = await window.dataService.getAttendanceCountsByClassAndDate(
        this.className, 
        this.currentDate
      );
      console.log(`נטענו ${this.existingCounts.length} ספירות קיימות ליום ${this.currentDate}`);
    } catch (error) {
      console.error('שגיאה בטעינת ספירות קיימות:', error);
      // אם יש בעיה, ננסה לטעון את כל הספירות ולסנן ידנית
      try {
        const allCounts = await window.dataService.getAllAttendanceCounts();
        this.existingCounts = allCounts.filter(count => {
          return count.classId === this.className && count.date === this.currentDate;
        });
        console.log(`נטענו ${this.existingCounts.length} ספירות קיימות (סינון ידני) ליום ${this.currentDate}`);
      } catch (fallbackError) {
        console.error('שגיאה גם בניסיון השני:', fallbackError);
        this.existingCounts = [];
      }
    }
  }

  async loadExistingCountsSimple() {
    try {
      // טעינת כל הספירות ללא שאילתות מורכבות
      const allCounts = await window.dataService.getAllAttendanceCounts();
      
      // סינון ידני לפי כיתה ותאריך
      this.existingCounts = allCounts.filter(count => {
        // בדיקה אם זה מסמך עם מבנה נכון
        if (count.classId === this.className && count.date === this.currentDate) {
          return true;
        }
        
        // אם אין classId, נבדוק אם יש תלמידים עם שמות מהכיתה
        const students = Object.values(count).filter(val => typeof val === 'object' && val.name);
        if (students.length > 0) {
          // נניח שזה מהכיתה הנוכחית אם יש תלמידים
          return true;
        }
        
        return false;
      });
      
      console.log(`נטענו ${this.existingCounts.length} ספירות קיימות (פשוט) ליום ${this.currentDate}`);
    } catch (error) {
      console.error('שגיאה בטעינת ספירות קיימות (פשוט):', error);
      this.existingCounts = [];
    }
  }

  async handleAttendance(status, studentId) {
    // המרת studentId למספר אם הוא מחרוזת
    const numericStudentId = Number(studentId);
    const student = this.students.find(s => s.id === numericStudentId);
    if (student) {
      // המרת הסטטוס למספר
      let numericStatus;
      switch(status) {
        case 'present':
          numericStatus = 1;
          break;
        case 'late':
          numericStatus = 2;
          break;
        case 'absent':
          numericStatus = 3;
          break;
        default:
          numericStatus = 0;
      }

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];

      // עדכון נתוני נוכחות מקומיים בלבד (לא שומרים ל-DB עדיין)
      this.attendance[student.id] = {
        name: student.name,
        status: numericStatus,
        lastAttendance: currentDate,
        timestamp: now.toISOString()
      };
      
      // סימון שיש שינויים שלא נשמרו
      this.hasUnsavedChanges = true;
      
      // רענון המסך
      window.app.render();
    }
  }

  async resetStudentAttendance(studentId) {
    // המרת studentId למספר אם הוא מחרוזת
    const numericStudentId = Number(studentId);
    const student = this.students.find(s => s.id === numericStudentId);
    if (student) {
      // מחיקת הסטטוס מהנתונים המקומיים בלבד
      delete this.attendance[student.id];
      
      // סימון שיש שינויים שלא נשמרו
      this.hasUnsavedChanges = true;
      
      // רענון המסך
      window.app.render();
    }
  }

  async resetClassAttendance() {
    if (!confirm(`האם אתה בטוח שברצונך לאפס את כל הנוכחות של כיתה ${this.className}? פעולה זו תאפס את הספירה הנוכחית ותאפשר לך להתחיל ספירה חדשה.`)) {
      return;
    }

    // איפוס הנתונים המקומיים בלבד
    this.attendance = {};
    this.hasUnsavedChanges = true;
    
    // רענון המסך
    window.app.render();
    
    alert('✅ הספירה אופסה בהצלחה. לחץ על "שמירה" כדי לשמור את הספירה החדשה.');
  }

  async saveAllAttendance() {
    try {
      // חישוב מספר התלמידים שלא סומנו
      const unsavedStudents = this.students.length - Object.keys(this.attendance).length;
      
      // שמירת הספירה החדשה כרשומה נפרדת ב-DB
      await this.saveAttendanceToDB();
      
      // טעינת הספירות המעודכנות (בשיטה פשוטה)
      await this.loadExistingCountsSimple();
      
      // סימון שאין שינויים שלא נשמרו
      this.hasUnsavedChanges = false;
      
      // רענון המסך
      window.app.render();
      
      // הצגת הודעה מתאימה
      if (unsavedStudents > 0) {
        alert(`✅ הספירה נשמרה בהצלחה!\n\nנסמנו אוטומטית ${unsavedStudents} תלמידים כחסרים.`);
      } else {
        alert('✅ הספירה נשמרה בהצלחה!');
      }
    } catch (error) {
      console.error('שגיאה בשמירת נתונים:', error);
      alert('❌ שגיאה בשמירת הנתונים. נסה שוב.');
    }
  }

  async saveAttendanceToDB() {
    // שמירת הספירה החדשה כרשומה נפרדת ב-DB
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // יצירת עותק של נתוני הנוכחות הנוכחיים
    const attendanceToSave = { ...this.attendance };
    
    // סימון אוטומטי של תלמידים שלא סומנו כחסרים
    this.students.forEach(student => {
      if (!attendanceToSave[student.id]) {
        attendanceToSave[student.id] = {
          name: student.name,
          status: 3, // חיסור (חסר)
          lastAttendance: currentDate,
          timestamp: now.toISOString()
        };
      }
    });
    
    // יצירת שם לספירה החדשה
    const countNumber = this.existingCounts.length + 1;
    const countName = `ספירה ${countNumber} - ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
    
    // שמירת הספירה החדשה עם כל התלמידים (כולל אלו שסומנו אוטומטית כחסרים)
    const result = await window.dataService.saveNewAttendanceCount(
      this.className, 
      attendanceToSave, 
      countName
    );
    
    console.log(`ספירה חדשה נשמרה בהצלחה: ${result.countName}`);
    console.log(`נסמנו אוטומטית ${this.students.length - Object.keys(this.attendance).length} תלמידים כחסרים`);
    
    // עדכון נתוני הכיתה הנוכחיים (לצורך תצוגה)
    await window.dataService.saveAttendanceBatch(this.className, attendanceToSave);
    
    // עדכון הנתונים המקומיים להצגה
    this.attendance = attendanceToSave;
  }

  async saveAndShowSummary() {
    // שמירת הנתונים לפני המעבר לסיכום
    if (this.hasUnsavedChanges) {
      await this.saveAllAttendance();
    }
    
    // העברת הנתונים המעודכנים (כולל תלמידים שסומנו אוטומטית)
    this.onComplete(this.attendance);
  }

  async showCountsHistory() {
    try {
      // טעינת הספירות המעודכנות
      await this.loadExistingCounts();
      
      // הצגת היסטוריית הספירות
      const historyHtml = this.renderCountsHistory();
      
      // יצירת modal להצגת ההיסטוריה
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900">היסטוריית ספירות - כיתה ${this.className}</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>
          ${historyHtml}
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // סגירת modal בלחיצה על הרקע
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
      
    } catch (error) {
      console.error('שגיאה בהצגת היסטוריית ספירות:', error);
      alert('❌ שגיאה בטעינת היסטוריית הספירות');
    }
  }

  renderCountsHistory() {
    if (this.existingCounts.length === 0) {
      return `
        <div class="text-center py-8">
          <div class="text-gray-500 text-lg">אין ספירות ליום ${this.currentDate}</div>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${this.existingCounts.map((count, index) => `
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">${count.countName}</h3>
                <p class="text-sm text-gray-500">${new Date(count.createdAt).toLocaleString('he-IL')}</p>
              </div>
              <button
                onclick="window.app.currentScreen.deleteCount('${count.countId}')"
                class="text-red-600 hover:text-red-800 text-sm"
              >
                מחיקה
              </button>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-green-100 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-green-700">${count.presentCount}</div>
                <div class="text-green-600 text-sm">נוכחים</div>
              </div>
              <div class="bg-orange-100 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-orange-700">${count.lateCount}</div>
                <div class="text-orange-600 text-sm">מאחרים</div>
              </div>
              <div class="bg-gray-100 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-gray-700">${count.absentCount}</div>
                <div class="text-gray-600 text-sm">חסרים</div>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200">
              <h4 class="font-medium text-gray-900 mb-2">פירוט תלמידים:</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                ${Object.entries(count.data).map(([studentId, studentData]) => `
                  <div class="flex items-center justify-between">
                    <span class="text-gray-700">${studentData.name}</span>
                    <span class="px-2 py-1 rounded text-white text-xs ${this.getStatusColor(studentData.status)}">
                      ${this.getStatusText(studentData.status)}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async deleteCount(countId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק ספירה זו?')) {
      return;
    }

    try {
      await window.dataService.deleteAttendanceCount(countId);
      
      // טעינת הספירות המעודכנות
      await this.loadExistingCounts();
      
      // רענון המסך
      window.app.render();
      
      alert('✅ הספירה נמחקה בהצלחה');
      
      // סגירת modal
      const modal = document.querySelector('.fixed');
      if (modal) {
        modal.remove();
      }
    } catch (error) {
      console.error('שגיאה במחיקת ספירה:', error);
      alert('❌ שגיאה במחיקת הספירה');
    }
  }

  async showDailySummary() {
    try {
      // טעינת הספירות המעודכנות
      await this.loadExistingCounts();
      
      if (this.existingCounts.length === 0) {
        alert('אין ספירות ליום הנוכחי');
        return;
      }

      // חישוב סיכום כולל
      const totalPresent = this.existingCounts.reduce((sum, count) => sum + count.presentCount, 0);
      const totalLate = this.existingCounts.reduce((sum, count) => sum + count.lateCount, 0);
      const totalAbsent = this.existingCounts.reduce((sum, count) => sum + count.absentCount, 0);
      const averagePresent = Math.round(totalPresent / this.existingCounts.length);
      const averageLate = Math.round(totalLate / this.existingCounts.length);
      const averageAbsent = Math.round(totalAbsent / this.existingCounts.length);

      const summaryHtml = `
        <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">סיכום יומי - כיתה ${this.className}</h2>
            <p class="text-gray-600">יום ${this.currentDate}</p>
            <p class="text-blue-600 font-medium">${this.existingCounts.length} ספירות נעשו היום</p>
          </div>
          
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-green-100 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-green-700">${averagePresent}</div>
              <div class="text-green-600 text-sm">נוכחים בממוצע</div>
            </div>
            <div class="bg-orange-100 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-orange-700">${averageLate}</div>
              <div class="text-orange-600 text-sm">מאחרים בממוצע</div>
            </div>
            <div class="bg-gray-100 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-gray-700">${averageAbsent}</div>
              <div class="text-gray-600 text-sm">חסרים בממוצע</div>
            </div>
          </div>
          
          <div class="space-y-3">
            <h3 class="font-semibold text-gray-900">פירוט ספירות:</h3>
            ${this.existingCounts.map((count, index) => `
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span class="font-medium text-gray-900">${count.countName}</span>
                  <span class="text-sm text-gray-500 ml-2">${new Date(count.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="flex items-center gap-3 text-sm">
                  <span class="text-green-600">${count.presentCount} נוכחים</span>
                  <span class="text-orange-600">${count.lateCount} מאחרים</span>
                  <span class="text-gray-600">${count.absentCount} חסרים</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="mt-6 text-center">
            <button
              onclick="this.closest('.fixed').remove()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      `;

      // יצירת modal להצגת הסיכום
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = summaryHtml;
      
      document.body.appendChild(modal);
      
      // סגירת modal בלחיצה על הרקע
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
      
    } catch (error) {
      console.error('שגיאה בהצגת סיכום יומי:', error);
      alert('❌ שגיאה בטעינת הסיכום היומי');
    }
  }

  async showUnsavedStudents() {
    const unsavedStudents = this.students.filter(student => !this.attendance[student.id]);
    
    if (unsavedStudents.length === 0) {
      alert('כל התלמידים סומנו');
      return;
    }

    const studentsList = unsavedStudents.map(student => student.name).join('\n');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-4">
          <h2 class="text-xl font-bold text-gray-900 mb-2">תלמידים שלא סומנו</h2>
          <p class="text-gray-600">${unsavedStudents.length} תלמידים יסומנו אוטומטית כחסרים</p>
        </div>
        
        <div class="max-h-60 overflow-y-auto mb-4">
          <div class="space-y-2">
            ${unsavedStudents.map(student => `
              <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span class="text-gray-900">${student.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="text-center">
          <button
            onclick="this.closest('.fixed').remove()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            הבנתי
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // סגירת modal בלחיצה על הרקע
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  render() {
    // חישוב הסטטיסטיקות
    const presentCount = Object.values(this.attendance).filter(a => a.status === 1).length;
    const lateCount = Object.values(this.attendance).filter(a => a.status === 2).length;
    const absentCount = this.students.length - presentCount - lateCount;

    return `
      <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <div class="flex items-center justify-between mb-6">
              <button
                onclick="window.app.currentScreen.onBack()"
                class="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← חזור
              </button>
              <h1 class="text-3xl font-bold text-gray-900">כיתה ${this.className}</h1>
              <div class="flex items-center gap-4">
                <div class="text-gray-500">
                  ${this.students.length} תלמידים
                </div>
                <button
                  onclick="resetClassAttendance()"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  ספירה חדשה
                </button>
              </div>
            </div>
          </div>

          <!-- מידע על הספירות הקיימות -->
          ${this.existingCounts.length > 0 ? `
            <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-blue-900 mb-2">ספירות קיימות ליום ${this.currentDate}</h3>
                  <p class="text-blue-700">נעשו ${this.existingCounts.length} ספירות היום</p>
                </div>
                <div class="flex gap-2">
                  <button
                    onclick="window.app.currentScreen.showDailySummary()"
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    סיכום יומי
                  </button>
                  <button
                    onclick="window.app.currentScreen.showCountsHistory()"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    צפייה בהיסטוריה
                  </button>
                </div>
              </div>
              <div class="mt-3 space-y-2">
                ${this.existingCounts.slice(0, 3).map(count => `
                  <div class="flex items-center justify-between bg-white rounded-lg p-3">
                    <span class="text-blue-800 font-medium">${count.countName}</span>
                    <div class="flex items-center gap-4 text-sm">
                      <span class="text-green-600">${count.presentCount} נוכחים</span>
                      <span class="text-orange-600">${count.lateCount} מאחרים</span>
                      <span class="text-gray-600">${count.absentCount} חסרים</span>
                    </div>
                  </div>
                `).join('')}
                ${this.existingCounts.length > 3 ? `
                  <div class="text-center text-blue-600 text-sm">
                    ועוד ${this.existingCounts.length - 3} ספירות...
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- סיכום נוכחות -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 text-center">ספירה נוכחית</h2>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-green-700">${presentCount}</div>
                <div class="text-green-600 text-sm">נוכחים</div>
              </div>
              <div class="bg-orange-100 border-2 border-orange-300 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-orange-700">${lateCount}</div>
                <div class="text-orange-600 text-sm">מאחרים</div>
              </div>
              <div class="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-gray-700">${absentCount}</div>
                <div class="text-gray-600 text-sm">חסרים</div>
              </div>
            </div>
            
            ${this.students.length - Object.keys(this.attendance).length > 0 ? `
              <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <span class="text-yellow-800 font-medium">
                      ${this.students.length - Object.keys(this.attendance).length} תלמידים לא סומנו
                    </span>
                  </div>
                  <button
                    onclick="window.app.currentScreen.showUnsavedStudents()"
                    class="text-yellow-700 hover:text-yellow-900 text-sm underline"
                  >
                    צפייה ברשימה
                  </button>
                </div>
                <p class="text-yellow-700 text-sm mt-1">
                  תלמידים אלו יסומנו אוטומטית כחסרים בעת השמירה
                </p>
              </div>
            ` : ''}
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
             <div class="space-y-3">
               ${(() => {
                 // הפרדת תלמידים מסומנים ולא מסומנים
                 const markedStudents = [];
                 const unmarkedStudents = [];
                 
                 this.students.forEach(student => {
                   if (this.attendance[student.id]) {
                     markedStudents.push(student);
                   } else {
                     unmarkedStudents.push(student);
                   }
                 });
                 
                 // שילוב: קודם לא מסומנים, אחר כך מסומנים
                 const sortedStudents = [...unmarkedStudents, ...markedStudents];
                 
                 return sortedStudents.map((student, index) => `
                   <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg ${
                     this.attendance[student.id] ? 'bg-gray-50' : ''
                   }">
                     <span class="text-lg font-medium text-gray-900">${student.name}</span>
                     <div class="flex gap-2">
                       ${!this.attendance[student.id] ? `
                         <button
                           onclick="handleAttendance('present', '${student.id}')"
                           class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                         >
                           נוכח
                         </button>
                         <button
                           onclick="handleAttendance('late', '${student.id}')"
                           class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                         >
                           איחור
                         </button>
                       ` : `
                         <div class="flex items-center gap-2">
                           <span class="px-4 py-2 rounded-full text-white font-medium ${
                             this.getStatusColor(this.attendance[student.id].status)
                           }">
                             ${this.getStatusText(this.attendance[student.id].status)}
                           </span>
                           <button
                             onclick="resetStudentAttendance('${student.id}')"
                             class="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                           >
                             איפוס
                           </button>
                         </div>
                       `}
                     </div>
                   </div>
                 `).join('');
               })()}
             </div>
           </div>

          ${Object.keys(this.attendance).length === this.students.length ? `
            <div class="text-center mt-6">
              <button
                onclick="window.app.currentScreen.saveAndShowSummary()"
                class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                שמור ספירה ועבור לסיכום
              </button>
            </div>
          ` : `
            <div class="text-center mt-6">
              <button
                onclick="window.app.currentScreen.saveAndShowSummary()"
                class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                שמור ספירה ועבור לסיכום (${this.students.length - Object.keys(this.attendance).length} יסומנו כחסרים)
              </button>
            </div>
          `}
        </div>
        
        <!-- כפתור שמירה צף -->
        ${this.hasUnsavedChanges ? `
          <div class="fixed bottom-6 right-6 z-50">
            <button
              onclick="window.app.currentScreen.saveAllAttendance()"
              class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              ${this.students.length - Object.keys(this.attendance).length > 0 ? 
                `שמירה (${this.students.length - Object.keys(this.attendance).length} יסומנו כחסרים)` : 
                'שמירה'
              }
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderSummary() {
    const attendanceList = Object.values(this.attendance);
    const presentCount = attendanceList.filter(a => a.status === 'present').length;
    const absentCount = attendanceList.filter(a => a.status === 'absent').length;
    const lateCount = attendanceList.filter(a => a.status === 'late').length;

    return `
      <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <div class="mx-auto mb-4 h-16 w-16 text-green-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">סיכום נוכחות</h1>
            <p class="text-xl text-gray-600">כיתה ${this.className}</p>
          </div>

          <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="bg-green-100 border-2 border-green-300 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-green-700">${presentCount}</div>
              <div class="text-green-600">הגיעו</div>
            </div>
            <div class="bg-red-100 border-2 border-red-300 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-red-700">${absentCount}</div>
              <div class="text-red-600">חיסורים</div>
            </div>
            <div class="bg-orange-100 border-2 border-orange-300 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-orange-700">${lateCount}</div>
              <div class="text-orange-600">איחורים</div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">רשימת נוכחות מפורטת</h2>
            <div class="space-y-3">
              ${attendanceList.map((student, index) => `
                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <span class="text-lg font-medium text-gray-900">${student.name}</span>
                  <span class="px-4 py-2 rounded-full text-white font-medium ${this.getStatusColor(student.status)}">
                    ${this.getStatusText(student.status)}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="text-center">
            <button
              onclick="window.app.currentScreen.onBack()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              חזור למסך הראשי
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getStatusColor(status) {
    switch(Number(status)) {
      case 1: return 'bg-green-500';  // נוכח
      case 2: return 'bg-orange-500'; // איחור
      case 3: return 'bg-red-500';    // חיסור
      default: return 'bg-gray-500';
    }
  }

  getStatusText(status) {
    switch(Number(status)) {
      case 1: return 'הגיע';
      case 2: return 'איחור';
      case 3: return 'חיסור';
      default: return '';
    }
  }
}

window.AttendanceScreen = AttendanceScreen; 

// פונקציות גלובליות לתמיכה בספירות
window.resetClassAttendance = function() {
  if (window.app.currentScreen && window.app.currentScreen.resetClassAttendance) {
    window.app.currentScreen.resetClassAttendance();
  }
};

window.showCountsHistory = function() {
  if (window.app.currentScreen && window.app.currentScreen.showCountsHistory) {
    window.app.currentScreen.showCountsHistory();
  }
};

window.deleteCount = function(countId) {
  if (window.app.currentScreen && window.app.currentScreen.deleteCount) {
    window.app.currentScreen.deleteCount(countId);
  }
};

window.showDailySummary = function() {
  if (window.app.currentScreen && window.app.currentScreen.showDailySummary) {
    window.app.currentScreen.showDailySummary();
  }
};

window.showUnsavedStudents = function() {
  if (window.app.currentScreen && window.app.currentScreen.showUnsavedStudents) {
    window.app.currentScreen.showUnsavedStudents();
  }
}; 
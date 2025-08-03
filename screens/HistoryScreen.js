// History Screen Component
class HistoryScreen {
  constructor(className, onBack) {
    this.className = className;
    this.onBack = onBack;
    this.history = [];
    this.selectedDate = null;
  }

  async init() {
    await this.loadWeeklyHistory();
  }

  async loadWeeklyHistory() {
    try {
      const weekDates = window.dataService.getWeekDates();
      const endDate = weekDates[weekDates.length - 1];
      const startDate = weekDates[0];
      
      // טעינת נתוני הספירות
      this.history = await window.dataService.getClassAttendanceCountsHistory(this.className, 50);
      
      console.log('נטענו ספירות:', this.history.length);
      console.log('תאריכי שבוע:', startDate, 'עד', endDate);
      
      // המרת מבנה הנתונים הקיים לפורמט הנכון
      this.history = this.history.map(doc => {
        // בדיקה אם זה מסמך עם מבנה נכון או מבנה ישן
        if (doc.data && doc.countId && doc.classId) {
          // מבנה נכון - כבר מוכן
          return doc;
        } else {
          // מבנה ישן - צריך להמיר
          console.log('ממיר מסמך ישן:', doc.id);
          
          // חילוץ נתוני תלמידים מהמסמך
          const students = {};
          let presentCount = 0;
          let lateCount = 0;
          let absentCount = 0;
          let date = null;
          let timestamp = null;
          
          Object.entries(doc).forEach(([key, value]) => {
            if (key === 'timestamp' && typeof value === 'string') {
              timestamp = value;
              date = value.split('T')[0];
            } else if (typeof value === 'object' && value.name && value.status) {
              // זה תלמיד
              students[key] = value;
              if (value.status === 1) presentCount++;
              else if (value.status === 2) lateCount++;
              else if (value.status === 3) absentCount++;
              
              if (!date && value.lastAttendance) {
                date = value.lastAttendance;
              }
              if (!timestamp && value.timestamp) {
                timestamp = value.timestamp;
              }
            }
          });
          
          // יצירת מבנה נכון
          return {
            id: doc.id,
            countId: doc.id,
            classId: this.className,
            date: date || new Date().toISOString().split('T')[0],
            countName: `ספירה - ${date || 'תאריך לא ידוע'}`,
            data: students,
            timestamp: timestamp,
            totalStudents: Object.keys(students).length,
            presentCount: presentCount,
            lateCount: lateCount,
            absentCount: absentCount,
            createdAt: timestamp || new Date().toISOString()
          };
        }
      });
      
      // סינון רק הספירות של השבוע הנוכחי
      this.history = this.history.filter(count => {
        const countDate = count.date;
        const isInWeek = countDate >= startDate && countDate <= endDate;
        console.log(`ספירה ${count.countName}: ${countDate} - ${isInWeek ? 'בשבוע' : 'לא בשבוע'}`);
        return isInWeek;
      });
      
      console.log('ספירות בשבוע הנוכחי:', this.history.length);
      
      this.selectedDate = endDate; // היום הנוכחי כברירת מחדל
    } catch (error) {
      console.error('שגיאה בטעינת היסטוריית ספירות:', error);
      this.history = [];
    }
  }

  render() {
    const weekDates = window.dataService.getWeekDates();
    
    return `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div class="max-w-7xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="flex items-center justify-between mb-6">
              <button
                onclick="window.app.currentScreen.onBack()"
                class="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← חזור
              </button>
              <h1 class="text-3xl font-bold text-gray-900">היסטוריית ספירות נוכחות - כיתה ${this.className}</h1>
              <button
                onclick="window.app.currentScreen.refreshData()"
                class="text-blue-600 hover:text-blue-800 transition-colors"
              >
                🔄 רענן
              </button>
              <button
                onclick="window.app.currentScreen.showAllCounts()"
                class="text-green-600 hover:text-green-800 transition-colors"
              >
                📊 כל הספירות
              </button>
              <button
                onclick="window.app.currentScreen.loadAllCounts()"
                class="text-purple-600 hover:text-purple-800 transition-colors"
              >
                📅 כל התאריכים
              </button>
            </div>
          </div>

          <!-- Student Statistics -->
          ${this.renderStudentStatistics()}

          <!-- Week Navigation -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-4">ניווט שבועי - ספירות נוכחות</h2>
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>תאריכי שבוע נוכחי:</strong> ${window.dataService.getWeekDates()[0]} עד ${window.dataService.getWeekDates()[6]}
              </p>
              <p class="text-sm text-blue-600">
                <strong>ספירות נטענו:</strong> ${this.history.length}
              </p>
            </div>
            <div class="grid grid-cols-7 gap-2">
              ${weekDates.map(date => {
                const dayCounts = this.history.filter(h => h.date === date);
                const isSelected = this.selectedDate === date;
                const isToday = date === new Date().toISOString().split('T')[0];
                
                return `
                  <button
                    onclick="window.app.currentScreen.selectDate('${date}')"
                    class="p-3 rounded-lg text-center transition-all duration-200 ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : dayCounts.length > 0
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${isToday ? 'ring-2 ring-blue-400' : ''}"
                  >
                    <div class="text-sm font-medium">${this.getDayName(date)}</div>
                    <div class="text-xs">${this.formatDateShort(date)}</div>
                    ${dayCounts.length > 0 ? `
                      <div class="text-xs mt-1">
                        ${dayCounts.length} ספירות
                      </div>
                    ` : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Selected Day Details -->
          ${this.selectedDate ? this.renderDayDetails() : ''}

          <!-- Weekly Summary -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">סיכום שבועי</h2>
            ${this.renderWeeklySummary()}
          </div>
        </div>
      </div>
    `;
  }

  renderDayDetails() {
    const dayCounts = this.history.filter(h => h.date === this.selectedDate);
    
    if (dayCounts.length === 0) {
      return `
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4">
            ${window.dataService.formatDateHebrew(this.selectedDate)}
          </h2>
          <div class="text-center py-8 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-lg">אין ספירות נוכחות ליום זה</p>
          </div>
        </div>
      `;
    }

    // חישוב סטטיסטיקות כוללות ליום
    const totalPresent = dayCounts.reduce((sum, count) => sum + (count.presentCount || 0), 0);
    const totalLate = dayCounts.reduce((sum, count) => sum + (count.lateCount || 0), 0);
    const totalAbsent = dayCounts.reduce((sum, count) => sum + (count.absentCount || 0), 0);
    const totalStudents = dayCounts.reduce((sum, count) => sum + (count.totalStudents || 0), 0);

    return `
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          ${window.dataService.formatDateHebrew(this.selectedDate)} - ${dayCounts.length} ספירות
        </h2>
        
        <!-- Statistics -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-green-100 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-700">${totalPresent}</div>
            <div class="text-green-600">נוכחים סה"כ</div>
          </div>
          <div class="bg-orange-100 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-orange-700">${totalLate}</div>
            <div class="text-orange-600">מאחרים סה"כ</div>
          </div>
          <div class="bg-red-100 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-700">${totalAbsent}</div>
            <div class="text-red-600">חסרים סה"כ</div>
          </div>
          <div class="bg-blue-100 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-700">${dayCounts.length}</div>
            <div class="text-blue-600">מספר ספירות</div>
          </div>
        </div>

        <!-- Counts List -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">פירוט הספירות:</h3>
          ${dayCounts.map((count, index) => {
            const students = Object.values(count.data || {});
            
            // מיון התלמידים לפי סטטוס
            const sortedStudents = students.sort((a, b) => {
              const statusA = Number(a.status) || 0;
              const statusB = Number(b.status) || 0;
              
              // סדר עדיפות: נוכחים (1), מאחרים (2), חסרים (3)
              if (statusA === 1 && statusB !== 1) return -1;
              if (statusB === 1 && statusA !== 1) return 1;
              if (statusA === 2 && statusB !== 2) return -1;
              if (statusB === 2 && statusA !== 2) return 1;
              if (statusA === 3 && statusB !== 3) return -1;
              if (statusB === 3 && statusA !== 3) return 1;
              
              // אם אותו סטטוס, מיין לפי שם
              return a.name.localeCompare(b.name, 'he');
            });
            
            const presentCount = students.filter(s => s.status === 1).length;
            const lateCount = students.filter(s => s.status === 2).length;
            const absentCount = students.filter(s => s.status === 3).length;
            
            return `
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h4 class="font-semibold text-gray-900">${count.countName}</h4>
                    <p class="text-sm text-gray-500">${new Date(count.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div class="flex items-center gap-4 text-sm">
                    <span class="text-green-600">${presentCount} נוכחים</span>
                    <span class="text-orange-600">${lateCount} מאחרים</span>
                    <span class="text-red-600">${absentCount} חסרים</span>
                  </div>
                </div>
                
                <!-- Students List -->
                <div class="overflow-x-auto">
                  <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium text-gray-900">רשימת תלמידים (ממוינת לפי נוכחות)</h5>
                    <div class="text-xs text-gray-600">
                      <span class="inline-flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        נוכחים
                      </span>
                      <span class="inline-flex items-center ml-2">
                        <span class="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                        מאחרים
                      </span>
                      <span class="inline-flex items-center ml-2">
                        <span class="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                        חסרים
                      </span>
                    </div>
                  </div>
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-200">
                        <th class="text-right py-2 px-3 font-medium text-gray-900">שם התלמיד</th>
                        <th class="text-center py-2 px-3 font-medium text-gray-900">סטטוס</th>
                        <th class="text-center py-2 px-3 font-medium text-gray-900">שעה</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${sortedStudents.map(student => `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                          <td class="py-2 px-3 font-medium text-gray-900">${student.name}</td>
                          <td class="py-2 px-3 text-center">
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getStatusColor(student.status)}">
                              ${this.getStatusText(student.status)}
                            </span>
                          </td>
                          <td class="py-2 px-3 text-center text-gray-600">
                            ${student.timestamp ? this.formatTime(student.timestamp) : '-'}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderWeeklySummary() {
    const weekStats = {
      totalDays: new Set(this.history.map(h => h.date)).size,
      totalCounts: this.history.length,
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      averagePresent: 0,
      averageCountsPerDay: 0
    };

    this.history.forEach(count => {
      weekStats.totalPresent += count.presentCount || 0;
      weekStats.totalLate += count.lateCount || 0;
      weekStats.totalAbsent += count.absentCount || 0;
    });

    if (weekStats.totalDays > 0) {
      weekStats.averagePresent = Math.round(weekStats.totalPresent / weekStats.totalDays);
      weekStats.averageCountsPerDay = Math.round(weekStats.totalCounts / weekStats.totalDays * 10) / 10;
    }

    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="bg-blue-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-700">${weekStats.totalDays}</div>
          <div class="text-blue-600">ימים פעילים</div>
        </div>
        <div class="bg-green-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-700">${weekStats.totalCounts}</div>
          <div class="text-green-600">ספירות סה"כ</div>
        </div>
        <div class="bg-orange-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-orange-700">${weekStats.averageCountsPerDay}</div>
          <div class="text-orange-600">ממוצע ספירות ליום</div>
        </div>
        <div class="bg-purple-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-purple-700">${weekStats.averagePresent}</div>
          <div class="text-purple-600">ממוצע נוכחים ליום</div>
        </div>
      </div>
      
      <div class="mt-6 grid grid-cols-3 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div class="text-xl font-bold text-green-700">${weekStats.totalPresent}</div>
          <div class="text-green-600">נוכחים סה"כ</div>
        </div>
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div class="text-xl font-bold text-orange-700">${weekStats.totalLate}</div>
          <div class="text-orange-600">מאחרים סה"כ</div>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div class="text-xl font-bold text-red-700">${weekStats.totalAbsent}</div>
          <div class="text-red-600">חסרים סה"כ</div>
        </div>
      </div>
    `;
  }

  renderStudentStatistics() {
    const { topAbsent, topLate, topPresent } = this.calculateStudentStats();

    return `
      <div class="bg-white rounded-xl shadow-lg p-6 mt-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6 text-center">סטטיסטיקות תלמידים - שבוע נוכחי</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Top Present Students -->
          <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div class="flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <h3 class="text-lg font-semibold text-green-900">הכי הרבה נוכחות</h3>
            </div>
            ${topPresent.length > 0 ? `
              <div class="space-y-2">
                ${topPresent.map((student, index) => `
                  <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-green-200">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        ${index + 1}
                      </span>
                      <span class="text-green-800 font-medium">${student.name}</span>
                    </div>
                    <span class="text-green-600 font-bold">${student.present} נוכחות</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-4 text-green-600">
                אין נתוני נוכחות השבוע
              </div>
            `}
          </div>

          <!-- Top Absent Students -->
          <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div class="flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h3 class="text-lg font-semibold text-red-900">הכי הרבה חיסורים</h3>
            </div>
            ${topAbsent.length > 0 ? `
              <div class="space-y-2">
                ${topAbsent.map((student, index) => `
                  <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        ${index + 1}
                      </span>
                      <span class="text-red-800 font-medium">${student.name}</span>
                    </div>
                    <span class="text-red-600 font-bold">${student.absent} חיסורים</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-4 text-red-600">
                אין חיסורים השבוע
              </div>
            `}
          </div>

          <!-- Top Late Students -->
          <div class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div class="flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-lg font-semibold text-orange-900">הכי הרבה איחורים</h3>
            </div>
            ${topLate.length > 0 ? `
              <div class="space-y-2">
                ${topLate.map((student, index) => `
                  <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-orange-200">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        ${index + 1}
                      </span>
                      <span class="text-orange-800 font-medium">${student.name}</span>
                    </div>
                    <span class="text-orange-600 font-bold">${student.late} איחורים</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-4 text-orange-600">
                אין איחורים השבוע
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  getDayName(dateString) {
    const date = new Date(dateString);
    const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    return days[date.getDay()];
  }

  formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusColor(status) {
    switch(Number(status)) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status) {
    switch(Number(status)) {
      case 1: return 'נוכח';
      case 2: return 'איחור';
      case 3: return 'חיסור';
      default: return 'לא דווח';
    }
  }

  selectDate(date) {
    this.selectedDate = date;
    window.app.render();
  }

  async refreshData() {
    await this.loadWeeklyHistory();
    window.app.render();
  }

  async showAllCounts() {
    try {
      // טעינת כל הספירות ללא סינון תאריכים
      const allCounts = await window.dataService.getClassAttendanceCountsHistory(this.className, 100);
      
      if (allCounts.length === 0) {
        alert('אין ספירות כלל');
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900">כל הספירות - כיתה ${this.className}</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>
          
          <div class="space-y-4">
            ${allCounts.map((count, index) => {
              const students = Object.values(count.data || {});
              const presentCount = students.filter(s => s.status === 1).length;
              const lateCount = students.filter(s => s.status === 2).length;
              const absentCount = students.filter(s => s.status === 3).length;
              
              return `
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <h4 class="font-semibold text-gray-900">${count.countName}</h4>
                      <p class="text-sm text-gray-500">תאריך: ${count.date} | שעה: ${new Date(count.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="flex items-center gap-4 text-sm">
                      <span class="text-green-600">${presentCount} נוכחים</span>
                      <span class="text-orange-600">${lateCount} מאחרים</span>
                      <span class="text-red-600">${absentCount} חסרים</span>
                    </div>
                  </div>
                  
                  <div class="text-sm text-gray-600">
                    <strong>תלמידים:</strong> ${students.map(s => s.name).join(', ')}
                  </div>
                </div>
              `;
            }).join('')}
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
      
    } catch (error) {
      console.error('שגיאה בהצגת כל הספירות:', error);
      alert('❌ שגיאה בטעינת הספירות');
    }
  }

  async loadAllCounts() {
    try {
      // טעינת כל הספירות ללא שאילתות מורכבות
      this.history = await window.dataService.getAllAttendanceCounts();
      
      console.log('נטענו כל הספירות:', this.history.length);
      
      // סינון רק הספירות של הכיתה הנוכחית
      this.history = this.history.filter(doc => {
        // בדיקה אם זה מסמך של הכיתה הנוכחית
        if (doc.classId === this.className) {
          return true;
        }
        
        // אם אין classId, נבדוק אם יש תלמידים עם שמות מהכיתה
        const students = Object.values(doc).filter(val => typeof val === 'object' && val.name);
        if (students.length > 0) {
          // נניח שזה מהכיתה הנוכחית אם יש תלמידים
          return true;
        }
        
        return false;
      });
      
      console.log('ספירות של הכיתה:', this.history.length);
      
      // המרת מבנה הנתונים הקיים לפורמט הנכון
      this.history = this.history.map(doc => {
        // בדיקה אם זה מסמך עם מבנה נכון או מבנה ישן
        if (doc.data && doc.countId && doc.classId) {
          // מבנה נכון - כבר מוכן
          return doc;
        } else {
          // מבנה ישן - צריך להמיר
          console.log('ממיר מסמך ישן:', doc.id);
          
          // חילוץ נתוני תלמידים מהמסמך
          const students = {};
          let presentCount = 0;
          let lateCount = 0;
          let absentCount = 0;
          let date = null;
          let timestamp = null;
          
          Object.entries(doc).forEach(([key, value]) => {
            if (key === 'timestamp' && typeof value === 'string') {
              timestamp = value;
              date = value.split('T')[0];
            } else if (typeof value === 'object' && value.name && value.status) {
              // זה תלמיד
              students[key] = value;
              if (value.status === 1) presentCount++;
              else if (value.status === 2) lateCount++;
              else if (value.status === 3) absentCount++;
              
              if (!date && value.lastAttendance) {
                date = value.lastAttendance;
              }
              if (!timestamp && value.timestamp) {
                timestamp = value.timestamp;
              }
            }
          });
          
          // יצירת מבנה נכון
          return {
            id: doc.id,
            countId: doc.id,
            classId: this.className,
            date: date || new Date().toISOString().split('T')[0],
            countName: `ספירה - ${date || 'תאריך לא ידוע'}`,
            data: students,
            timestamp: timestamp,
            totalStudents: Object.keys(students).length,
            presentCount: presentCount,
            lateCount: lateCount,
            absentCount: absentCount,
            createdAt: timestamp || new Date().toISOString()
          };
        }
      });
      
      console.log('לאחר המרה:', this.history.length);
      
      // בחירת התאריך הראשון כברירת מחדל
      if (this.history.length > 0) {
        this.selectedDate = this.history[0].date;
      }
      
      window.app.render();
      
    } catch (error) {
      console.error('שגיאה בטעינת כל הספירות:', error);
      alert('❌ שגיאה בטעינת הספירות');
    }
  }

  calculateStudentStats() {
    const weekDates = window.dataService.getWeekDates();
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    
    // סינון ספירות של השבוע הנוכחי
    const weekCounts = this.history.filter(count => {
      const countDate = count.date;
      return countDate >= startDate && countDate <= endDate;
    });
    
    // אוסף נתוני תלמידים
    const studentStats = {};
    
    weekCounts.forEach(count => {
      if (count.data) {
        Object.entries(count.data).forEach(([studentId, studentData]) => {
          if (!studentStats[studentId]) {
            studentStats[studentId] = {
              name: studentData.name,
              present: 0,
              late: 0,
              absent: 0,
              total: 0
            };
          }
          
          studentStats[studentId].total++;
          
          if (studentData.status === 1) {
            studentStats[studentId].present++;
          } else if (studentData.status === 2) {
            studentStats[studentId].late++;
          } else if (studentData.status === 3) {
            studentStats[studentId].absent++;
          }
        });
      }
    });
    
    // מיון לפי חיסורים, איחורים ונוכחות
    const studentsArray = Object.values(studentStats);
    const topAbsent = studentsArray
      .filter(student => student.absent > 0)
      .sort((a, b) => b.absent - a.absent)
      .slice(0, 10);
    
    const topLate = studentsArray
      .filter(student => student.late > 0)
      .sort((a, b) => b.late - a.late)
      .slice(0, 10);
    
    const topPresent = studentsArray
      .filter(student => student.present > 0)
      .sort((a, b) => b.present - a.present)
      .slice(0, 10);
    
    return { topAbsent, topLate, topPresent };
  }
}

window.HistoryScreen = HistoryScreen; 

// פונקציות גלובליות לתמיכה בהיסטוריה
window.showAllCounts = function() {
  if (window.app.currentScreen && window.app.currentScreen.showAllCounts) {
    window.app.currentScreen.showAllCounts();
  }
};

window.loadAllCounts = function() {
  if (window.app.currentScreen && window.app.currentScreen.loadAllCounts) {
    window.app.currentScreen.loadAllCounts();
  }
}; 
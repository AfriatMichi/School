// Class Details Screen Component
class ClassDetailsScreen {
  constructor(className, onBack) {
    this.className = className;
    this.onBack = onBack;
    this.classData = null;
    this.students = [];
  }

  async init() {
    await this.loadClassData();
  }

  async loadClassData() {
    try {
      // טעינת נתוני הכיתה מה-DB
      this.classData = await window.databaseService.getClassData(this.className);
      if (this.classData && this.classData.students) {
        this.students = this.classData.students;
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתוני כיתה:', error);
    }
  }

  render() {
    if (!this.classData) {
      return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div class="max-w-4xl mx-auto text-center">
            <div class="text-gray-500 text-lg">טוען נתונים...</div>
          </div>
        </div>
      `;
    }

    // מיון התלמידים לפי נוכחות
    const sortedStudents = [...this.students].sort((a, b) => {
      const statusA = Number(a.status) || 0;
      const statusB = Number(b.status) || 0;
      
      // סדר עדיפות: נוכחים (1), מאחרים (2), חסרים (3), לא דווחו (0)
      if (statusA === 1 && statusB !== 1) return -1;
      if (statusB === 1 && statusA !== 1) return 1;
      if (statusA === 2 && statusB !== 2) return -1;
      if (statusB === 2 && statusA !== 2) return 1;
      if (statusA === 3 && statusB !== 3) return -1;
      if (statusB === 3 && statusA !== 3) return 1;
      
      // אם אותו סטטוס, מיין לפי שם
      return a.name.localeCompare(b.name, 'he');
    });

    // חישוב סטטיסטיקות
    const totalStudents = this.students.length;
    const presentCount = this.students.filter(s => s.status === 1).length;
    const lateCount = this.students.filter(s => s.status === 2).length;
    const absentCount = this.students.filter(s => s.status === 3).length;
    const unmarkedCount = this.students.filter(s => s.status === 0 || !s.status).length;
    const progress = totalStudents > 0 ? Math.round(((presentCount + lateCount + absentCount) / totalStudents) * 100) : 0;

    return `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div class="max-w-6xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="flex items-center justify-between mb-6">
              <button
                onclick="window.app.currentScreen.onBack()"
                class="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← חזור
              </button>
              <h1 class="text-3xl font-bold text-gray-900">פרטי כיתה ${this.className}</h1>
              <button
                onclick="window.app.currentScreen.refreshData()"
                class="text-blue-600 hover:text-blue-800 transition-colors"
              >
                🔄 רענן
              </button>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
              <div class="text-3xl font-bold text-gray-900">${totalStudents}</div>
              <div class="text-gray-600">סה"כ תלמידים</div>
            </div>
            <div class="bg-green-100 rounded-xl shadow-lg p-6 text-center">
              <div class="text-3xl font-bold text-green-700">${presentCount}</div>
              <div class="text-green-600">נוכחים</div>
            </div>
            <div class="bg-orange-100 rounded-xl shadow-lg p-6 text-center">
              <div class="text-3xl font-bold text-orange-700">${lateCount}</div>
              <div class="text-orange-600">מאחרים</div>
            </div>
            <div class="bg-red-100 rounded-xl shadow-lg p-6 text-center">
              <div class="text-3xl font-bold text-red-700">${absentCount}</div>
              <div class="text-red-600">חסרים</div>
            </div>
            <div class="bg-gray-100 rounded-xl shadow-lg p-6 text-center">
              <div class="text-3xl font-bold text-gray-700">${unmarkedCount}</div>
              <div class="text-gray-600">לא דווחו</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900">התקדמות רישום נוכחות</h2>
              <span class="text-2xl font-bold text-blue-600">${progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div class="bg-blue-600 h-4 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
          </div>

          <!-- Students List -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-gray-900">רשימת תלמידים</h2>
              <div class="text-sm text-gray-600">
                <span class="inline-flex items-center">
                  <span class="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                  נוכחים
                </span>
                <span class="inline-flex items-center ml-3">
                  <span class="w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
                  מאחרים
                </span>
                <span class="inline-flex items-center ml-3">
                  <span class="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                  חסרים
                </span>
                <span class="inline-flex items-center ml-3">
                  <span class="w-3 h-3 bg-gray-500 rounded-full mr-1"></span>
                  לא דווחו
                </span>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-right py-3 px-4 font-semibold text-gray-900">שם התלמיד</th>
                    <th class="text-center py-3 px-4 font-semibold text-gray-900">סטטוס</th>
                    <th class="text-center py-3 px-4 font-semibold text-gray-900">תאריך עדכון אחרון</th>
                    <th class="text-center py-3 px-4 font-semibold text-gray-900">שעה</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortedStudents.map(student => `
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="py-3 px-4 font-medium text-gray-900">${student.name}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${this.getStatusColor(student.status)}">
                          ${this.getStatusText(student.status)}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center text-gray-600">
                        ${student.lastAttendance ? this.formatDate(student.lastAttendance) : '-'}
                      </td>
                      <td class="py-3 px-4 text-center text-gray-600">
                        ${student.timestamp ? this.formatTime(student.timestamp) : '-'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="text-center mt-8 space-x-4">
            <button
              onclick="window.app.startAttendanceForClass('${this.className}')"
              class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              התחל רישום נוכחות
            </button>
            <button
              onclick="window.app.showHistoryForClass('${this.className}')"
              class="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              📅 היסטוריה שבועית
            </button>
            <button
              onclick="window.app.exportClassData('${this.className}')"
              class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              ייצא נתונים
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getStatusColor(status) {
    switch(Number(status)) {
      case 1: return 'bg-green-100 text-green-800';  // נוכח
      case 2: return 'bg-orange-100 text-orange-800'; // איחור
      case 3: return 'bg-red-100 text-red-800';       // חיסור
      default: return 'bg-gray-100 text-gray-800';    // לא דווח
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

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  }

  formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  async refreshData() {
    await this.loadClassData();
    window.app.render();
  }
}

window.ClassDetailsScreen = ClassDetailsScreen; 
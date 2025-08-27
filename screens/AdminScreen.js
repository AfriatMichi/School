// Admin Screen Component
class AdminScreen {
  constructor(onBack) {
    this.onBack = onBack;
    this.classesData = [];
  }

  async init() {
    await this.loadClassesData();
  }

  async loadClassesData() {
    try {
      // טעינת כל הכיתות עם התלמידים שלהן מה-DB
      const allClasses = await window.databaseService.getAllClassesWithStudents();
      this.classesData = [];
      
      for (const [className, classData] of Object.entries(allClasses)) {
        if (classData && classData.students) {
          // חישוב סטטיסטיקות לכל כיתה
          const totalStudents = classData.students.length;
          const presentCount = classData.students.filter(s => s.status === 1).length;
          const lateCount = classData.students.filter(s => s.status === 2).length;
          const absentCount = classData.students.filter(s => s.status === 3).length;
          const unmarkedCount = classData.students.filter(s => s.status === 0 || !s.status).length;
          
          this.classesData.push({
            name: className,
            grade: classData.grade || this.extractGradeFromClassName(className),
            parallel: classData.parallel || this.extractParallelFromClassName(className),
            totalStudents,
            presentCount,
            lateCount,
            absentCount,
            unmarkedCount,
            students: classData.students,
            lastUpdated: classData.lastUpdated
          });
        }
      }
      
      // סידור לפי שכבה ומקבילה
      this.classesData.sort((a, b) => {
        if (a.grade !== b.grade) {
          return a.grade.localeCompare(b.grade);
        }
        return parseInt(a.parallel) - parseInt(b.parallel);
      });
    } catch (error) {
      console.error('שגיאה בטעינת נתוני כיתות:', error);
    }
  }

  // חילוץ שם השכבה משם הכיתה
  extractGradeFromClassName(className) {
    return className.replace(/\d+/g, '');
  }

  // חילוץ מספר המקבילה משם הכיתה
  extractParallelFromClassName(className) {
    const match = className.match(/\d+/);
    return match ? match[0] : '';
  }

  render() {
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
              <h1 class="text-3xl font-bold text-gray-900">דף ניהול</h1>
              <div class="flex gap-3">
                <button
                  onclick="window.location.href='student_loader.html'"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  📥 טען תלמידים
                </button>
                <button
                  onclick="window.app.currentScreen.refreshData()"
                  class="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  🔄 רענן
                </button>
              </div>
            </div>
          </div>

          <!-- Classes Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.classesData.map(classData => `
              <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <!-- Class Header -->
                <div class="bg-red-600 text-white p-4">
                  <h2 class="text-xl font-bold">כיתה ${classData.name}</h2>
                  <p class="text-sm opacity-90">שכבה ${classData.grade} - מקבילה ${classData.parallel}</p>
                  <p class="text-sm opacity-90">${classData.totalStudents} תלמידים</p>
                </div>
                
                <!-- Status -->
                <div class="p-4 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">סטטוס</span>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-600">בתהליך</span>
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Progress -->
                <div class="p-4 border-b border-gray-200">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">
                      ${this.calculateProgress(classData)}%
                    </div>
                    <div class="text-sm text-gray-600">הושלם</div>
                  </div>
                </div>

                <!-- Statistics -->
                <div class="p-4">
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-green-100 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-green-700">${classData.presentCount}</div>
                      <div class="text-xs text-green-600">הגיעו</div>
                    </div>
                    <div class="bg-orange-100 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-orange-700">${classData.lateCount}</div>
                      <div class="text-xs text-orange-600">איחורים</div>
                    </div>
                    <div class="bg-red-100 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-red-700">${classData.absentCount}</div>
                      <div class="text-xs text-red-600">חיסורים</div>
                    </div>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="p-4">
                  <div class="flex gap-2 mb-2">
                    <button
                      onclick="window.app.exportToCSV('${classData.name}')"
                      class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm"
                    >
                      📊 ייצא CSV
                    </button>
                  </div>
                  <button
                    onclick="window.app.currentScreen.viewClassDetails('${classData.name}')"
                    class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    צפה בפרטים
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          ${this.classesData.length === 0 ? `
            <div class="text-center py-12">
              <div class="text-gray-500 text-lg">אין כיתות זמינות</div>
              <button
                onclick="window.app.currentScreen.refreshData()"
                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                נסה שוב
              </button>
            </div>
          ` : `
            <div class="text-center py-8">
              <button
                onclick="window.app.exportAllData()"
                class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                📊 ייצא את כל הנתונים ל-CSV
              </button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  calculateProgress(classData) {
    const markedStudents = classData.presentCount + classData.lateCount + classData.absentCount;
    return classData.totalStudents > 0 ? Math.round((markedStudents / classData.totalStudents) * 100) : 0;
  }

  async refreshData() {
    await this.loadClassesData();
    window.app.render();
  }

  viewClassDetails(className) {
    // מעבר לדף פרטי הכיתה החדש
    window.app.showClassDetails(className);
  }
}

window.AdminScreen = AdminScreen; 
// Main Screen Component
class MainScreen {
  constructor(onClassSelect) {
    this.onClassSelect = onClassSelect;
  }

  render() {
    const classes = window.dataService.getAllClasses();
    const classCards = classes.map(classData => {
      const studentCount = window.dataService.getClassData(classData.name).length;
      return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer" onclick="window.app.selectClass('${classData.name}')">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-bold">כיתה ${classData.name}</h3>
              <span class="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                ${studentCount} תלמידים
              </span>
            </div>
          </div>
          <div class="p-6 text-center">
            <div class="text-gray-600 mb-4 text-lg">לחץ להתחלת נוכחות</div>
            <div class="flex justify-center">
              <svg class="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <div class="mx-auto mb-8 h-24 w-24 text-blue-600 opacity-80">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">מערכת נוכחות</h1>
            <p class="text-xl text-gray-600">בחר כיתה לרישום נוכחות</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            ${classCards}
          </div>
          
          <div class="text-center">
            <button
              onclick="window.app.showAdminView()"
              class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              📊 דף ניהול - נתונים מה-DB
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

window.MainScreen = MainScreen; 
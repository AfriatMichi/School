// Student Card Component
class StudentCard {
  constructor(student, currentIndex, totalStudents, onAttendanceClick) {
    this.student = student;
    this.currentIndex = currentIndex;
    this.totalStudents = totalStudents;
    this.onAttendanceClick = onAttendanceClick;
  }

  render() {
    const progressPercentage = ((this.currentIndex + 1) / this.totalStudents) * 100;
    
    return `
      <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="mb-8">
          <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">${this.student.name}</h2>
          <p class="text-gray-600">תלמיד מספר ${this.currentIndex + 1} מתוך ${this.totalStudents}</p>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <button
            onclick="${this.onAttendanceClick}('present')"
            class="bg-green-500 hover:bg-green-600 text-white py-4 px-8 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            ✓ הגיע
          </button>
          
          <button
            onclick="${this.onAttendanceClick}('absent')"
            class="bg-red-500 hover:bg-red-600 text-white py-4 px-8 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            ✗ חיסור
          </button>
          
          <button
            onclick="${this.onAttendanceClick}('late')"
            class="bg-orange-500 hover:bg-orange-600 text-white py-4 px-8 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg class="inline h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            איחור
          </button>
        </div>

        <div class="mt-8">
          <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              class="bg-blue-600 h-full transition-all duration-300"
              style="width: ${progressPercentage}%"
            ></div>
          </div>
        </div>
      </div>
    `;
  }
}

window.StudentCard = StudentCard; 
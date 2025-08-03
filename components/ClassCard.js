// Class Card Component
class ClassCard {
  constructor(classData, studentCount, onClick) {
    this.classData = classData;
    this.studentCount = studentCount;
    this.onClick = onClick;
  }

  render() {
    return `
      <button
        onclick="${this.onClick}"
        class="relative overflow-hidden bg-gradient-to-br ${this.classData.color} hover:shadow-2xl border-2 ${this.classData.border} ${this.classData.hover} rounded-2xl p-8 transition-all duration-300 shadow-lg transform hover:scale-105 hover:-translate-y-1"
      >
        <div class="relative text-center text-white">
          <div class="absolute inset-0 bg-black bg-opacity-10 rounded-xl"></div>
          <div class="relative z-10">
            <div class="text-4xl font-bold mb-3 drop-shadow-lg">כיתה ${this.classData.name}</div>
            <div class="text-white text-opacity-90 font-medium">
              ${this.studentCount} תלמידים
            </div>
          </div>
          <div class="absolute top-0 right-0 w-12 h-12 bg-white bg-opacity-20 rounded-full -mr-6 -mt-6"></div>
          <div class="absolute bottom-0 left-0 w-8 h-8 bg-white bg-opacity-15 rounded-full -ml-4 -mb-4"></div>
        </div>
      </button>
    `;
  }
}

window.ClassCard = ClassCard; 
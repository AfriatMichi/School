class DataService {
  constructor() {
    this.classesData = {};

    // עדכון המבנה לתמיכה בריבוי כיתות בכל שכבה
    this.grades = [
      { 
        name: 'ז', 
        color: 'from-red-400 to-red-600', 
        border: 'border-red-300', 
        hover: 'hover:border-red-500',
        classes: [] // ימלא דינמית לפי הנתונים מהקובץ
      },
      { 
        name: 'ח', 
        color: 'from-orange-400 to-orange-600', 
        border: 'border-orange-300', 
        hover: 'hover:border-orange-500',
        classes: []
      },
      { 
        name: 'ט', 
        color: 'from-yellow-400 to-yellow-600', 
        border: 'border-yellow-300', 
        hover: 'hover:border-yellow-500',
        classes: []
      },
      { 
        name: 'י', 
        color: 'from-green-400 to-green-600', 
        border: 'border-green-300', 
        hover: 'hover:border-green-500',
        classes: []
      },
      { 
        name: 'יא', 
        color: 'from-blue-400 to-blue-600', 
        border: 'border-blue-300', 
        hover: 'hover:border-blue-500',
        classes: []
      },
      { 
        name: 'יב', 
        color: 'from-purple-400 to-purple-600', 
        border: 'border-purple-300', 
        hover: 'hover:border-purple-500',
        classes: []
      }
    ];

    this.currentAttendance = {};
    this.currentDate = this.getCurrentDate();
    this.isInitialized = false;
  }

  // אתחול הנתונים מ-Firebase
  async init() {
    if (this.isInitialized) return;

    try {
      // טעינת נתוני התלמידים מכל הכיתות
      const allClasses = await window.databaseService.getAllClassesWithStudents();
      
      // עדכון מבנה הנתונים לפי המידע מהדאטהבייס
      this.updateGradesStructure(allClasses);
      
      this.isInitialized = true;
      console.log('✅ נתוני התלמידים נטענו בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בטעינת נתוני התלמידים:', error);
    }
  }

  // עדכון מבנה השכבות לפי הנתונים מהדאטהבייס
  updateGradesStructure(allClasses) {
    // איפוס הכיתות בכל שכבה
    this.grades.forEach(grade => {
      grade.classes = [];
    });

    // מילוי הכיתות לפי הנתונים מהדאטהבייס
    Object.keys(allClasses).forEach(className => {
      const gradeName = this.extractGradeFromClassName(className);
      const grade = this.grades.find(g => g.name === gradeName);
      
      if (grade) {
        grade.classes.push({
          name: className,
          color: grade.color,
          border: grade.border,
          hover: grade.hover,
          studentCount: allClasses[className]?.students?.length || 0
        });
        
        // שמירת נתוני התלמידים
        this.classesData[className] = allClasses[className]?.students || [];
      }
    });
  }

  // חילוץ שם השכבה משם הכיתה (למשל: מ"ז1" נחלץ "ז")
  extractGradeFromClassName(className) {
    // הסרת מספרים מהשם כדי לקבל את שם השכבה
    return className.replace(/\d+/g, '');
  }

  // קבלת התאריך הנוכחי בפורמט YYYY-MM-DD
  getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // קבלת נתוני כיתה
  getClassData(className) {
    return this.classesData[className] || [];
  }

  // קבלת רשימת כל השכבות עם הכיתות שלהן
  getAllGrades() {
    return this.grades;
  }

  // קבלת רשימת כל הכיתות (לשמירה על תאימות)
  getAllClasses() {
    const allClasses = [];
    this.grades.forEach(grade => {
      grade.classes.forEach(classInfo => {
        allClasses.push(classInfo);
      });
    });
    return allClasses;
  }

  // קבלת רשימת שמות הכיתות בלבד
  getAllClassNames() {
    return Object.keys(this.classesData);
  }

  // שמירת נוכחות כיתה
  async saveClassAttendance(className, attendanceData) {
    try {
      // המרת הנתונים לפורמט המתאים
      const formattedData = {};
      for (const [studentId, data] of Object.entries(attendanceData)) {
        formattedData[studentId] = {
          name: data.name,
          status: data.status,
          numericStatus: data.numericStatus,
          lastAttendance: data.lastAttendance,
          timestamp: data.timestamp
        };
      }

      // שמירה במבנה החדש - כל הספירה ב-document אחד
      const attendanceId = await window.databaseService.saveNewAttendanceCount(
        className, 
        this.currentDate, 
        formattedData
      );
      
      // שמירה מקומית לגיבוי
      this.currentAttendance[className] = formattedData;
      localStorage.setItem(`attendance_${className}_${this.currentDate}`, JSON.stringify(formattedData));
      
      console.log(`נוכחות כיתה ${className} נשמרה בהצלחה`);
      return attendanceId;
    } catch (error) {
      console.error('שגיאה בשמירת נוכחות:', error);
      throw error;
    }
  }

  // שמירה מרוכזת של נתוני נוכחות
  async saveAttendanceBatch(className, attendanceData) {
    try {
      // שמירה מרוכזת ל-DB
      await window.databaseService.saveClassAttendanceBatch(className, attendanceData);
      
      // שמירה מקומית לגיבוי
      this.currentAttendance[className] = attendanceData;
      localStorage.setItem(`attendance_${className}_${this.currentDate}`, JSON.stringify(attendanceData));
      
      console.log(`נוכחות כיתה ${className} נשמרה בהצלחה (מרוכז)`);
      return true;
    } catch (error) {
      console.error('שגיאה בשמירה מרוכזת של נוכחות:', error);
      throw error;
    }
  }

  // טעינת נוכחות כיתה
  async loadClassAttendance(className) {
    try {
      // ניסיון לטעון מ-Firebase - המבנה החדש
      const firebaseData = await window.databaseService.getAttendanceCountsByClassAndDate(
        className, 
        this.currentDate
      );
      
      // אם יש נתונים, נטען את הספירה האחרונה
      if (firebaseData && firebaseData.length > 0) {
        const latestCount = firebaseData[0]; // הספירה האחרונה
        if (latestCount.attendanceData) {
          this.currentAttendance[className] = latestCount.attendanceData;
          return latestCount.attendanceData;
        }
      }

      // אם אין נתונים ב-Firebase, ננסה localStorage
      const localData = localStorage.getItem(`attendance_${className}_${this.currentDate}`);
      if (localData) {
        this.currentAttendance[className] = JSON.parse(localData);
        return this.currentAttendance[className];
      }

      return {};
    } catch (error) {
      console.error('שגיאה בטעינת נוכחות:', error);
      
      // fallback ל-localStorage
      const localData = localStorage.getItem(`attendance_${className}_${this.currentDate}`);
      if (localData) {
        this.currentAttendance[className] = JSON.parse(localData);
        return this.currentAttendance[className];
      }
      
      return {};
    }
  }

  // קבלת סיכום נוכחות לכל הכיתות
  async getAllClassesSummary() {
    try {
      const summary = await window.databaseService.getAllClassesSummary();
      return summary;
    } catch (error) {
      console.error('שגיאה בקבלת סיכום כללי:', error);
      return {};
    }
  }

  // קבלת סטטיסטיקות כיתה
  getClassStats(className) {
    const attendance = this.currentAttendance[className] || {};
    const students = this.getClassData(className);
    
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    const total = students.length;
    const recorded = Object.keys(attendance).length;

    let status = 'not-started';
    if (recorded > 0 && recorded < total) {
      status = 'in-progress';
    } else if (recorded === total) {
      status = 'completed';
    }

    return {
      status,
      present,
      absent,
      late,
      total,
      recorded
    };
  }

  // עדכון נוכחות תלמיד
  async updateStudentAttendance(className, studentId, status, numericStatus, lastAttendance, timestamp) {
    if (!this.currentAttendance[className]) {
      this.currentAttendance[className] = {};
    }
    
    // המרת studentId למספר אם הוא מחרוזת
    const numericStudentId = Number(studentId);
    const student = this.getClassData(className).find(s => s.id === numericStudentId);
    if (student) {
      // עדכון נתוני נוכחות מקומיים
      this.currentAttendance[className][studentId] = {
        name: student.name,
        status: status,
        numericStatus: numericStatus,
        lastAttendance: lastAttendance,
        timestamp: timestamp
      };

      // עדכון סטטוס התלמיד ב-Firestore
      try {
        await window.databaseService.updateStudentStatus(
          className, 
          studentId, 
          status,
          numericStatus,
          lastAttendance,
          timestamp
        );
      } catch (error) {
        console.error('שגיאה בעדכון סטטוס תלמיד:', error);
      }
    }
  }

  // קבלת נוכחות תלמיד
  getStudentAttendance(className, studentId) {
    return this.currentAttendance[className]?.[studentId] || null;
  }

  // מחיקת נוכחות כיתה
  async deleteClassAttendance(className) {
    try {
      // מחיקה מ-Firebase
      const attendanceData = await window.databaseService.getAttendanceByClassAndDate(
        className, 
        this.currentDate
      );
      
      if (attendanceData) {
        await window.databaseService.deleteAttendance(attendanceData.id);
      }
      
      // מחיקה מקומית
      delete this.currentAttendance[className];
      localStorage.removeItem(`attendance_${className}_${this.currentDate}`);
      
      console.log(`נוכחות כיתה ${className} נמחקה בהצלחה`);
    } catch (error) {
      console.error('שגיאה במחיקת נוכחות:', error);
      throw error;
    }
  }

  // ייצוא נתונים ל-CSV
  exportToCSV(className) {
    const attendance = this.currentAttendance[className] || {};
    const students = this.getClassData(className);
    
    let csv = 'שם תלמיד,סטטוס\n';
    
    students.forEach(student => {
      const status = attendance[student.id]?.status || 'לא נרשם';
      csv += `${student.name},${status}\n`;
    });
    
    return csv;
  }

  // ייצוא כל הנתונים
  async exportAllData() {
    try {
      const allData = await this.getAllClassesSummary();
      let csv = 'כיתה,תאריך,שם תלמיד,סטטוס\n';
      
      for (const [classId, records] of Object.entries(allData)) {
        records.forEach(record => {
          if (record.data) {
            Object.entries(record.data).forEach(([studentId, studentData]) => {
              csv += `${classId},${record.date},${studentData.name},${studentData.status}\n`;
            });
          }
        });
      }
      
      return csv;
    } catch (error) {
      console.error('שגיאה בייצוא נתונים:', error);
      throw error;
    }
  }

  // שמירת נוכחות יומית
  async saveDailyAttendance(className, attendanceData) {
    try {
      const attendanceId = await window.databaseService.saveDailyAttendance(
        className, 
        this.currentDate, 
        attendanceData
      );
      
      // שמירה מקומית כגיבוי
      localStorage.setItem(`daily_attendance_${className}_${this.currentDate}`, JSON.stringify(attendanceData));
      
      return attendanceId;
    } catch (error) {
      console.error('שגיאה בשמירת נוכחות יומית:', error);
      throw error;
    }
  }

  // שמירת ספירה חדשה
  async saveNewAttendanceCount(className, attendanceData, countName = null) {
    try {
      const result = await window.databaseService.saveNewAttendanceCount(
        className,
        this.currentDate,
        attendanceData,
        countName
      );
      
      // שמירה מקומית כגיבוי
      const localKey = `attendance_count_${className}_${this.currentDate}_${result.countId}`;
      localStorage.setItem(localKey, JSON.stringify({
        ...attendanceData,
        countId: result.countId,
        countName: result.countName,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`ספירה חדשה נשמרה בהצלחה: ${result.countName}`);
      return result;
    } catch (error) {
      console.error('שגיאה בשמירת ספירה חדשה:', error);
      throw error;
    }
  }

  // שליפת כל הספירות של כיתה ביום מסוים
  async getAttendanceCountsByClassAndDate(className, date) {
    try {
      const counts = await window.databaseService.getAttendanceCountsByClassAndDate(className, date);
      return counts;
    } catch (error) {
      console.error('שגיאה בשליפת ספירות:', error);
      return [];
    }
  }

  // שליפת היסטוריית ספירות של כיתה
  async getClassAttendanceCountsHistory(className, limit = 50) {
    try {
      const history = await window.databaseService.getClassAttendanceCountsHistory(className, limit);
      return history;
    } catch (error) {
      console.error('שגיאה בשליפת היסטוריית ספירות:', error);
      return [];
    }
  }

  // שליפת כל הספירות ללא שאילתות מורכבות
  async getAllAttendanceCounts() {
    try {
      const counts = await window.databaseService.getAllAttendanceCounts();
      return counts;
    } catch (error) {
      console.error('שגיאה בשליפת כל הספירות:', error);
      return [];
    }
  }

  // מחיקת ספירה ספציפית
  async deleteAttendanceCount(countId) {
    try {
      const result = await window.databaseService.deleteAttendanceCount(countId);
      
      // מחיקה מקומית
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(countId)) {
          localStorage.removeItem(key);
        }
      });
      
      return result;
    } catch (error) {
      console.error('שגיאה במחיקת ספירה:', error);
      throw error;
    }
  }

  // טעינת נוכחות יומית
  async loadDailyAttendance(className, date) {
    try {
      // ניסיון לטעון מ-Firebase
      const firebaseData = await window.databaseService.getDailyAttendance(className, date);
      
      if (firebaseData && firebaseData.data) {
        return firebaseData.data;
      }

      // אם אין נתונים ב-Firebase, ננסה localStorage
      const localData = localStorage.getItem(`daily_attendance_${className}_${date}`);
      if (localData) {
        return JSON.parse(localData);
      }

      return {};
    } catch (error) {
      console.error('שגיאה בטעינת נוכחות יומית:', error);
      
      // fallback ל-localStorage
      const localData = localStorage.getItem(`daily_attendance_${className}_${date}`);
      if (localData) {
        return JSON.parse(localData);
      }
      
      return {};
    }
  }

  // קבלת היסטוריה שבועית
  async getWeeklyHistory(className, startDate, endDate) {
    try {
      const history = await window.databaseService.getWeeklyHistory(className, startDate, endDate);
      return history;
    } catch (error) {
      console.error('שגיאה בקבלת היסטוריה שבועית:', error);
      return [];
    }
  }

  // קבלת היסטוריית כיתה
  async getClassHistory(className, limit = 30) {
    try {
      const history = await window.databaseService.getClassHistory(className, limit);
      return history;
    } catch (error) {
      console.error('שגיאה בקבלת היסטוריית כיתה:', error);
      return [];
    }
  }

  // יצירת תאריכים לשבוע
  getWeekDates() {
    const today = new Date();
    const weekDates = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    return weekDates;
  }

  // פורמט תאריך לעברית
  formatDateHebrew(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('he-IL', options);
  }

  // ייצוא נתוני כיתה ל-CSV
  exportToCSV(className) {
    try {
      const students = this.getClassData(className);
      if (students.length === 0) {
        throw new Error('אין תלמידים בכיתה זו');
      }

      // כותרות
      const headers = ['מס\'', 'שם התלמיד', 'מין', 'שכבה', 'מקבילה', 'סטטוס', 'תאריך נוכחות אחרון'];
      const csvRows = [headers.join(',')];

      // נתונים
      students.forEach((student, index) => {
        const row = [
          student.id || index + 1,
          student.name || '',
          student.gender || '',
          student.grade || '',
          student.parallel || '',
          this.getStatusText(student.status),
          student.lastAttendance || ''
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error('שגיאה בייצוא CSV:', error);
      throw error;
    }
  }

  // ייצוא כל הנתונים ל-CSV
  async exportAllData() {
    try {
      const allClasses = this.getAllClassNames();
      let allData = [];

      for (const className of allClasses) {
        const students = this.getClassData(className);
        students.forEach(student => {
          allData.push({
            className,
            id: student.id,
            name: student.name,
            gender: student.gender,
            grade: student.grade,
            parallel: student.parallel,
            status: this.getStatusText(student.status),
            lastAttendance: student.lastAttendance
          });
        });
      }

      // כותרות
      const headers = ['כיתה', 'מס\'', 'שם התלמיד', 'מין', 'שכבה', 'מקבילה', 'סטטוס', 'תאריך נוכחות אחרון'];
      const csvRows = [headers.join(',')];

      // נתונים
      allData.forEach(row => {
        const csvRow = [
          row.className,
          row.id,
          row.name,
          row.gender,
          row.grade,
          row.parallel,
          row.status,
          row.lastAttendance
        ];
        csvRows.push(csvRow.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error('שגיאה בייצוא כל הנתונים:', error);
      throw error;
    }
  }

  // המרת סטטוס מספרי לטקסט
  getStatusText(status) {
    switch (status) {
      case 1: return 'נוכח';
      case 2: return 'איחור';
      case 3: return 'חיסור';
      default: return 'לא דווח';
    }
  }
}

// יצירת instance גלובלי
window.dataService = new DataService();
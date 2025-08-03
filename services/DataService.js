class DataService {
  constructor() {
    this.classesData = {};

    this.classes = [
      { name: 'ז', color: 'from-red-400 to-red-600', border: 'border-red-300', hover: 'hover:border-red-500' },
      { name: 'ח', color: 'from-orange-400 to-orange-600', border: 'border-orange-300', hover: 'hover:border-orange-500' },
      { name: 'ט', color: 'from-yellow-400 to-yellow-600', border: 'border-yellow-300', hover: 'hover:border-yellow-500' },
      { name: 'י', color: 'from-green-400 to-green-600', border: 'border-green-300', hover: 'hover:border-green-500' },
      { name: 'יא', color: 'from-blue-400 to-blue-600', border: 'border-blue-300', hover: 'hover:border-blue-500' },
      { name: 'יב', color: 'from-purple-400 to-purple-600', border: 'border-purple-300', hover: 'hover:border-purple-500' }
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
      for (const classData of this.classes) {
        const className = classData.name;
        const data = await window.databaseService.getClassData(className);
        if (data && data.students) {
          this.classesData[className] = data.students;
        }
      }
      
      this.isInitialized = true;
      console.log('✅ נתוני התלמידים נטענו בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בטעינת נתוני התלמידים:', error);
    }
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

  // קבלת רשימת כל הכיתות
  getAllClasses() {
    return this.classes;
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

      const attendanceId = await window.databaseService.saveAttendance(
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
      // ניסיון לטעון מ-Firebase
      const firebaseData = await window.databaseService.getAttendanceByClassAndDate(
        className, 
        this.currentDate
      );
      
      if (firebaseData && firebaseData.data) {
        this.currentAttendance[className] = firebaseData.data;
        return firebaseData.data;
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
}

// יצירת instance גלובלי
window.dataService = new DataService();
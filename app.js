class AttendanceApp {
  constructor() {
    this.currentScreen = null;
    this.currentClassName = null;
    this.init();
  }

  async init() {
    try {
      // המתנה לטעינת Firebase
      await this.waitForFirebase();
      console.log('✅ Firebase loaded successfully');
      
      // טעינת נתוני התלמידים
      await window.dataService.init();
      console.log('✅ Student data loaded successfully');
      
      // הצגת המסך הראשי
      this.showMainScreen();
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.showMainScreen(); // הצגה גם אם Firebase לא זמין
    }
  }

  async waitForFirebase() {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50;
      let attempts = 0;
      
      const checkFirebase = () => {
        attempts++;
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Firebase failed to load'));
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      
      checkFirebase();
    });
  }

  showMainScreen() {
    // בדיקה אם יש שינויים שלא נשמרו במסך הנוכחי
    if (this.currentScreen && this.currentScreen.hasUnsavedChanges) {
      const shouldLeave = confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?');
      if (!shouldLeave) {
        return;
      }
    }
    
    // ניקוי המסך הנוכחי
    if (this.currentScreen && this.currentScreen.cleanup) {
      this.currentScreen.cleanup();
    }
    
    this.currentScreen = new MainScreen(
      (className) => this.selectClass(className)
    );
    this.render();
  }

  async selectClass(className) {
    // בדיקה אם יש שינויים שלא נשמרו במסך הנוכחי
    if (this.currentScreen && this.currentScreen.hasUnsavedChanges) {
      const shouldLeave = confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?');
      if (!shouldLeave) {
        return;
      }
    }
    
    // ניקוי המסך הנוכחי
    if (this.currentScreen && this.currentScreen.cleanup) {
      this.currentScreen.cleanup();
    }
    
    this.currentClassName = className;
    this.currentScreen = new AttendanceScreen(
      className,
      () => this.showMainScreen(),
      (attendance) => this.onAttendanceComplete(attendance)
    );
    
    await this.currentScreen.init();
    this.render();
  }

  async showAdminView() {
    // בדיקה אם יש שינויים שלא נשמרו במסך הנוכחי
    if (this.currentScreen && this.currentScreen.hasUnsavedChanges) {
      const shouldLeave = confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?');
      if (!shouldLeave) {
        return;
      }
    }
    
    // ניקוי המסך הנוכחי
    if (this.currentScreen && this.currentScreen.cleanup) {
      this.currentScreen.cleanup();
    }
    
    this.currentScreen = new AdminScreen(() => this.showMainScreen());
    await this.currentScreen.init();
    this.render();
  }

  navigateToClassDetails(className) {
    this.selectClass(className);
  }

  async showClassDetails(className) {
    // בדיקה אם יש שינויים שלא נשמרו במסך הנוכחי
    if (this.currentScreen && this.currentScreen.hasUnsavedChanges) {
      const shouldLeave = confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?');
      if (!shouldLeave) {
        return;
      }
    }
    
    // ניקוי המסך הנוכחי
    if (this.currentScreen && this.currentScreen.cleanup) {
      this.currentScreen.cleanup();
    }
    
    this.currentScreen = new ClassDetailsScreen(
      className,
      () => this.showAdminView()
    );
    
    await this.currentScreen.init();
    this.render();
  }

  async showHistoryForClass(className) {
    // בדיקה אם יש שינויים שלא נשמרו במסך הנוכחי
    if (this.currentScreen && this.currentScreen.hasUnsavedChanges) {
      const shouldLeave = confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?');
      if (!shouldLeave) {
        return;
      }
    }
    
    // ניקוי המסך הנוכחי
    if (this.currentScreen && this.currentScreen.cleanup) {
      this.currentScreen.cleanup();
    }
    
    this.currentScreen = new HistoryScreen(
      className,
      () => this.showClassDetails(className)
    );
    
    await this.currentScreen.init();
    this.render();
  }

  startAttendanceForClass(className) {
    this.selectClass(className);
  }

  exportClassData(className) {
    this.exportToCSV(className);
  }

  onAttendanceComplete(attendance) {
    console.log('נוכחות הושלמה:', attendance);
    // המסך יציג את הסיכום אוטומטית
  }

  render() {
    const appElement = document.getElementById('app');
    if (appElement && this.currentScreen) {
      appElement.innerHTML = this.currentScreen.render();
    }
  }

  // פונקציות עזר גלובליות
  async exportToCSV(className) {
    try {
      const csv = window.dataService.exportToCSV(className);
      this.downloadCSV(csv, `attendance_${className}_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('שגיאה בייצוא CSV:', error);
      alert('שגיאה בייצוא הקובץ');
    }
  }

  async exportAllData() {
    try {
      const csv = await window.dataService.exportAllData();
      this.downloadCSV(csv, `attendance_all_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('שגיאה בייצוא כל הנתונים:', error);
      alert('שגיאה בייצוא הקובץ');
    }
  }

  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // פונקציות לבדיקת חיבור למסד נתונים
  async testDatabaseConnection() {
    try {
      const status = await window.databaseService.testConnection();
      if (status) {
        alert('✅ חיבור למסד נתונים תקין');
      } else {
        alert('❌ בעיה בחיבור למסד נתונים');
      }
    } catch (error) {
      alert('❌ שגיאה בבדיקת החיבור: ' + error.message);
    }
  }

  // פונקציה לניקוי כל הנתונים
  async clearAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל נתוני הנוכחות?')) {
      try {
        // מחיקה מ-localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('attendance_')) {
            localStorage.removeItem(key);
          }
        });
        
        alert('✅ כל הנתונים נמחקו בהצלחה');
        this.showMainScreen(); // רענון המסך
      } catch (error) {
        console.error('שגיאה במחיקת נתונים:', error);
        alert('❌ שגיאה במחיקת הנתונים');
      }
    }
  }
}

// יצירת instance גלובלי של האפליקציה
window.app = new AttendanceApp();

// פונקציות גלובליות לנגישות מה-HTML
window.selectClass = (className) => window.app.selectClass(className);
window.showAdminView = () => window.app.showAdminView();
window.showMainScreen = () => window.app.showMainScreen();
window.exportToCSV = (className) => window.app.exportToCSV(className);
window.exportAllData = () => window.app.exportAllData();
window.testDatabaseConnection = () => window.app.testDatabaseConnection();
window.clearAllData = () => window.app.clearAllData();
window.handleAttendance = (status, studentId) => {
  if (window.app && window.app.currentScreen) {
    return window.app.currentScreen.handleAttendance(status, studentId);
  }
};

window.resetStudentAttendance = (studentId) => {
  if (window.app && window.app.currentScreen) {
    return window.app.currentScreen.resetStudentAttendance(studentId);
  }
};

window.resetClassAttendance = () => {
  if (window.app && window.app.currentScreen) {
    return window.app.currentScreen.resetClassAttendance();
  }
};
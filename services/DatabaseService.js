// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9rsUGQEq4r0APWhlCBHOOp5PYUw8e2lM",
  authDomain: "test-26d51.firebaseapp.com",
  projectId: "test-26d51",
  storageBucket: "test-26d51.firebasestorage.app",
  messagingSenderId: "234244721134",
  appId: "1:234244721134:web:21a7229ee49a6d96e0e6ff"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

class DatabaseService {
  constructor() {
    this.db = db;
  }

  // שמירת נתוני נוכחות
  async saveAttendance(classId, date, attendanceData) {
    try {
      const docRef = await this.db.collection('attendance').add({
        classId: classId,
        date: date,
        data: attendanceData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('נוכחות נשמרה בהצלחה:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('שגיאה בשמירת נוכחות:', error);
      throw error;
    }
  }

  // שליפת נתוני נוכחות לפי כיתה ותאריך
  async getAttendanceByClassAndDate(classId, date) {
    try {
      const snapshot = await this.db.collection('attendance')
        .where('classId', '==', classId)
        .where('date', '==', date)
        .get();
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('שגיאה בשליפת נוכחות:', error);
      throw error;
    }
  }

  // שליפת כל נתוני הנוכחות של כיתה
  async getClassAttendance(classId) {
    try {
      const snapshot = await this.db.collection('attendance')
        .where('classId', '==', classId)
        .orderBy('date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('שגיאה בשליפת נוכחות כיתה:', error);
      throw error;
    }
  }

  // שליפת סיכום נוכחות לכל הכיתות
  async getAllClassesSummary() {
    try {
      const snapshot = await this.db.collection('attendance')
        .orderBy('date', 'desc')
        .limit(100)
        .get();
      
      const summary = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!summary[data.classId]) {
          summary[data.classId] = [];
        }
        summary[data.classId].push({
          id: doc.id,
          ...data
        });
      });
      
      return summary;
    } catch (error) {
      console.error('שגיאה בשליפת סיכום כללי:', error);
      throw error;
    }
  }

  // שמירת נתוני כיתה
  async saveClassData(classId, classData) {
    try {
      await this.db.collection('classes').doc(classId).set({
        ...classData,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('נתוני כיתה נשמרו בהצלחה');
    } catch (error) {
      console.error('שגיאה בשמירת נתוני כיתה:', error);
      throw error;
    }
  }

  // שליפת נתוני כיתה
  async getClassData(classId) {
    try {
      const doc = await this.db.collection('classes').doc(classId).get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      console.error('שגיאה בשליפת נתוני כיתה:', error);
      throw error;
    }
  }

  // מחיקת נתוני נוכחות
  async deleteAttendance(attendanceId) {
    try {
      await this.db.collection('attendance').doc(attendanceId).delete();
      console.log('נוכחות נמחקה בהצלחה');
    } catch (error) {
      console.error('שגיאה במחיקת נוכחות:', error);
      throw error;
    }
  }

  // מחיקת כל התלמידים מכיתה
  async deleteAllStudentsFromClass(classId) {
    try {
      await this.db.collection('classes').doc(classId).delete();
      console.log(`כל התלמידים נמחקו בהצלחה מכיתה ${classId}`);
      return true;
    } catch (error) {
      console.error('שגיאה במחיקת תלמידים:', error);
      throw error;
    }
  }

  // שליפת כל הכיתות
  async getAllClasses() {
    try {
      const snapshot = await this.db.collection('classes').get();
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('שגיאה בטעינת רשימת כיתות:', error);
      return [];
    }
  }

  // שליפת כל הכיתות עם נתוני התלמידים שלהן
  async getAllClassesWithStudents() {
    try {
      const snapshot = await this.db.collection('classes').get();
      const classesData = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        classesData[doc.id] = {
          students: data.students || [],
          lastUpdated: data.lastUpdated,
          grade: data.grade,
          parallel: data.parallel
        };
      });
      
      return classesData;
    } catch (error) {
      console.error('שגיאה בטעינת נתוני כל הכיתות:', error);
      return {};
    }
  }

  // שמירת נתוני כיתה חדשה עם תמיכה בשכבה ומקבילה
  async saveClassDataWithGradeAndParallel(classId, classData, grade, parallel) {
    try {
      await this.db.collection('classes').doc(classId).set({
        ...classData,
        grade: grade,
        parallel: parallel,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('נתוני כיתה נשמרו בהצלחה עם שכבה ומקבילה');
    } catch (error) {
      console.error('שגיאה בשמירת נתוני כיתה:', error);
      throw error;
    }
  }

  // עדכון סטטוס תלמיד
  async updateStudentStatus(classId, studentId, status, numericStatus, lastAttendance, timestamp) {
    try {
      // קריאת הנתונים הנוכחיים
      const classRef = this.db.collection('classes').doc(classId);
      const classDoc = await classRef.get();
      
      if (!classDoc.exists) {
        return false;
      }

      const classData = classDoc.data();

      // מציאת התלמיד והעדכון שלו
      const students = classData.students || [];
      const studentIndex = students.findIndex(s => String(s.id) === String(studentId));
      
      if (studentIndex === -1) {
        return false;
      }

      // יצירת מערך מעודכן של תלמידים
      const updatedStudents = [...students];
      updatedStudents[studentIndex] = {
        ...students[studentIndex],
        status: numericStatus,
        lastAttendance: lastAttendance,
        timestamp: timestamp
      };

      // עדכון ה-Firestore
      await classRef.set({
        ...classData,
        students: updatedStudents,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס תלמיד:', error);
      throw error;
    }
  }

  // שמירה מרוכזת של כל נתוני הכיתה
  async saveClassAttendanceBatch(classId, attendanceData) {
    try {
      // קריאת הנתונים הנוכחיים
      const classRef = this.db.collection('classes').doc(classId);
      const classDoc = await classRef.get();
      
      if (!classDoc.exists) {
        throw new Error('כיתה לא נמצאה');
      }

      const classData = classDoc.data();
      const students = classData.students || [];
      
      // יצירת מערך מעודכן של תלמידים
      const updatedStudents = students.map(student => {
        const attendance = attendanceData[student.id];
        if (attendance) {
          return {
            ...student,
            status: attendance.status,
            lastAttendance: attendance.lastAttendance,
            timestamp: attendance.timestamp
          };
        } else {
          return {
            ...student,
            status: 0,
            lastAttendance: null,
            timestamp: null
          };
        }
      });

      // עדכון ה-Firestore עם כל הנתונים בפעולה אחת
      await classRef.set({
        ...classData,
        students: updatedStudents,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`כל נתוני הכיתה ${classId} נשמרו בהצלחה`);
      return true;
    } catch (error) {
      console.error('שגיאה בשמירה מרוכזת של נתוני כיתה:', error);
      throw error;
    }
  }

  // שמירת נתוני נוכחות יומיים
  async saveDailyAttendance(classId, date, attendanceData) {
    try {
      const docRef = await this.db.collection('daily_attendance').add({
        classId: classId,
        date: date,
        data: attendanceData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        totalStudents: Object.keys(attendanceData).length,
        presentCount: Object.values(attendanceData).filter(a => a.status === 1).length,
        lateCount: Object.values(attendanceData).filter(a => a.status === 2).length,
        absentCount: Object.values(attendanceData).filter(a => a.status === 3).length
      });
      console.log('נוכחות יומית נשמרה בהצלחה:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('שגיאה בשמירת נוכחות יומית:', error);
      throw error;
    }
  }

  // שמירת ספירה חדשה עם מזהה ייחודי - כל הספירה ב-document אחד
  async saveNewAttendanceCount(classId, date, attendanceData, countName = null) {
    try {
      const now = new Date();
      const countId = `${classId}_${date}_${now.getTime()}`;
      
      // יצירת document אחד עם כל נתוני הנוכחות
      const attendanceDocument = {
        countId: countId,
        classId: classId,
        date: date,
        countName: countName || `ספירה ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        totalStudents: Object.keys(attendanceData).length,
        presentCount: Object.values(attendanceData).filter(a => a.status === 1).length,
        lateCount: Object.values(attendanceData).filter(a => a.status === 2).length,
        absentCount: Object.values(attendanceData).filter(a => a.status === 3).length,
        createdAt: now.toISOString(),
        // שמירת כל נתוני הנוכחות ב-document אחד
        attendanceData: attendanceData
      };
      
      const docRef = await this.db.collection('attendance_counts').add(attendanceDocument);
      
      console.log('ספירה חדשה נשמרה בהצלחה:', docRef.id);
      return {
        id: docRef.id,
        countId: countId,
        countName: countName || `ספירה ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
      };
    } catch (error) {
      console.error('שגיאה בשמירת ספירה חדשה:', error);
      throw error;
    }
  }

  // שליפת כל הספירות של כיתה ביום מסוים
  async getAttendanceCountsByClassAndDate(classId, date) {
    try {
      const snapshot = await this.db.collection('attendance_counts')
        .where('classId', '==', classId)
        .where('date', '==', date)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('שגיאה בשליפת ספירות:', error);
      // ניסיון ללא סידור אם יש בעיית אינדקס
      try {
        const snapshot = await this.db.collection('attendance_counts')
          .where('classId', '==', classId)
          .where('date', '==', date)
          .get();
        
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // סידור ידני לפי תאריך
        return results.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error('שגיאה גם בניסיון השני:', fallbackError);
        // ניסיון שלישי - טעינת כל המסמכים וסינון ידני
        try {
          const allSnapshot = await this.db.collection('attendance_counts').get();
          const allDocs = allSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // סינון ידני לפי classId ו-date
          const filteredDocs = allDocs.filter(doc => {
            return doc.classId === classId && doc.date === date;
          });
          
          // סידור ידני לפי תאריך
          return filteredDocs.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            return dateB - dateA;
          });
        } catch (finalError) {
          console.error('שגיאה גם בניסיון השלישי:', finalError);
          return [];
        }
      }
    }
  }

  // שליפת נתוני נוכחות ספציפיים מתוך ספירה
  async getAttendanceDataFromCount(countId) {
    try {
      const doc = await this.db.collection('attendance_counts').doc(countId).get();
      if (doc.exists) {
        const data = doc.data();
        return data.attendanceData || {};
      }
      return {};
    } catch (error) {
      console.error('שגיאה בשליפת נתוני נוכחות מהספירה:', error);
      return {};
    }
  }

  // שליפת ספירה ספציפית לפי ID
  async getAttendanceCountById(countId) {
    try {
      const snapshot = await this.db.collection('attendance_counts')
        .where('countId', '==', countId)
        .get();
      
      if (!snapshot.empty) {
        return {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
      }
      return null;
    } catch (error) {
      console.error('שגיאה בשליפת ספירה:', error);
      throw error;
    }
  }

  // מחיקת ספירה ספציפית
  async deleteAttendanceCount(countId) {
    try {
      const snapshot = await this.db.collection('attendance_counts')
        .where('countId', '==', countId)
        .get();
      
      if (!snapshot.empty) {
        await this.db.collection('attendance_counts').doc(snapshot.docs[0].id).delete();
        console.log('ספירה נמחקה בהצלחה');
        return true;
      }
      return false;
    } catch (error) {
      console.error('שגיאה במחיקת ספירה:', error);
      throw error;
    }
  }

  // שליפת היסטוריית ספירות של כיתה
  async getClassAttendanceCountsHistory(classId, limit = 50) {
    try {
      const snapshot = await this.db.collection('attendance_counts')
        .where('classId', '==', classId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('שגיאה בשליפת היסטוריית ספירות:', error);
      // ניסיון ללא סידור אם יש בעיית אינדקס
      try {
        const snapshot = await this.db.collection('attendance_counts')
          .where('classId', '==', classId)
          .limit(limit)
          .get();
        
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // סידור ידני לפי תאריך
        return results.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error('שגיאה גם בניסיון השני:', fallbackError);
        return [];
      }
    }
  }

  // שליפת נוכחות יומית
  async getDailyAttendance(classId, date) {
    try {
      const snapshot = await this.db.collection('daily_attendance')
        .where('classId', '==', classId)
        .where('date', '==', date)
        .get();
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('שגיאה בשליפת נוכחות יומית:', error);
      throw error;
    }
  }

  // שליפת היסטוריה שבועית
  async getWeeklyHistory(classId, startDate, endDate) {
    try {
      const snapshot = await this.db.collection('daily_attendance')
        .where('classId', '==', classId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('שגיאה בשליפת היסטוריה שבועית:', error);
      throw error;
    }
  }

  // שליפת כל ההיסטוריה של כיתה
  async getClassHistory(classId, limit = 30) {
    try {
      const snapshot = await this.db.collection('daily_attendance')
        .where('classId', '==', classId)
        .orderBy('date', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('שגיאה בשליפת היסטוריית כיתה:', error);
      throw error;
    }
  }

  // מחיקת נוכחות יומית
  async deleteDailyAttendance(attendanceId) {
    try {
      await this.db.collection('daily_attendance').doc(attendanceId).delete();
      console.log('נוכחות יומית נמחקה בהצלחה');
    } catch (error) {
      console.error('שגיאה במחיקת נוכחות יומית:', error);
      throw error;
    }
  }

  // שליפת כל המסמכים ללא שאילתות מורכבות
  async getAllAttendanceCounts() {
    try {
      const snapshot = await this.db.collection('attendance_counts').get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('שגיאה בשליפת כל הספירות:', error);
      return [];
    }
  }

  // בדיקת חיבור למסד נתונים
  async testConnection() {
    try {
      // ניסיון לקרוא מסמך מהדאטהבייס
      const testDoc = await this.db.collection('test_connection').doc('test').get();
      return true;
    } catch (error) {
      console.error('שגיאה בבדיקת חיבור למסד נתונים:', error);
      return false;
    }
  }
}

// יצירת instance גלובלי
window.databaseService = new DatabaseService(); 
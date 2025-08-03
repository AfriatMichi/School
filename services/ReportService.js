// Report Service - Handles report generation and downloads
class ReportService {
    constructor(dataService) {
        this.dataService = dataService;
    }

    generateAttendanceReport() {
        const today = new Date();
        const dateString = today.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '/');
        
        let reportContent = `דוח נוכחות - ${dateString}\n`;
        reportContent += `==============================================\n\n`;
        
        // סיכום כללי
        const totalStats = this.getTotalStats();
        reportContent += this.generateGeneralSummary(totalStats);
        
        // פירוט לפי כיתות
        reportContent += this.generateClassDetails();
        
        return reportContent;
    }

    getTotalStats() {
        const classes = this.dataService.getClasses();
        return classes.reduce((acc, classData) => {
            const stats = this.dataService.getClassAttendanceStats(classData.name);
            acc.completed += stats.status === 'completed' ? 1 : 0;
            acc.inProgress += stats.status === 'in-progress' ? 1 : 0;
            acc.notStarted += stats.status === 'not-started' ? 1 : 0;
            acc.totalStudents += stats.total;
            acc.totalPresent += stats.present;
            acc.totalAbsent += stats.absent;
            acc.totalLate += stats.late;
            acc.totalRecorded += stats.recorded;
            return acc;
        }, { completed: 0, inProgress: 0, notStarted: 0, totalStudents: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, totalRecorded: 0 });
    }

    generateGeneralSummary(totalStats) {
        let summary = `סיכום כללי:\n`;
        summary += `סה"כ תלמידים: ${totalStats.totalStudents}\n`;
        summary += `נרשמו: ${totalStats.totalRecorded}\n`;
        summary += `הגיעו: ${totalStats.totalPresent}\n`;
        summary += `חיסורים: ${totalStats.totalAbsent}\n`;
        summary += `איחורים: ${totalStats.totalLate}\n`;
        summary += `כיתות שהושלמו: ${totalStats.completed}\n`;
        summary += `כיתות בתהליך: ${totalStats.inProgress}\n`;
        summary += `כיתות שלא החלו: ${totalStats.notStarted}\n\n`;
        return summary;
    }

    generateClassDetails() {
        const classes = this.dataService.getClasses();
        let details = `פירוט לפי כיתות:\n`;
        details += `=================\n\n`;
        
        classes.forEach(classData => {
            const stats = this.dataService.getClassAttendanceStats(classData.name);
            const classAttendance = this.dataService.getAttendance(classData.name);
            
            details += `כיתה ${classData.name}:\n`;
            details += `סטטוס: ${this.getStatusText(stats.status)}\n`;
            details += `סה"כ תלמידים: ${stats.total}\n`;
            details += `נרשמו: ${stats.recorded}\n`;
            details += `הגיעו: ${stats.present} | חיסורים: ${stats.absent} | איחורים: ${stats.late}\n`;
            
            if (stats.recorded > 0) {
                details += `רשימת תלמידים:\n`;
                Object.values(classAttendance).forEach(student => {
                    const statusText = this.getStudentStatusText(student.status);
                    details += `  - ${student.name}: ${statusText}\n`;
                });
            }
            details += `\n`;
        });
        
        return details;
    }

    getStatusText(status) {
        switch(status) {
            case 'completed': return 'הושלם';
            case 'in-progress': return 'בתהליך';
            default: return 'לא החל';
        }
    }

    getStudentStatusText(status) {
        switch(status) {
            case 'present': return 'הגיע';
            case 'absent': return 'חיסור';
            case 'late': return 'איחור';
            default: return '';
        }
    }

    downloadReport() {
        const reportContent = this.generateAttendanceReport();
        const today = new Date();
        const dateString = today.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '/');
        
        // יצירת הקובץ להורדה
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `דוח-נוכחות-${dateString.replace(/\//g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Generate CSV report
    generateCSVReport() {
        const classes = this.dataService.getClasses();
        let csvContent = 'כיתה,תלמיד,סטטוס\n';
        
        classes.forEach(classData => {
            const classAttendance = this.dataService.getAttendance(classData.name);
            Object.values(classAttendance).forEach(student => {
                csvContent += `${classData.name},${student.name},${this.getStudentStatusText(student.status)}\n`;
            });
        });
        
        return csvContent;
    }

    downloadCSVReport() {
        const csvContent = this.generateCSVReport();
        const today = new Date();
        const dateString = today.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '/');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `דוח-נוכחות-${dateString.replace(/\//g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportService;
} 
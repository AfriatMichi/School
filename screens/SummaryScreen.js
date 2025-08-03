// Summary Screen Component
class SummaryScreen {
    constructor(dataService, selectedClass, attendance) {
        this.dataService = dataService;
        this.selectedClass = selectedClass;
        this.attendance = attendance;
    }

    render() {
        const attendanceList = Object.values(this.attendance);
        const presentCount = attendanceList.filter(a => a.status === 'present').length;
        const absentCount = attendanceList.filter(a => a.status === 'absent').length;
        const lateCount = attendanceList.filter(a => a.status === 'late').length;

        const header = new Header('סיכום נוכחות', `כיתה ${this.selectedClass}`);
        const backButton = new ActionButton('חזור למסך הראשי', 'app.resetAttendance()', 'primary');

        return `
            <div class="mobile-container">
                ${header.render()}
                
                <main class="main-content">
                    <div class="summary-grid">
                        ${new SummaryCard('present', presentCount, 'הגיעו').render()}
                        ${new SummaryCard('absent', absentCount, 'חיסורים').render()}
                        ${new SummaryCard('late', lateCount, 'איחורים').render()}
                    </div>

                    <div class="student-list">
                        <h2 class="student-list-title">רשימת נוכחות מפורטת</h2>
                        <div class="space-y-3">
                            ${attendanceList.map(student => {
                                const studentListItem = new StudentListItem(student);
                                return studentListItem.render();
                            }).join('')}
                        </div>
                    </div>

                    <div class="action-buttons">
                        ${backButton.render()}
                    </div>
                </main>
            </div>
        `;
    }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SummaryScreen;
} 
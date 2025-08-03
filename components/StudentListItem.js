// Student List Item Component
class StudentListItem {
    constructor(student) {
        this.student = student;
    }

    render() {
        const statusColor = this.getStatusColor(this.student.status);
        const statusText = this.getStatusText(this.student.status);
        
        return `
            <div class="student-item">
                <span class="student-item-name">${this.student.name}</span>
                <span class="status-badge ${statusColor}">
                    ${statusText}
                </span>
            </div>
        `;
    }

    getStatusColor(status) {
        switch(status) {
            case 'present': return 'status-present';
            case 'absent': return 'status-absent';
            case 'late': return 'status-late';
            default: return 'status-absent';
        }
    }

    getStatusText(status) {
        switch(status) {
            case 'present': return 'הגיע';
            case 'absent': return 'חיסור';
            case 'late': return 'איחור';
            default: return '';
        }
    }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentListItem;
} 
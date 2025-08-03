// Class Status Card Component
class ClassStatusCard {
    constructor(classData, stats, onClassClick) {
        this.classData = classData;
        this.stats = stats;
        this.onClassClick = onClassClick;
    }

    render() {
        const { name, color } = this.classData;
        const { status, present, absent, late, total, recorded } = this.stats;
        const progressPercentage = total > 0 ? (recorded / total) * 100 : 0;
        
        return `
            <div class="class-status-card">
                <div class="class-status-header ${color}">
                    <div class="class-status-name">כיתה ${name}</div>
                    <div class="class-status-progress">
                        ${recorded}/${total} תלמידים נרשמו
                    </div>
                </div>

                <div class="class-status-body">
                    <div class="status-indicator ${this.getStatusClass(status)}">
                        ${this.getStatusText(status)}
                    </div>

                    <div class="class-progress-bar">
                        <div class="class-progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>

                    ${recorded > 0 ? this.renderStats(present, absent, late) : ''}

                    <button onclick="${this.onClassClick}"
                            class="class-action-btn ${status === 'completed' ? 'completed' : 'active'}">
                        ${this.getActionButtonText(status)}
                    </button>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        switch(status) {
            case 'completed': return 'status-completed';
            case 'in-progress': return 'status-in-progress';
            default: return 'status-not-started';
        }
    }

    getStatusText(status) {
        switch(status) {
            case 'completed': return '✅ הושלם';
            case 'in-progress': return '⏳ בתהליך';
            default: return '⭕ לא החל';
        }
    }

    getActionButtonText(status) {
        switch(status) {
            case 'completed': return 'צפה בפירוט';
            case 'in-progress': return 'המשך רישום';
            default: return 'התחל רישום';
        }
    }

    renderStats(present, absent, late) {
        return `
            <div class="class-stats">
                <div class="class-stat">
                    <div class="class-stat-number class-stat-present">${present}</div>
                    <div>הגיעו</div>
                </div>
                <div class="class-stat">
                    <div class="class-stat-number class-stat-absent">${absent}</div>
                    <div>חיסורים</div>
                </div>
                <div class="class-stat">
                    <div class="class-stat-number class-stat-late">${late}</div>
                    <div>איחורים</div>
                </div>
            </div>
        `;
    }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClassStatusCard;
} 
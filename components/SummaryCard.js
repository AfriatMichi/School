// Summary Card Component
class SummaryCard {
    constructor(type, count, label) {
        this.type = type;
        this.count = count;
        this.label = label;
    }

    render() {
        return `
            <div class="summary-card">
                <div class="summary-number summary-${this.type}">${this.count}</div>
                <div class="summary-label">${this.label}</div>
            </div>
        `;
    }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SummaryCard;
} 
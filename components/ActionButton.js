// Action Button Component
class ActionButton {
    constructor(text, onClick, type = 'primary', icon = '') {
        this.text = text;
        this.onClick = onClick;
        this.type = type;
        this.icon = icon;
    }

    render() {
        return `
            <button onclick="${this.onClick}" 
                    class="action-btn btn-${this.type}">
                ${this.icon ? `${this.icon} ` : ''}${this.text}
            </button>
        `;
    }
}

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActionButton;
} 
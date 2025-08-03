class Button {
  constructor(text, onClick, variant = 'primary', size = 'medium') {
    this.text = text;
    this.onClick = onClick;
    this.variant = variant;
    this.size = size;
  }

  render() {
    const baseClasses = 'font-medium transition-colors cursor-pointer border-none outline-none';
    const sizeClasses = {
      small: 'px-4 py-2 text-sm rounded-lg',
      medium: 'px-6 py-3 text-base rounded-lg',
      large: 'px-8 py-4 text-lg rounded-xl'
    };
    
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      warning: 'bg-orange-600 hover:bg-orange-700 text-white',
      outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
    };

    const classes = `${baseClasses} ${sizeClasses[this.size]} ${variantClasses[this.variant]}`;
    
    return `
      <button onclick="${this.onClick}" class="${classes}">
        ${this.text}
      </button>
    `;
  }
}

window.Button = Button; 
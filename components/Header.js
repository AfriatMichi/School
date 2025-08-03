// Header Component
class Header {
  constructor(title, subtitle = '') {
    this.title = title;
    this.subtitle = subtitle;
  }

  render() {
    return `
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">${this.title}</h1>
        ${this.subtitle ? `<p class="text-xl text-gray-600">${this.subtitle}</p>` : ''}
      </div>
    `;
  }
}

window.Header = Header; 
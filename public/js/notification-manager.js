// Notification Manager
const NotificationManager = {
  show(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff';
    
    notification.style.cssText = `
      position: fixed; 
      top: 20px; 
      right: 20px; 
      background: ${bgColor}; 
      color: white; 
      padding: 12px 16px; 
      border-radius: 5px; 
      z-index: 9999;
      font-weight: 500;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
};

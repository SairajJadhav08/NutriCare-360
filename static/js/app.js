// Simple NutriCare-360 JavaScript - Minimal functionality to avoid errors

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Flash message handling
function closeFlashMessage(element) {
    if (element && element.parentElement) {
        element.parentElement.remove();
    }
}

// File input display
function showFileName() {
    const fileInput = document.getElementById('prescription-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    
    if (fileInput && fileInput.files.length > 0 && fileInfo && fileName) {
        fileName.textContent = fileInput.files[0].name;
        fileInfo.style.display = 'block';
    }
}

// Modal functionality for prescription viewing
function openModal(imageSrc, title) {
    const modal = document.getElementById('prescriptionModal');
    const modalImg = document.getElementById('modalImage');
    
    if (modal && modalImg) {
        modal.style.display = 'block';
        modalImg.src = imageSrc;
        modalImg.alt = title || 'Prescription';
    }
}

function closeModal() {
    const modal = document.getElementById('prescriptionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Flash message close buttons
    const closeButtons = document.querySelectorAll('.close-flash');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeFlashMessage(this);
        });
    });
    
    // File input change handler
    const fileInput = document.getElementById('prescription-file');
    if (fileInput) {
        fileInput.addEventListener('change', showFileName);
    }
    
    // Modal close functionality
    const modal = document.getElementById('prescriptionModal');
    const closeBtn = document.querySelector('.modal .close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
});

// Make functions available globally for onclick handlers
window.toggleTheme = toggleTheme;
window.closeFlashMessage = closeFlashMessage;
window.openModal = openModal;
window.closeModal = closeModal;
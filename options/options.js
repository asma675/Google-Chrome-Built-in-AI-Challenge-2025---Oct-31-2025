// Word Rewriter Extension Options Page
// Handles saving and loading user preferences

class OptionsManager {
    constructor() {
        this.defaultSettings = {
            defaultTone: 'neutral',
            autoExpand: true,
            preserveFormatting: false,
            showPreview: true,
            maxLength: 5000
        };
        
        this.init();
    }
    
    init() {
        this.loadOptions();
        this.bindEvents();
    }
    
    // Load saved options from chrome storage
    async loadOptions() {
        try {
            const result = await chrome.storage.sync.get(this.defaultSettings);
            
            // Populate form fields with saved values
            document.getElementById('defaultTone').value = result.defaultTone;
            document.getElementById('autoExpand').checked = result.autoExpand;
            document.getElementById('preserveFormatting').checked = result.preserveFormatting;
            document.getElementById('showPreview').checked = result.showPreview;
            document.getElementById('maxLength').value = result.maxLength;
            
        } catch (error) {
            console.error('Error loading options:', error);
            this.showStatus('Error loading saved options', 'error');
        }
    }
    
    // Save options to chrome storage
    async saveOptions() {
        try {
            const options = {
                defaultTone: document.getElementById('defaultTone').value,
                autoExpand: document.getElementById('autoExpand').checked,
                preserveFormatting: document.getElementById('preserveFormatting').checked,
                showPreview: document.getElementById('showPreview').checked,
                maxLength: parseInt(document.getElementById('maxLength').value)
            };
            
            // Validate max length
            if (options.maxLength < 100 || options.maxLength > 10000) {
                throw new Error('Maximum length must be between 100 and 10,000 characters');
            }
            
            await chrome.storage.sync.set(options);
            this.showStatus('Options saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving options:', error);
            this.showStatus('Error saving options: ' + error.message, 'error');
        }
    }
    
    // Show status message to user
    showStatus(message, type = 'success') {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        // Hide status after 3 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
    
    // Bind event listeners
    bindEvents() {
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveOptions();
        });
        
        // Save on Enter key in number input
        document.getElementById('maxLength').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveOptions();
            }
        });
        
        // Auto-save on checkbox changes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.saveOptions();
            });
        });
        
        // Auto-save on select change
        document.getElementById('defaultTone').addEventListener('change', () => {
            this.saveOptions();
        });
    }
    
    // Get current options (utility method for other scripts)
    static async getOptions() {
        const defaultSettings = {
            defaultTone: 'neutral',
            autoExpand: true,
            preserveFormatting: false,
            showPreview: true,
            maxLength: 5000
        };
        
        try {
            return await chrome.storage.sync.get(defaultSettings);
        } catch (error) {
            console.error('Error getting options:', error);
            return defaultSettings;
        }
    }
}

// Initialize options manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptionsManager;
}
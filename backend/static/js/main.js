// Main JS file
console.log('Police Portal Loaded');

/**
 * Show a modern snackbar alert.
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'info', 'warning'
 */
function showSnackbar(message, type = 'info') {
    const container = document.getElementById('global-snackbar-container');
    if (!container) return;

    const snackbar = document.createElement('div');

    // Base styles
    snackbar.className = 'w-full max-w-sm pointer-events-auto overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 relative flex items-center p-4 transform transition-all duration-300 translate-y-[-100%] opacity-0 bg-white';

    // Type specific colors
    let iconHTML = '';
    if (type === 'success') {
        iconHTML = `<svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === 'error') {
        iconHTML = `<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === 'warning') {
        iconHTML = `<svg class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    } else {
        iconHTML = `<svg class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    }

    snackbar.innerHTML = `
        <div class="flex-shrink-0">
            ${iconHTML}
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">${message}</p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
            <button type="button" class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span class="sr-only">Close</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 8.586l3.707-3.707a1 1 0 011.414 1.414L11.414 10l3.707 3.707a1 1 0 01-1.414 1.414L10 11.414l-3.707 3.707a1 1 0 01-1.414-1.414L8.586 10 4.879 6.293a1 1 0 011.414-1.414L10 8.586z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    `;

    container.appendChild(snackbar);

    // Setup close button
    const closeBtn = snackbar.querySelector('button');
    closeBtn.onclick = () => removeSnackbar(snackbar);

    // Animate in
    setTimeout(() => {
        snackbar.classList.remove('translate-y-[-100%]', 'opacity-0');
    }, 10);

    // Animate out after 5 seconds
    setTimeout(() => {
        removeSnackbar(snackbar);
    }, 5000);
}

function removeSnackbar(snackbar) {
    if (!document.body.contains(snackbar)) return;
    snackbar.classList.add('translate-y-[-100%]', 'opacity-0');
    setTimeout(() => {
        if (document.body.contains(snackbar)) {
            snackbar.remove();
        }
    }, 300);
}

// Override native alert to use snackbar (optional but covers all unhandled alerts)
window.alert = function (message) {
    showSnackbar(message, 'info');
};

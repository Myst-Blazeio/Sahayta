let currentFirId = null;
let currentSections = []; // Tracks chip-based BNS sections

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('Police Dashboard Initialized');
    lucide.createIcons();

    // Initialize Charts if on dashboard
    const chartCanvas = document.getElementById('crimeChart');
    if (chartCanvas) {
        initChart(chartCanvas);
    }

    // Bind search inputs if present
    const searchInput = document.getElementById('searchFirs');
    const statusSelect = document.getElementById('filterStatus');

    if (searchInput) {
        searchInput.addEventListener('keyup', filterTable);
    }
    if (statusSelect) {
        statusSelect.addEventListener('change', filterTable);
    }

    // Global listener for time inputs to auto-close native picker
    // Only blurs when a complete value (hours and minutes) is present
    const handleTimePicker = function (e) {
        if (e.target && e.target.type === 'time' && e.target.value) {
            e.target.blur();
        }
    };
    document.addEventListener('input', handleTimePicker);
    document.addEventListener('change', handleTimePicker);
});

function initChart(canvas) {
    const ctx = canvas.getContext('2d');

    // Use injected data or defaults
    const labels = window.chartLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const dataReported = window.chartDataReported || [0, 0, 0, 0, 0, 0];
    const dataResolved = window.chartDataResolved || [0, 0, 0, 0, 0, 0];
    const dataRejected = window.chartDataRejected || [0, 0, 0, 0, 0, 0];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Reported',
                    data: dataReported,
                    borderColor: '#2563EB', // Blue
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Resolved',
                    data: dataResolved,
                    borderColor: '#10B981', // Green
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Rejected',
                    data: dataRejected,
                    borderColor: '#EF4444', // Red
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Crime Trends (Last 6 Months)' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// --- Modals ---

// Review Modal
window.openReviewModal = async function (firId) {
    currentFirId = firId;
    const modal = document.getElementById('reviewModal');

    // Reset Data
    document.getElementById('modalTitle').textContent = `FIR Review #${firId}`;
    document.getElementById('modalComplainant').textContent = 'Loading...';
    document.getElementById('modalComplainantPhone').textContent = '-';
    document.getElementById('modalComplainantAadhar').textContent = '-';
    document.getElementById('modalComplainantEmail').textContent = '-';
    document.getElementById('modalIncidentDate').textContent = '-';
    document.getElementById('modalIncidentTime').textContent = '-';
    document.getElementById('modalLocation').textContent = '-';

    document.getElementById('modalOriginalText').textContent = '';
    document.getElementById('modalTranslatedText').textContent = '';

    // Reset AI Box
    const aiContainer = document.getElementById('aiSuggestionsContainer');
    if (aiContainer) aiContainer.innerHTML = '<div class="text-center text-gray-400 py-4 text-sm" id="aiPlaceholder">Click \'AI Suggest\' to analyze the complaint.</div>';

    // Reset chips
    currentSections = [];
    renderSectionChips();
    document.getElementById('modalNotes').value = '';

    modal.classList.remove('hidden');

    try {
        // Fetch without custom Auth header - rely on cookie
        const response = await fetch(`/api/fir/${firId}`);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showSnackbar('Session expired or unauthorized. Please login again.', 'warning');
                window.location.href = '/police/login';
                return;
            }
            throw new Error('Failed to fetch FIR');
        }

        const fir = await response.json();

        // Populate Fields
        document.getElementById('modalComplainant').textContent = fir.complainant_name || 'Unknown';
        document.getElementById('modalComplainantPhone').textContent = fir.complainant_phone || 'N/A';
        document.getElementById('modalComplainantAadhar').textContent = fir.complainant_aadhar || 'N/A';
        document.getElementById('modalComplainantEmail').textContent = fir.complainant_email || 'N/A';
        // Format Date/Time
        let dateStr = fir.incident_date || 'N/A';
        let timeStr = fir.incident_time || 'N/A';

        // Handling if checking submission date vs incident date
        if (!fir.incident_date && fir.submission_date) {
            const d = new Date(fir.submission_date);
            dateStr = d.toLocaleDateString();
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        document.getElementById('modalIncidentDate').textContent = dateStr;
        document.getElementById('modalIncidentTime').textContent = timeStr;
        document.getElementById('modalLocation').textContent = fir.location || 'N/A';

        document.getElementById('modalOriginalText').textContent = fir.original_text;
        document.getElementById('modalTranslatedText').textContent = fir.translated_text || fir.original_text;
        document.getElementById('modalStatus').value = fir.status;
        document.getElementById('modalNotes').value = fir.police_notes || '';
        // Load existing sections as chips (inbox/dashboard)
        currentSections = (fir.applicable_sections || []).filter(s => s);
        renderSectionChips();
        // If on archives page, render read-only BNS mini-cards instead
        if (typeof renderArchiveBNSSections === 'function') {
            renderArchiveBNSSections(currentSections);
        }

        // Handle Officer details (Archives)
        const officerDetailsEl = document.getElementById('modalOfficerDetails');
        if (officerDetailsEl) {
            if (fir.username && fir.station_name) {
                officerDetailsEl.textContent = `${fir.username} (Station: ${fir.station_name})`;
            } else if (fir.officer_name) {
                officerDetailsEl.textContent = `${fir.officer_name} (Station: ${fir.officer_station || 'Unknown'})`;
            } else {
                officerDetailsEl.textContent = 'Data unavailable';
            }
        }

    } catch (error) {
        console.error(error);
        showSnackbar('Error loading FIR details', 'error');
    }
};

window.closeReviewModal = function () {
    document.getElementById('reviewModal').classList.add('hidden');
    currentFirId = null;
};

// --- Section Chips ---

window.renderSectionChips = function () {
    const container = document.getElementById('sectionChipsContainer');
    if (!container) return;
    const placeholder = document.getElementById('sectionChipsPlaceholder');
    container.innerHTML = '';

    if (currentSections.length === 0) {
        container.innerHTML = '<span id="sectionChipsPlaceholder" class="text-xs text-gray-400 italic">No sections added. Use AI Suggest below.</span>';
        return;
    }

    currentSections.forEach((sec, idx) => {
        const chip = document.createElement('span');
        chip.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800';
        chip.innerHTML = `${sec.replace(/_/g, ' ')}<button type="button" onclick="removeSectionChip(${idx})" class="ml-1 text-blue-500 hover:text-red-600 font-bold leading-none" title="Remove">&times;</button>`;
        container.appendChild(chip);
    });
};

window.removeSectionChip = function (idx) {
    currentSections.splice(idx, 1);
    renderSectionChips();
};

// BNS Modal — Tabbed (Original / Simplified)
window.openBNSModal = function (sectionData) {
    const modal = document.getElementById('bnsDetailsModal');
    if (!modal) return;

    // Normalize section name: replace underscores with spaces (BNS_273 → BNS 273)
    const rawSection = sectionData.section || sectionData.Section || 'Unknown Section';
    const sectionTitle = rawSection.replace(/_/g, ' ');
    document.getElementById('bnsModalTitle').textContent = sectionTitle;

    // Parse description into Original and Simplified parts.
    // Handle both 'description' (lowercase) and 'Description' (capitalized from DataFrame)
    // Format: "BNS_273 - <original text> - - - BNS 273 in Simple Words <simplified text>"
    const rawDesc = sectionData.description || sectionData.Description || '';
    const separator = '- - -';
    const sepIdx = rawDesc.indexOf(separator);

    let originalText = rawDesc;
    let simplifiedText = '';

    if (sepIdx !== -1) {
        originalText = rawDesc.substring(0, sepIdx).trim();
        simplifiedText = rawDesc.substring(sepIdx + separator.length).trim();
        // Remove "BNS XXX in Simple Words" prefix from simplified
        simplifiedText = simplifiedText.replace(/^BNS[\s_]\d+\s+in\s+Simple\s+Words\s*/i, '').trim();
    }

    // Remove leading "BNS_XXX -" or "BNS XXX -" prefix from original text
    originalText = originalText.replace(/^BNS[\s_]\d+\s*-\s*/i, '').trim();

    // Populate both tab panels
    const origEl = document.getElementById('bnsOriginalText');
    const simpEl = document.getElementById('bnsSimplifiedText');
    if (origEl) origEl.textContent = originalText || 'No description available.';
    if (simpEl) simpEl.textContent = simplifiedText || 'No simplified version available.';

    // Reset to Original tab
    switchBNSTab('original');
    modal.classList.remove('hidden');
};

window.closeBNSModal = function () {
    document.getElementById('bnsDetailsModal').classList.add('hidden');
};

window.switchBNSTab = function (tab) {
    const origBtn = document.getElementById('bnsTabOriginal');
    const simpBtn = document.getElementById('bnsTabSimplified');
    const origPanel = document.getElementById('bnsOriginalPanel');
    const simpPanel = document.getElementById('bnsSimplifiedPanel');
    if (!origBtn || !simpBtn || !origPanel || !simpPanel) return;

    if (tab === 'original') {
        origBtn.classList.add('bg-white', 'text-blue-700', 'shadow');
        origBtn.classList.remove('text-gray-500');
        simpBtn.classList.remove('bg-white', 'text-blue-700', 'shadow');
        simpBtn.classList.add('text-gray-500');
        origPanel.classList.remove('hidden');
        simpPanel.classList.add('hidden');
    } else {
        simpBtn.classList.add('bg-white', 'text-blue-700', 'shadow');
        simpBtn.classList.remove('text-gray-500');
        origBtn.classList.remove('bg-white', 'text-blue-700', 'shadow');
        origBtn.classList.add('text-gray-500');
        simpPanel.classList.remove('hidden');
        origPanel.classList.add('hidden');
    }
};

// Profile Modal
window.toggleProfileModal = async function () {
    const modal = document.getElementById('profileModal');
    if (!modal) return;

    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
        // Fetch Stats
        try {
            const response = await fetch('/police/stats');
            if (response.ok) {
                const stats = await response.json();
                document.getElementById('profileEmail').textContent = stats.email || 'N/A';
                document.getElementById('profilePhone').textContent = stats.phone || 'N/A';
            }
        } catch (error) {
            console.error('Error fetching profile stats:', error);
        }
    }

    modal.classList.toggle('hidden');
};

// New Report Modal
window.toggleNewReportModal = function () {
    const modal = document.getElementById('newReportModal');
    if (modal) modal.classList.toggle('hidden');
};

window.submitManualFIR = async function (event) {
    event.preventDefault();
    const form = document.getElementById('manualFIRForm');

    const data = {
        complainant_name: form.complainant_name.value,
        complainant_phone: form.complainant_phone.value,
        complainant_aadhar: form.complainant_aadhar.value,
        complainant_email: form.complainant_email.value,
        original_text: form.details.value,
        incident_date: form.incident_date.value,
        incident_time: form.incident_time.value,
        location: form.location.value,
        complainant_username: form.complainant_username.value,
        complainant_password: form.complainant_password.value,
        language: 'en' // Defaulting to English for manual entry
    };

    console.log('Submitting Manual FIR Data:', data);

    try {
        const response = await fetch('/api/fir/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showSnackbar('FIR Submitted Successfully', 'success');
            toggleNewReportModal();
            setTimeout(() => location.reload(), 2000);
        } else {
            const err = await response.json();
            console.error('Submission Failed:', err);
            showSnackbar('Submission Failed: ' + (err.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error submitting FIR:', error);
        showSnackbar('Error submitting FIR: ' + error.message, 'error');
    }
};

// --- Actions ---

window.suggestSections = async function () {
    const text = document.getElementById('modalTranslatedText').textContent;
    if (!text) return showSnackbar('No text content available for analysis', 'warning');

    const container = document.getElementById('aiSuggestionsContainer');
    container.innerHTML = '<div class="text-center text-purple-600 py-4 text-sm"><i data-lucide="loader-2" class="animate-spin inline mr-2"></i>Analyzing...</div>';
    lucide.createIcons();

    try {
        const response = await fetch('/api/intelligence/predict_bns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text })
        });

        const data = await response.json();
        container.innerHTML = ''; // Clear loading

        if (data.results && data.results.length > 0) {
            data.results.forEach((result, index) => {
                // Use similarity if available (0-1), else fallback to distance-based (legacy)
                const confidence = result.similarity
                    ? Math.round(result.similarity * 100)
                    : Math.round((1 - result.distance) * 100);

                // Format section name: replace underscores with spaces
                const sectionName = result.section.replace(/_/g, ' ');

                const card = document.createElement('div');
                card.className = "bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow mb-2";

                const resultJson = JSON.stringify(result).replace(/"/g, '&quot;');

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-1">
                        <h5 class="font-bold text-gray-800 text-sm">${sectionName}</h5>
                        <span class="text-xs ${confidence > 50 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} px-1.5 py-0.5 rounded">${confidence}% Match</span>
                    </div>
                    <p class="text-xs text-gray-600 line-clamp-2 mb-2" title="${result.description || ''}">${result.description || 'No description'}</p>
                    <div class="flex gap-2">
                         <button type="button" class="flex-1 bg-blue-50 text-blue-700 text-xs py-1 rounded hover:bg-blue-100 font-medium" 
                            onclick="addSectionToInput('${result.section}')">
                             + Add
                         </button>
                         <button type="button" class="flex-1 bg-gray-50 text-gray-700 text-xs py-1 rounded hover:bg-gray-100 font-medium" 
                            onclick='openBNSModal(${resultJson})'>
                             View Details
                         </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<div class="text-center text-gray-400 py-4 text-sm">No relevant sections found.</div>';
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="text-center text-red-500 py-4 text-sm">AI Analysis failed.</div>';
    }
};

window.addSectionToInput = function (section) {
    // Normalize: strip trailing description text, keep just the section id
    const specificSection = section.split('-')[0].trim();
    if (!currentSections.includes(specificSection)) {
        currentSections.push(specificSection);
        renderSectionChips();
    }
};

window.updateFIR = async function () {
    if (!currentFirId) return;
    const status = document.getElementById('modalStatus').value;
    const notes = document.getElementById('modalNotes').value;
    const sections = [...currentSections];

    try {
        const response = await fetch(`/api/fir/${currentFirId}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: status,
                police_notes: notes,
                applicable_sections: sections
            })
        });

        if (response.ok) {
            showSnackbar('FIR Updated Successfully', 'success');
            closeReviewModal();
            setTimeout(() => location.reload(), 2000);
        } else {
            showSnackbar('Update failed', 'error');
        }
    } catch (error) {
        console.error(error);
        showSnackbar('Error updating FIR', 'error');
    }
};

// --- Utilities ---

window.filterTable = function () {
    const searchInput = document.getElementById('searchFirs');
    const statusSelect = document.getElementById('filterStatus');
    const stationSelect = document.getElementById('filterStation'); // New filter

    // We might be on a page without search filters (e.g. Profile)
    if (!searchInput && !statusSelect && !stationSelect) return;

    const filterText = searchInput ? searchInput.value.toLowerCase() : '';
    const filterStatus = statusSelect ? statusSelect.value.toLowerCase() : '';
    const filterStation = stationSelect ? stationSelect.value.toLowerCase() : '';

    const table = document.querySelector('table tbody');
    if (!table) return;
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        // Skip empty state row if present (has colspan)
        if (rows[i].cells.length < 2) continue;

        const firId = rows[i].cells[0].textContent.toLowerCase();
        const complainant = rows[i].cells[1].textContent.toLowerCase();

        // Determine columns. Archives has an extra Station column.
        // Dashboard/Archives: ID(0), Complainant(1), Date(2)
        // Archives Structure: Date(2), Station(3), Status(4)
        // Inbox Structure: ID(0), Complainant(1), Date(2), Status(3) (or 4 depending on setup)

        let statusText = '';
        let stationText = '';

        // Search for status pill
        let statusSpan = rows[i].querySelector('span.rounded-full');
        if (statusSpan) {
            statusText = statusSpan.textContent.trim().toLowerCase();
        }

        // Search for station text (Archives specific)
        let stationSpan = rows[i].querySelector('span.station-cell');
        if (stationSpan) {
            stationText = stationSpan.textContent.trim().toLowerCase();
        }

        const matchesText = firId.includes(filterText) || complainant.includes(filterText);
        const matchesStatus = filterStatus === '' || statusText === filterStatus;
        const matchesStation = filterStation === '' || stationText === filterStation;

        if (matchesText && matchesStatus && matchesStation) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
};

// Ensure search input triggers filtering if defined directly in HTML without oninput
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchFirs');
    if (searchInput && !searchInput.oninput) {
        searchInput.addEventListener('input', filterTable);
    }
});

// --- State Management ---
let state = {
    allReleases: [],
    filteredReleases: [],
    searchQuery: '',
    selectedType: 'all',
    sortOrder: 'newest',
    savedItems: []
};

// --- DOM Elements ---
const elements = {
    body: document.body,
    themeSwitchCheckbox: document.getElementById('theme-switch-checkbox'),
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    filterBadgesList: document.getElementById('filter-badges-list'),
    sortSelect: document.getElementById('sort-select'),
    loadingSpinner: document.getElementById('loading-spinner'),
    releaseNotesContainer: document.getElementById('release-notes-container'),
    emptyState: document.getElementById('empty-state'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    entriesCount: document.getElementById('entries-count'),
    toastNotification: document.getElementById('toast-notification'),
    statusBanner: document.getElementById('status-banner')
};

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadSavedItems();
    fetchReleaseNotes();
    setupEventListeners();
});

function loadSavedItems() {
    try {
        const saved = localStorage.getItem('savedReleases');
        state.savedItems = saved ? JSON.parse(saved) : [];
    } catch (err) {
        console.error('Error loading saved items:', err);
        state.savedItems = [];
    }
}

// --- Theme Handler ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        elements.body.classList.remove('dark-theme');
        elements.body.classList.add('light-theme');
        if (elements.themeSwitchCheckbox) {
            elements.themeSwitchCheckbox.checked = true;
        }
    } else {
        elements.body.classList.add('dark-theme');
        elements.body.classList.remove('light-theme');
        if (elements.themeSwitchCheckbox) {
            elements.themeSwitchCheckbox.checked = false;
        }
    }
}

function toggleTheme() {
    if (elements.themeSwitchCheckbox && elements.themeSwitchCheckbox.checked) {
        elements.body.classList.remove('dark-theme');
        elements.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        elements.body.classList.remove('light-theme');
        elements.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Theme toggle checkbox change
    if (elements.themeSwitchCheckbox) {
        elements.themeSwitchCheckbox.addEventListener('change', toggleTheme);
    }

    // Refresh feed
    elements.refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        toggleClearSearchButton();
        applyFiltersAndRender();
    });

    // Clear search
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        toggleClearSearchButton();
        applyFiltersAndRender();
        elements.searchInput.focus();
    });

    // Filters (Event Delegation)
    elements.filterBadgesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Update active state in UI
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Update state & render
            state.selectedType = e.target.dataset.type;
            applyFiltersAndRender();
        }
    });

    // Sort order
    elements.sortSelect.addEventListener('change', (e) => {
        state.sortOrder = e.target.value;
        applyFiltersAndRender();
    });

    // Export CSV
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    // Reset filters
    elements.resetFiltersBtn.addEventListener('click', resetAllFilters);
}

function toggleClearSearchButton() {
    if (state.searchQuery) {
        elements.clearSearchBtn.style.display = 'block';
    } else {
        elements.clearSearchBtn.style.display = 'none';
    }
}

// --- Fetch Data ---
async function fetchReleaseNotes(forceRefresh = false) {
    try {
        showLoading(true);
        if (forceRefresh && elements.refreshIcon) {
            elements.refreshIcon.classList.add('spinning');
        }

        const url = forceRefresh ? '/api/releases?refresh=true' : '/api/releases';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.status === 'success') {
            state.allReleases = result.data;
            applyFiltersAndRender();
            showStatusBanner(null);
        } else {
            throw new Error(result.message || 'Failed to fetch release notes.');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showLoading(false);
        showStatusBanner(`Error loading latest releases: ${error.message}. Showing empty/cached data.`);
        elements.emptyState.style.display = 'flex';
    } finally {
        if (elements.refreshIcon) {
            elements.refreshIcon.classList.remove('spinning');
        }
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        elements.loadingSpinner.style.display = 'block';
        elements.releaseNotesContainer.style.display = 'none';
        elements.emptyState.style.display = 'none';
    } else {
        elements.loadingSpinner.style.display = 'none';
    }
}

function showStatusBanner(message) {
    if (message) {
        elements.statusBanner.querySelector('.banner-text').textContent = message;
        elements.statusBanner.style.display = 'block';
    } else {
        elements.statusBanner.style.display = 'none';
    }
}

// --- Filter, Sort & Search Logic ---
function applyFiltersAndRender() {
    let results = [];

    if (state.selectedType === 'saved') {
        const grouped = {};
        state.savedItems.forEach(item => {
            const matchesSearch = !state.searchQuery ||
                item.date.toLowerCase().includes(state.searchQuery) ||
                item.type.toLowerCase().includes(state.searchQuery) ||
                item.html.toLowerCase().includes(state.searchQuery);

            if (matchesSearch) {
                if (!grouped[item.date]) {
                    grouped[item.date] = {
                        date: item.date,
                        link: item.link,
                        updated: item.date,
                        items: []
                    };
                }
                const exists = grouped[item.date].items.some(x => x.type === item.type && x.html === item.html);
                if (!exists) {
                    grouped[item.date].items.push({
                        type: item.type,
                        html: item.html
                    });
                }
            }
        });
        results = Object.values(grouped);
    } else {
        // Filter by type & search text
        state.allReleases.forEach(entry => {
            // Filter items within the entry
            const matchingItems = entry.items.filter(item => {
                // Type Match
                const matchesType = (state.selectedType === 'all' || item.type.toLowerCase() === state.selectedType.toLowerCase());
                
                // Search Match
                const matchesSearch = !state.searchQuery || 
                    entry.date.toLowerCase().includes(state.searchQuery) ||
                    item.type.toLowerCase().includes(state.searchQuery) ||
                    item.html.toLowerCase().includes(state.searchQuery);

                return matchesType && matchesSearch;
            });

            if (matchingItems.length > 0) {
                results.push({
                    ...entry,
                    items: matchingItems
                });
            }
        });
    }

    // Sort order
    if (state.sortOrder === 'newest') {
        results.sort((a, b) => new Date(b.updated || b.date) - new Date(a.updated || a.date));
    } else {
        results.sort((a, b) => new Date(a.updated || a.date) - new Date(b.updated || b.date));
    }

    state.filteredReleases = results;
    showLoading(false);
    renderReleases();
}

// --- Helper: Highlight text ---
function highlightText(html, query) {
    if (!query) return html;
    
    // Create a temporary element to parse HTML, so we only highlight actual text nodes (not tag names or attribute values)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const walkTextNodes = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue;
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            if (regex.test(text)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
                node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'A' && node.nodeName !== 'CODE') {
            // Recurse children, but bypass rewriting content of anchors or code nodes directly to preserve their special styling
            const children = Array.from(node.childNodes);
            children.forEach(walkTextNodes);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const children = Array.from(node.childNodes);
            children.forEach(walkTextNodes);
        }
    };
    
    Array.from(tempDiv.childNodes).forEach(walkTextNodes);
    return tempDiv.innerHTML;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Render to DOM ---
function renderReleases() {
    const container = elements.releaseNotesContainer;
    container.innerHTML = '';

    // Calculate total release items
    let totalItemsCount = 0;
    state.filteredReleases.forEach(entry => totalItemsCount += entry.items.length);
    elements.entriesCount.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'Release' : 'Releases'}`;

    if (state.filteredReleases.length === 0) {
        container.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        return;
    }

    elements.emptyState.style.display = 'none';
    container.style.display = 'flex';

    state.filteredReleases.forEach(entry => {
        const card = document.createElement('article');
        card.className = 'release-card';
        
        // Setup Date ID for permalinks
        const anchorId = entry.date.replace(/[^a-zA-Z0-9]/g, '_');
        card.id = anchorId;

        // Render card header
        let headerHtml = `
            <div class="card-header">
                <div class="card-date-info">
                    <span class="date-indicator-dot"></span>
                    <h2 class="release-date">${highlightText(entry.date, state.searchQuery)}</h2>
                </div>
                <div class="card-meta">
                    <a href="${entry.link}" target="_blank" rel="noopener" class="meta-link">
                        <span>Official Notes</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                    <button class="btn-share" onclick="copyPermalink('${anchorId}')" title="Copy link to this release">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </button>
                    <button class="btn-copy-card" onclick="copyCardText('${anchorId}', this)" title="Copy card updates to clipboard">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-items-list">
        `;

        // Render list of release items inside date
        entry.items.forEach(item => {
            const badgeClass = item.type.toLowerCase();
            const highlightedType = highlightText(item.type, state.searchQuery);
            const highlightedHtml = highlightText(item.html, state.searchQuery);
            
            // Check if this item is bookmarked/saved
            const isStarred = isItemSaved(entry.date, item.type, item.html);
            const starFill = isStarred ? 'currentColor' : 'none';
            const starClass = isStarred ? 'starred' : '';

            headerHtml += `
                <div class="release-item">
                    <div class="type-badge-container">
                        <span class="type-badge ${badgeClass}">${highlightedType}</span>
                    </div>
                    <div class="item-description">
                        ${highlightedHtml}
                    </div>
                    <div class="item-actions">
                        <button class="btn-star ${starClass}" onclick="toggleSaveItem('${entry.date}', '${entry.link}', '${item.type.replace(/'/g, "\\'")}', this)" title="Bookmark update">
                            <svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="${starFill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        </button>
                        <button class="btn-tweet" onclick="tweetRelease('${entry.date}', '${item.type.replace(/'/g, "\\'")}', this)" title="Tweet this update">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });

        headerHtml += `</div>`;
        card.innerHTML = headerHtml;
        container.appendChild(card);
    });
}

// --- Utilities ---
function isItemSaved(date, type, html) {
    const key = `${date}_${type}_${html.trim()}`;
    return state.savedItems.some(item => `${item.date}_${item.type}_${item.html.trim()}` === key);
}

function showToast(message) {
    const toast = elements.toastNotification;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

window.copyPermalink = function(anchorId) {
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy link: ', err);
    });
};

window.tweetRelease = function(date, type, buttonEl) {
    try {
        const releaseItem = buttonEl.closest('.release-item');
        const descEl = releaseItem.querySelector('.item-description');
        
        // Extract text and clean up whitespaces
        let text = descEl.textContent || descEl.innerText || '';
        text = text.replace(/\s+/g, ' ').trim();
        
        // Truncate to prevent hitting Twitter character limit
        const maxTextLen = 160;
        if (text.length > maxTextLen) {
            text = text.substring(0, maxTextLen - 3) + '...';
        }
        
        const tweetText = `BigQuery Update (${date}) - ${type}:\n"${text}"\n\n#GoogleCloud #BigQuery`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent('https://docs.cloud.google.com/bigquery/docs/release-notes')}`;
        
        window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
        console.error('Error sharing to Twitter: ', err);
    }
};

window.toggleSaveItem = function(date, link, type, buttonEl) {
    try {
        const releaseItem = buttonEl.closest('.release-item');
        const descEl = releaseItem.querySelector('.item-description');
        
        const rawText = descEl.textContent || descEl.innerText || '';
        const cleanText = rawText.replace(/\s+/g, ' ').trim();
        
        let matchedItem = null;
        
        // Search in current feed
        for (const entry of state.allReleases) {
            if (entry.date === date) {
                for (const item of entry.items) {
                    if (item.type === type) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = item.html;
                        const itemText = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();
                        if (itemText === cleanText) {
                            matchedItem = item;
                            break;
                        }
                    }
                }
            }
            if (matchedItem) break;
        }

        // Fallback search in already saved items
        if (!matchedItem) {
            for (const item of state.savedItems) {
                if (item.date === date && item.type === type) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = item.html;
                    const itemText = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();
                    if (itemText === cleanText) {
                        matchedItem = item;
                        break;
                    }
                }
            }
        }

        if (!matchedItem) {
            console.error('Could not match item to save.');
            return;
        }

        const key = `${date}_${type}_${matchedItem.html.trim()}`;
        const index = state.savedItems.findIndex(item => `${item.date}_${item.type}_${item.html.trim()}` === key);

        if (index > -1) {
            // Remove bookmark
            state.savedItems.splice(index, 1);
            buttonEl.classList.remove('starred');
            buttonEl.querySelector('.star-icon').setAttribute('fill', 'none');
            showToast('Bookmark removed!');
        } else {
            // Add bookmark
            state.savedItems.push({
                date: date,
                link: link,
                type: type,
                html: matchedItem.html
            });
            buttonEl.classList.add('starred');
            buttonEl.querySelector('.star-icon').setAttribute('fill', 'currentColor');
            showToast('Bookmark saved!');
        }

        // Save state
        localStorage.setItem('savedReleases', JSON.stringify(state.savedItems));

        // Re-render immediately if we are looking at the saved filter
        if (state.selectedType === 'saved') {
            applyFiltersAndRender();
        }
    } catch (err) {
        console.error('Error toggling save item:', err);
    }
};

function resetAllFilters() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    state.selectedType = 'all';
    
    // Reset filter active styling
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.type === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    toggleClearSearchButton();
    applyFiltersAndRender();
}

window.copyCardText = function(cardId, buttonEl) {
    try {
        const card = document.getElementById(cardId);
        const dateText = card.querySelector('.release-date').textContent.trim();
        const items = card.querySelectorAll('.release-item');
        
        let textToCopy = `BigQuery Releases - ${dateText}\n`;
        textToCopy += '='.repeat(textToCopy.length - 1) + '\n\n';
        
        items.forEach((item, idx) => {
            const type = item.querySelector('.type-badge').textContent.trim();
            const desc = item.querySelector('.item-description').textContent.trim().replace(/\s+/g, ' ');
            textToCopy += `[${type}] ${desc}\n\n`;
        });
        
        textToCopy += `Source: https://docs.cloud.google.com/bigquery/docs/release-notes`;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Card updates copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy card text: ', err);
        });
    } catch (err) {
        console.error('Error copying card text: ', err);
    }
};

function exportToCSV() {
    try {
        if (!state.filteredReleases || state.filteredReleases.length === 0) {
            showToast('No release notes available to export.');
            return;
        }

        const csvRows = [];
        // Header
        csvRows.push(['Date', 'Type', 'Link', 'Description']);

        // Rows
        state.filteredReleases.forEach(entry => {
            entry.items.forEach(item => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.html;
                const plainText = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();
                
                const escapedText = plainText.replace(/"/g, '""');
                const escapedType = item.type.replace(/"/g, '""');
                const escapedDate = entry.date.replace(/"/g, '""');
                const escapedLink = entry.link.replace(/"/g, '""');

                csvRows.push([
                    `"${escapedDate}"`,
                    `"${escapedType}"`,
                    `"${escapedLink}"`,
                    `"${escapedText}"`
                ]);
            });
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        let filename = 'bigquery_release_notes';
        if (state.selectedType !== 'all') {
            filename += `_${state.selectedType.toLowerCase()}`;
        }
        if (state.searchQuery) {
            filename += `_${state.searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
        filename += '.csv';
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV exported successfully!');
    } catch (err) {
        console.error('Error exporting to CSV:', err);
        showToast('Export failed.');
    }
}

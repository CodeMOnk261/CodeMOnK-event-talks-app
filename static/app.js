// --- State Management ---
let state = {
    allReleases: [],
    filteredReleases: [],
    searchQuery: '',
    selectedType: 'all',
    sortOrder: 'newest'
};

// --- DOM Elements ---
const elements = {
    body: document.body,
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
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
    fetchReleaseNotes();
    setupEventListeners();
});

// --- Theme Handler ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        elements.body.classList.remove('dark-theme');
        elements.body.classList.add('light-theme');
    } else {
        elements.body.classList.add('dark-theme');
        elements.body.classList.remove('light-theme');
    }
}

function toggleTheme() {
    if (elements.body.classList.contains('dark-theme')) {
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
    // Theme toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

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
                </div>
            </div>
            <div class="card-items-list">
        `;

        // Render list of release items inside date
        entry.items.forEach(item => {
            const badgeClass = item.type.toLowerCase();
            const highlightedType = highlightText(item.type, state.searchQuery);
            const highlightedHtml = highlightText(item.html, state.searchQuery);

            headerHtml += `
                <div class="release-item">
                    <div class="type-badge-container">
                        <span class="type-badge ${badgeClass}">${highlightedType}</span>
                    </div>
                    <div class="item-description">
                        ${highlightedHtml}
                    </div>
                    <div class="item-actions">
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
window.copyPermalink = function(anchorId) {
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    navigator.clipboard.writeText(url).then(() => {
        const toast = elements.toastNotification;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
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

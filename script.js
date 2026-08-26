document.addEventListener('DOMContentLoaded', () => {

    const DHAKA_TZ = 'Asia/Dhaka';
    const TYPE_TO_PAGE = { exam: 'exams', assignment: 'assignments', event: 'events' };
    const PAGES = ['exams', 'assignments', 'events'];
    const CHAR_LIMIT = 110;

    let currentlyFlippedCard = null;

    /* ---------------------------------------------------------------
       Date handling — everything is evaluated in Bangladesh time
       (Asia/Dhaka, UTC+6, no DST) regardless of the visitor's own
       device timezone. This only reads the visitor's own clock and
       reformats it — no network request, so there's nothing to rate
       limit or spam.
       --------------------------------------------------------------- */

    function getDhakaTodayISO() {
        // en-CA formats as YYYY-MM-DD, which sorts/compares correctly as a string
        return new Intl.DateTimeFormat('en-CA', { timeZone: DHAKA_TZ }).format(new Date());
    }

    function computeStatus(event, todayISO) {
        const start = event.date;
        const end = event.endDate || event.date;
        if (todayISO < start) return 'upcoming';
        if (todayISO > end) return 'past';
        return 'ongoing';
    }

    function formatDisplayDate(iso, endIso) {
        const opts = { day: 'numeric', month: 'short', year: 'numeric' };
        const start = new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', opts);
        if (endIso && endIso !== iso) {
            const end = new Date(endIso + 'T00:00:00').toLocaleDateString('en-GB', opts);
            return `${start} – ${end}`;
        }
        return start;
    }

    /* ---------------------------------------------------------------
       Group events by page (exams / assignments / events) and by
       dynamically-computed status, then sort each group:
         - upcoming: soonest first
         - ongoing:  most recently started first
         - past:     most recently ended first
       --------------------------------------------------------------- */

    function classify(events) {
        const todayISO = getDhakaTodayISO();
        const buckets = {};
        PAGES.forEach(page => { buckets[page] = { upcoming: [], ongoing: [], past: [] }; });

        events.forEach(event => {
            const page = TYPE_TO_PAGE[event.type] || 'events';
            const status = computeStatus(event, todayISO);
            buckets[page][status].push(event);
        });

        Object.values(buckets).forEach(group => {
            group.upcoming.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
            group.ongoing.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
            group.past.sort((a, b) => {
                const aEnd = a.endDate || a.date;
                const bEnd = b.endDate || b.date;
                return aEnd > bEnd ? -1 : aEnd < bEnd ? 1 : 0;
            });
        });

        return buckets;
    }

    /* ---------------------------------------------------------------
       Rendering
       --------------------------------------------------------------- */

    function renderGroup(events, containerId, emptyMessage) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        if (events.length === 0) {
            container.innerHTML = `<p class="no-events">${emptyMessage}</p>`;
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card';

            const isLongText = event.details.length > CHAR_LIMIT;
            const displayDetails = isLongText ? event.details.substring(0, CHAR_LIMIT) : event.details;
            const dateLabel = formatDisplayDate(event.date, event.endDate);

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <h3>${event.name}</h3>
                        <p class="date">${dateLabel}</p>
                    </div>
                    <div class="card-back">
                        <h4>${event.name}</h4>
                        <div class="details-wrapper">
                            <div class="details-text">${displayDetails}</div>
                            ${isLongText ? '<div class="fade-out"></div>' : ''}
                        </div>
                        ${isLongText ? `<button class="show-more-btn" data-name="${event.name}" data-date="${dateLabel}" data-details="${event.details.replace(/"/g, '&quot;')}">Show more</button>` : ''}
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    function renderAll(buckets) {
        renderGroup(buckets.exams.upcoming, 'exams-upcoming-container', 'No upcoming exams.');
        renderGroup(buckets.exams.ongoing, 'exams-ongoing-container', 'No ongoing exams.');
        renderGroup(buckets.exams.past, 'exams-past-container', 'No past exams.');

        renderGroup(buckets.assignments.upcoming, 'assignments-upcoming-container', 'No upcoming assignments.');
        renderGroup(buckets.assignments.ongoing, 'assignments-ongoing-container', 'No ongoing assignments.');
        renderGroup(buckets.assignments.past, 'assignments-past-container', 'No past assignments.');

        renderGroup(buckets.events.upcoming, 'events-upcoming-container', 'No upcoming events.');
        renderGroup(buckets.events.ongoing, 'events-ongoing-container', 'No ongoing events.');
        renderGroup(buckets.events.past, 'events-past-container', 'No past events.');
    }

    fetch('events.json')
        .then(response => response.json())
        .then(events => renderAll(classify(events)))
        .catch(error => console.error('Failed to load events.json:', error));

    /* ---------------------------------------------------------------
       Navigation — hash-based paging (#exams is the default/home page)
       plus a hamburger menu that only takes over on small screens.
       --------------------------------------------------------------- */

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page');

    function openMenu() {
        mainNav.classList.add('open');
        hamburgerBtn.classList.add('open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        mainNav.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    }

    function showPage(pageName) {
        const target = PAGES.includes(pageName) ? pageName : 'exams';
        pages.forEach(page => {
            page.hidden = page.id !== `page-${target}`;
        });
        navLinks.forEach(link => {
            const isActive = link.dataset.page === target;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
        closeMenu();
    }

    hamburgerBtn.addEventListener('click', () => {
        mainNav.classList.contains('open') ? closeMenu() : openMenu();
    });

    document.addEventListener('click', (e) => {
        if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && e.target !== hamburgerBtn) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
            modalBackdrop.classList.add('hidden');
        }
    });

    window.addEventListener('hashchange', () => {
        showPage(location.hash.replace('#', ''));
    });

    showPage(location.hash.replace('#', '') || 'exams');

    /* ---------------------------------------------------------------
       Card flip + "show more" modal — delegated so they keep working
       no matter how many times renderGroup() runs.
       --------------------------------------------------------------- */

    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalDetails = document.getElementById('modal-details');

    function openModal(btn) {
        modalTitle.textContent = btn.getAttribute('data-name');
        modalDate.textContent = btn.getAttribute('data-date');
        modalDetails.textContent = btn.getAttribute('data-details');
        modalBackdrop.classList.remove('hidden');
    }

    document.addEventListener('click', (e) => {
        const showMoreBtn = e.target.closest('.show-more-btn');
        if (showMoreBtn) {
            openModal(showMoreBtn);
            return;
        }

        const card = e.target.closest('.card');
        if (card) {
            if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                currentlyFlippedCard.classList.remove('flipped');
            }
            card.classList.toggle('flipped');
            currentlyFlippedCard = card.classList.contains('flipped') ? card : null;
        }
    });

    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            modalBackdrop.classList.add('hidden');
        }
    });
});

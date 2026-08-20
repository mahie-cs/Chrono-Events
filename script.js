document.addEventListener('DOMContentLoaded', () => {
    let currentlyFlippedCard = null;

    
    fetch('events.json')
        .then(response => response.json())
        .then(events => {
            const ongoing = [];
            const upcoming = [];
            const past = [];

            
            const parseDate = (dateStr) => {
                const [day, month, year] = dateStr.split('-');
                return new Date(year, month - 1, day);
            };

            
            events.forEach(event => {
                const status = event.status.toLowerCase();
                if (status === 'ongoing') {
                    ongoing.push(event);
                } else if (status === 'upcoming') {
                    upcoming.push(event);
                } else if (status === 'past') {
                    past.push(event);
                }
            });

            upcoming.sort((a, b) => parseDate(a.date) - parseDate(b.date));

            renderEvents(ongoing, 'ongoing-container', true);
            renderEvents(upcoming, 'upcoming-container');
            renderEvents(past, 'past-container');
        })
        .catch(error => console.error('Failed to load events.json:', error));

    function renderEvents(events, containerId, isOngoingSection = false) {
        const container = document.getElementById(containerId);
        
        if (events.length === 0) {
            if (isOngoingSection) {
                container.innerHTML = '<p class="no-events">No ongoing events.</p>';
            }
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card';
            
            
            const charLimit = 110;
            const isLongText = event.details.length > charLimit;
            const displayDetails = isLongText 
                ? event.details.substring(0, charLimit) 
                : event.details;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <h3>${event.name}</h3>
                        <p class="date">${event.date}</p>
                    </div>
                    <div class="card-back">
                        <h4>${event.name}</h4>
                        <div class="details-wrapper">
                            <div class="details-text">${displayDetails}</div>
                            ${isLongText ? '<div class="fade-out"></div>' : ''}
                        </div>
                        ${isLongText ? `<button class="show-more-btn" data-name="${event.name}" data-date="${event.date}" data-details="${event.details.replace(/"/g, '&quot;')}">Show more</button>` : ''}
                    </div>
                </div>
            `;

            
            card.addEventListener('click', (e) => {
                
                if(e.target.classList.contains('show-more-btn')) return;

                
                if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                    currentlyFlippedCard.classList.remove('flipped');
                }
                
                card.classList.toggle('flipped');
                
                
                currentlyFlippedCard = card.classList.contains('flipped') ? card : null;
            });

            container.appendChild(card);
        });

        
        document.querySelectorAll('.show-more-btn').forEach(btn => {
            btn.addEventListener('click', openModal);
        });
    }

    
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalDetails = document.getElementById('modal-details');

    function openModal(e) {
        const btn = e.target;
        modalTitle.textContent = btn.getAttribute('data-name');
        modalDate.textContent = btn.getAttribute('data-date');
        modalDetails.textContent = btn.getAttribute('data-details');
        modalBackdrop.classList.remove('hidden');
    }

    
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            modalBackdrop.classList.add('hidden');
        }
    });
});
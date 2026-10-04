// Charger le planning
async function loadPlanning() {
  try {
    const response = await fetch('/api/planning');
    if (!response.ok) throw new Error(`Chargement du planning impossible (${response.status}).`);
    const planning = await response.json();
    renderCanteenMenu(planning.canteenMenu);
  } catch (error) {
    console.error('Erreur lors du chargement du planning:', error);
  }
}

document.querySelectorAll('.planning-pdf').forEach(frame => {
  frame.addEventListener('load', () => frame.classList.add('is-loaded'), { once: true });
});

function renderCanteenMenu(menu) {
  const weekLabel = document.getElementById('menuWeekLabel');
  const filters = document.getElementById('menuDayFilters');
  const tableBody = document.getElementById('menuTableBody');

  if (!menu || !Array.isArray(menu.days)) return;

  weekLabel.textContent = menu.week || '';
  filters.replaceChildren();

  const filterOptions = [
    { day: 'all', label: 'Toute la semaine' },
    ...menu.days.map(item => ({ day: item.day, label: item.day }))
  ];
  let activeDay = 'all';
  let hasChangedDay = false;

  const renderRows = () => {
    tableBody.replaceChildren();

    menu.days
      .filter(item => activeDay === 'all' || item.day === activeDay)
      .forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.setProperty('--row-delay', `${Math.min(index, 6) * 60}ms`);
        const values = [
          { label: 'Jour', value: `${item.day} ${item.date}` },
          { label: 'Entrée', value: item.starter },
          { label: 'Plat', value: item.main },
          { label: 'Accompagnements', value: item.accompaniments },
          { label: 'Dessert', value: item.dessert }
        ];

        values.forEach(({ label, value }) => {
          const cell = document.createElement('td');
          cell.dataset.label = label;
          cell.textContent = value || '—';
          row.appendChild(cell);
        });

        tableBody.appendChild(row);
      });
  };

  filterOptions.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-day-filter';
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(option.day === activeDay));
    button.addEventListener('click', () => {
      activeDay = option.day;
      hasChangedDay = true;
      tableBody.classList.toggle('is-day-change', hasChangedDay);
      filters.querySelectorAll('button').forEach(filterButton => {
        filterButton.setAttribute('aria-pressed', String(filterButton === button));
      });
      renderRows();
    });
    filters.appendChild(button);
  });

  renderRows();
}

document.addEventListener('DOMContentLoaded', function() {
  loadPlanning();
});

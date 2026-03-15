// ===== DATA LAYER =====
const COMMUNITIES = [
    { id: 'anchorage', name: 'Anchorage', type: 'Regulatory Site' },
    { id: 'fairbanks', name: 'Fairbanks', type: 'Regulatory Site' },
    { id: 'juneau', name: 'Juneau', type: 'Regulatory Site' },
    { id: 'bethel', name: 'Bethel', type: 'Community' },
    { id: 'homer', name: 'Homer', type: 'Community' },
    { id: 'ketchikan', name: 'Ketchikan', type: 'Community' },
    { id: 'kodiak', name: 'Kodiak', type: 'Community' },
    { id: 'ninilchik', name: 'Ninilchik', type: 'Community' },
    { id: 'sitka', name: 'Sitka', type: 'Community' },
    { id: 'tyonek', name: 'Tyonek', type: 'Community' },
    { id: 'wasilla', name: 'Wasilla', type: 'Community' },
    { id: 'wrangell', name: 'Wrangell', type: 'Community' },
];

function loadData(key, fallback) {
    try {
        const raw = localStorage.getItem('snt_' + key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

function saveData(key, data) {
    localStorage.setItem('snt_' + key, JSON.stringify(data));
}

let sensors = loadData('sensors', []);
let contacts = loadData('contacts', []);
let notes = loadData('notes', []);
let comms = loadData('comms', []);
let communityFiles = loadData('communityFiles', {});

function persist() {
    saveData('sensors', sensors);
    saveData('contacts', contacts);
    saveData('notes', notes);
    saveData('comms', comms);
    saveData('communityFiles', communityFiles);
}

// Load sample data on first run
if (sensors.length === 0 && contacts.length === 0) {
    sensors = [
        { id: 'Mod_660', soaTagId: '', type: 'Community Pod', status: 'Online', community: 'kodiak', location: 'Kodiak Public Library', datePurchased: '2023-06-15', collocationDates: '' },
        { id: 'Mod_471', soaTagId: '', type: 'Audit Pod', status: 'Online', community: 'anchorage', location: 'DEC Anchorage Office', datePurchased: '2022-11-01', collocationDates: 'Mar 5 - Mar 13, 2026' },
        { id: 'Mod_674', soaTagId: '', type: 'Community Pod', status: 'Online', community: 'bethel', location: 'Bethel Youth Facility', datePurchased: '2023-08-20', collocationDates: '' },
        { id: 'Mod_512', soaTagId: '', type: 'Permanent Pod', status: 'Online', community: 'fairbanks', location: 'DEC Fairbanks Office', datePurchased: '2022-03-10', collocationDates: '' },
        { id: 'Mod_389', soaTagId: '', type: 'Community Pod', status: 'Offline', community: 'homer', location: 'Homer Public Library', datePurchased: '2023-01-18', collocationDates: '' },
        { id: 'Mod_445', soaTagId: '', type: 'Audit Pod', status: 'In Storage', community: 'juneau', location: 'DEC Juneau Office', datePurchased: '2022-07-22', collocationDates: '' },
        { id: 'Mod_701', soaTagId: '', type: 'Community Pod', status: 'Online', community: 'sitka', location: 'Sitka Tribal Office', datePurchased: '2024-02-14', collocationDates: '' },
        { id: 'Mod_555', soaTagId: '', type: 'Community Pod', status: 'PM Sensor Issue', community: 'wrangell', location: 'Wrangell School', datePurchased: '2023-05-03', collocationDates: '' },
    ];
    contacts = [
        { id: 'c1', name: 'Patricia Valerio', role: 'Tribal Environmental Coordinator', community: 'kodiak', email: 'pvalerio@example.com', phone: '907-555-0101', org: 'Kodiak Area Native Association' },
        { id: 'c2', name: 'Kim Sweet', role: 'Village Administrator', community: 'bethel', email: 'ksweet@example.com', phone: '907-555-0202', org: 'Orutsararmiut Native Council' },
        { id: 'c3', name: 'James Dalton', role: 'School Principal', community: 'wrangell', email: 'jdalton@example.com', phone: '907-555-0303', org: 'Wrangell Public Schools' },
        { id: 'c4', name: 'Maria Chen', role: 'Librarian', community: 'homer', email: 'mchen@example.com', phone: '907-555-0404', org: 'Homer Public Library' },
    ];
    notes = [
        {
            id: 'n1',
            date: '2026-03-13',
            type: 'Audit',
            text: 'Kodiak sensor Mod_660 audited by Anchorage audit pod Mod_471 from March 5 - March 13, 2026, with coordination assistance by @Patricia Valerio.',
            taggedSensors: ['Mod_660', 'Mod_471'],
            taggedCommunities: ['kodiak', 'anchorage'],
            taggedContacts: ['c1'],
        }
    ];
    persist();
}

// ===== STATE =====
let currentCommunity = null;
let currentSensor = null;
let currentContact = null;

// ===== SIDEBAR =====
function buildSidebar() {
    const list = document.getElementById('community-list');
    list.innerHTML = COMMUNITIES.map(c =>
        `<li><a href="#" data-community="${c.id}" onclick="showCommunity('${c.id}')">${c.name}</a></li>`
    ).join('');
}

document.querySelector('.community-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    const list = document.getElementById('community-list');
    if (list.classList.contains('open')) {
        list.classList.remove('open');
    } else {
        list.classList.add('open');
        showView('communities');
    }
});

document.querySelectorAll('.menu-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view === 'dashboard') showView('dashboard');
        if (view === 'all-sensors') showView('all-sensors');
        if (view === 'contacts') showView('contacts');
        if (view === 'communities') return; // handled above
    });
});

// ===== VIEW MANAGEMENT =====
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');

    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    const menuItem = document.querySelector(`.menu-item[data-view="${viewName}"]`);
    if (menuItem) menuItem.classList.add('active');

    document.querySelectorAll('.community-list a').forEach(a => a.classList.remove('active'));

    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'all-sensors') renderSensors();
    if (viewName === 'contacts') renderContacts();
    if (viewName === 'communities') renderCommunitiesList();
}

// ===== DASHBOARD =====
function renderDashboard() {
    const online = sensors.filter(s => s.status === 'Online').length;
    const offline = sensors.filter(s => s.status !== 'Online').length;

    document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-value">${sensors.length}</div><div class="stat-label">Total Sensors</div></div>
        <div class="stat-card"><div class="stat-value">${online}</div><div class="stat-label">Online</div></div>
        <div class="stat-card"><div class="stat-value">${offline}</div><div class="stat-label">Offline / Other</div></div>
        <div class="stat-card"><div class="stat-value">${COMMUNITIES.length}</div><div class="stat-label">Communities</div></div>
        <div class="stat-card"><div class="stat-value">${contacts.length}</div><div class="stat-label">Contacts</div></div>
    `;
}

// ===== COMMUNITIES LIST VIEW =====
function renderCommunitiesList() {
    const search = (document.getElementById('community-search')?.value || '').toLowerCase();
    let filtered = COMMUNITIES.filter(c => {
        if (search && !c.name.toLowerCase().includes(search)) return false;
        return true;
    });

    const container = document.getElementById('communities-list-container');
    container.innerHTML = filtered.map(c => {
        const commSensors = sensors.filter(s => s.community === c.id);
        const sensorListStr = commSensors.length > 0
            ? commSensors.map(s => s.id).join(', ')
            : 'No sensors';
        return `
            <div class="community-card" onclick="showCommunity('${c.id}')">
                <div class="community-card-info">
                    <h3>${c.name}</h3>
                    <div class="community-card-type">${c.type}</div>
                </div>
                <div class="community-card-sensors">
                    <div><strong>Associated Sensors:</strong></div>
                    <div class="sensor-list">${sensorListStr}</div>
                </div>
            </div>
        `;
    }).join('') || '<div class="empty-state">No communities found.</div>';
}

// ===== SENSORS =====
function getStatusBadgeClass(status) {
    const map = {
        'Online': 'badge-online',
        'Offline': 'badge-offline',
        'Collocation': 'badge-collocation',
        'PM Sensor Issue': 'badge-issue',
        'In Storage': 'badge-storage',
        'In Transit': 'badge-transit',
        'Servicing': 'badge-servicing',
    };
    return map[status] || 'badge-storage';
}

function getCommunityName(id) {
    const c = COMMUNITIES.find(c => c.id === id);
    return c ? c.name : id || '—';
}

function renderSensors() {
    const search = (document.getElementById('sensor-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('sensor-status-filter')?.value || '';

    let filtered = sensors.filter(s => {
        if (search && !s.id.toLowerCase().includes(search) && !getCommunityName(s.community).toLowerCase().includes(search) && !(s.soaTagId || '').toLowerCase().includes(search)) return false;
        if (statusFilter && s.status !== statusFilter) return false;
        return true;
    });

    document.getElementById('sensors-tbody').innerHTML = filtered.map(s => `
        <tr>
            <td><span class="clickable" onclick="showSensorDetail('${s.id}')">${s.id}</span><br><small style="color:#888">${s.type}</small></td>
            <td>${s.soaTagId || '—'}</td>
            <td><span class="badge ${getStatusBadgeClass(s.status)} badge-clickable" onclick="openStatusChangeModal('${s.id}')">${s.status}</span></td>
            <td><span class="clickable" onclick="showCommunity('${s.community}')">${getCommunityName(s.community)}</span></td>
            <td>${s.location || '—'}</td>
            <td>${s.datePurchased || '—'}</td>
            <td>${s.collocationDates || '—'}</td>
            <td>
                <button class="btn btn-sm" onclick="openEditSensorModal('${s.id}')">Edit</button>
                <button class="btn btn-sm" onclick="openMoveSensorModal('${s.id}')">Move</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="8" class="empty-state">No sensors found.</td></tr>';
}

function openAddSensorModal() {
    document.getElementById('sensor-modal-title').textContent = 'Add New Sensor';
    document.getElementById('sensor-form').reset();
    document.getElementById('sensor-edit-id').value = '';
    populateCommunitySelect('sensor-community-input');
    openModal('modal-add-sensor');
}

function openEditSensorModal(sensorId) {
    const s = sensors.find(x => x.id === sensorId);
    if (!s) return;
    document.getElementById('sensor-modal-title').textContent = 'Edit Sensor';
    document.getElementById('sensor-edit-id').value = s.id;
    document.getElementById('sensor-id-input').value = s.id;
    document.getElementById('sensor-soa-input').value = s.soaTagId || '';
    document.getElementById('sensor-type-input').value = s.type;
    document.getElementById('sensor-status-input').value = s.status;
    populateCommunitySelect('sensor-community-input');
    document.getElementById('sensor-community-input').value = s.community;
    document.getElementById('sensor-location-input').value = s.location || '';
    document.getElementById('sensor-purchased-input').value = s.datePurchased || '';
    document.getElementById('sensor-collocation-input').value = s.collocationDates || '';
    openModal('modal-add-sensor');
}

// Annotation queue for sequential change popups
let pendingAnnotations = [];
let currentAnnotationSensorId = null;

function saveSensor(e) {
    e.preventDefault();
    const editId = document.getElementById('sensor-edit-id').value;
    const data = {
        id: document.getElementById('sensor-id-input').value.trim(),
        soaTagId: document.getElementById('sensor-soa-input').value.trim(),
        type: document.getElementById('sensor-type-input').value,
        status: document.getElementById('sensor-status-input').value,
        community: document.getElementById('sensor-community-input').value,
        location: document.getElementById('sensor-location-input').value.trim(),
        datePurchased: document.getElementById('sensor-purchased-input').value,
        collocationDates: document.getElementById('sensor-collocation-input').value.trim(),
    };

    if (editId) {
        const oldSensor = sensors.find(s => s.id === editId);
        if (!oldSensor) return;

        // Detect changes
        const fieldLabels = {
            soaTagId: 'SOA Tag ID', type: 'Type', status: 'Status',
            community: 'Community', location: 'Location',
            datePurchased: 'Purchase Date', collocationDates: 'Collocation Dates'
        };

        const changes = [];
        for (const [field, label] of Object.entries(fieldLabels)) {
            const oldVal = oldSensor[field] || '';
            const newVal = data[field] || '';
            if (oldVal !== newVal) {
                const oldDisplay = field === 'community' ? getCommunityName(oldVal) : (oldVal || '(empty)');
                const newDisplay = field === 'community' ? getCommunityName(newVal) : (newVal || '(empty)');
                changes.push({ field, label, oldVal: oldDisplay, newVal: newDisplay, sensorId: editId });
            }
        }

        // Apply the data
        const idx = sensors.findIndex(s => s.id === editId);
        if (idx >= 0) sensors[idx] = data;
        persist();
        closeModal('modal-add-sensor');
        renderSensors();

        // If there are changes, queue annotation popups
        if (changes.length > 0) {
            currentAnnotationSensorId = editId;
            pendingAnnotations = changes.map(c => ({
                sensorId: c.sensorId,
                summary: c.field === 'community'
                    ? `Moved from ${c.oldVal} to ${c.newVal}`
                    : `${c.label} changed from "${c.oldVal}" to "${c.newVal}"`,
                field: c.field,
                oldVal: c.oldVal,
                newVal: c.newVal,
                label: c.label,
            }));
            showNextAnnotation();
        }
    } else {
        if (sensors.find(s => s.id === data.id)) {
            alert('A sensor with that ID already exists.');
            return;
        }
        sensors.push(data);
        persist();
        closeModal('modal-add-sensor');
        renderSensors();
    }
}

function showNextAnnotation() {
    if (pendingAnnotations.length === 0) {
        currentAnnotationSensorId = null;
        if (currentSensor) showSensorDetail(currentSensor);
        return;
    }

    const next = pendingAnnotations[0];
    document.getElementById('edit-annotation-summary').innerHTML =
        `<strong>${next.sensorId}</strong>: ${next.summary}`;
    document.getElementById('edit-annotation-text').value = '';
    document.getElementById('edit-annotation-date').value = nowDatetime();
    openModal('modal-edit-annotation');
}

function buildAnnotationNote(annotation, additionalInfo, date) {
    const isMovement = annotation.field === 'community';
    const s = sensors.find(x => x.id === annotation.sensorId);

    let noteText;
    let noteType;
    let taggedCommunities;

    if (isMovement) {
        noteText = `${annotation.sensorId} removed from ${annotation.oldVal} and brought to ${annotation.newVal}.`;
        noteType = 'Movement';
        const oldId = COMMUNITIES.find(c => c.name === annotation.oldVal)?.id;
        const newId = COMMUNITIES.find(c => c.name === annotation.newVal)?.id;
        taggedCommunities = [oldId, newId].filter(Boolean);
    } else {
        noteText = `${annotation.sensorId} ${annotation.label.toLowerCase()} changed from "${annotation.oldVal}" to "${annotation.newVal}".`;
        noteType = 'Info Edit';
        taggedCommunities = s && s.community ? [s.community] : [];
    }

    return {
        id: 'n' + Date.now() + Math.random().toString(36).slice(2, 5),
        date: date || nowDatetime(),
        type: noteType,
        text: noteText,
        additionalInfo: additionalInfo || '',
        taggedSensors: [annotation.sensorId],
        taggedCommunities: taggedCommunities,
        taggedContacts: additionalInfo ? parseMentionedContacts(additionalInfo) : [],
    };
}

function saveEditAnnotation() {
    const annotation = pendingAnnotations.shift();
    const additionalInfo = document.getElementById('edit-annotation-text').value.trim();
    const date = document.getElementById('edit-annotation-date').value || nowDatetime();

    notes.push(buildAnnotationNote(annotation, additionalInfo, date));
    persist();
    closeModal('modal-edit-annotation');

    setTimeout(() => showNextAnnotation(), 150);
}

function skipEditAnnotation() {
    const annotation = pendingAnnotations.shift();
    const date = document.getElementById('edit-annotation-date').value || nowDatetime();

    notes.push(buildAnnotationNote(annotation, '', date));
    persist();
    closeModal('modal-edit-annotation');

    setTimeout(() => showNextAnnotation(), 150);
}

// ===== INLINE STATUS CHANGE =====
function openStatusChangeModal(sensorId) {
    const s = sensors.find(x => x.id === sensorId);
    if (!s) return;
    document.getElementById('status-change-sensor-id').value = s.id;
    document.getElementById('status-change-old').value = s.status;
    document.getElementById('status-change-sensor-label').textContent = s.id;
    document.getElementById('status-change-new').value = s.status;
    document.getElementById('status-change-info').value = '';
    document.getElementById('status-change-date').value = nowDatetime();
    openModal('modal-status-change');
}

function saveStatusChange(e) {
    e.preventDefault();
    const sensorId = document.getElementById('status-change-sensor-id').value;
    const oldStatus = document.getElementById('status-change-old').value;
    const newStatus = document.getElementById('status-change-new').value;
    const additionalInfo = document.getElementById('status-change-info').value.trim();
    const statusDate = document.getElementById('status-change-date').value || nowDatetime();

    if (oldStatus === newStatus) {
        closeModal('modal-status-change');
        return;
    }

    const s = sensors.find(x => x.id === sensorId);
    if (!s) return;

    s.status = newStatus;

    let noteText = `${sensorId} status changed from "${oldStatus}" to "${newStatus}".`;

    const mentionedContacts = parseMentionedContacts(additionalInfo);

    const note = {
        id: 'n' + Date.now(),
        date: statusDate,
        type: 'Status Change',
        text: noteText,
        additionalInfo: additionalInfo || '',
        taggedSensors: [sensorId],
        taggedCommunities: s.community ? [s.community] : [],
        taggedContacts: mentionedContacts,
    };

    notes.push(note);
    persist();
    closeModal('modal-status-change');
    renderSensors();
    if (currentSensor === sensorId) showSensorDetail(sensorId);
    if (currentCommunity) showCommunity(currentCommunity);
}

// ===== MOVE SENSOR =====
function openMoveSensorModal(sensorId) {
    const s = sensors.find(x => x.id === sensorId);
    if (!s) return;
    document.getElementById('move-sensor-id').value = s.id;
    document.getElementById('move-sensor-label').textContent = s.id;
    document.getElementById('move-from-label').textContent = getCommunityName(s.community);
    document.getElementById('move-additional-info').value = '';
    document.getElementById('move-date').value = nowDatetime();
    populateCommunitySelect('move-to-community');
    openModal('modal-move-sensor');
}

function moveSensor(e) {
    e.preventDefault();
    const sensorId = document.getElementById('move-sensor-id').value;
    const toCommunityId = document.getElementById('move-to-community').value;
    const additionalInfo = document.getElementById('move-additional-info').value.trim();
    const moveDate = document.getElementById('move-date').value || nowDatetime();

    const s = sensors.find(x => x.id === sensorId);
    if (!s) return;

    const fromId = s.community;
    const fromName = getCommunityName(fromId);
    const toName = getCommunityName(toCommunityId);

    s.community = toCommunityId;

    let noteText = `${sensorId} removed from ${fromName} and brought to ${toName}.`;

    const mentionedContacts = parseMentionedContacts(additionalInfo);
    const taggedCommunities = [fromId, toCommunityId].filter(Boolean);

    const note = {
        id: 'n' + Date.now(),
        date: moveDate,
        type: 'Movement',
        text: noteText,
        additionalInfo: additionalInfo || '',
        taggedSensors: [sensorId],
        taggedCommunities: taggedCommunities,
        taggedContacts: mentionedContacts,
    };

    notes.push(note);
    persist();
    closeModal('modal-move-sensor');
    renderSensors();
    if (currentCommunity) showCommunity(currentCommunity);
}

// ===== SENSOR DETAIL =====
function showSensorDetail(sensorId) {
    const s = sensors.find(x => x.id === sensorId);
    if (!s) return;
    currentSensor = sensorId;

    document.getElementById('sensor-detail-title').textContent = s.id;
    document.getElementById('sensor-info-card').innerHTML = `
        <div class="info-item"><label>Type</label><p>${s.type}</p></div>
        <div class="info-item"><label>SOA Tag ID</label><p class="editable-field" onclick="inlineEditSensor('${s.id}', 'soaTagId')">${s.soaTagId || '—'}</p></div>
        <div class="info-item"><label>Status</label><p><span class="badge ${getStatusBadgeClass(s.status)} badge-clickable" onclick="openStatusChangeModal('${s.id}')">${s.status}</span></p></div>
        <div class="info-item"><label>Community</label><p><span class="editable-field" onclick="openInlineCommunityChange('${s.id}')">${getCommunityName(s.community)}</span></p><a class="move-sensor-link" onclick="openMoveSensorModal('${s.id}')">Move Sensor &rarr;</a></div>
        <div class="info-item"><label>Location</label><p class="editable-field" onclick="inlineEditSensor('${s.id}', 'location')">${s.location || '—'}</p></div>
        <div class="info-item"><label>Purchase Date</label><p class="editable-field" onclick="inlineEditSensor('${s.id}', 'datePurchased')">${s.datePurchased || '—'}</p></div>
        <div class="info-item"><label>Collocation Dates</label><p class="editable-field" onclick="inlineEditSensor('${s.id}', 'collocationDates')">${s.collocationDates || '—'}</p></div>
    `;

    // Reset filter
    const filterEl = document.getElementById('sensor-history-filter');
    if (filterEl) filterEl.value = '';

    filterSensorHistory();

    resetTabs(document.getElementById('view-sensor-detail'));

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-sensor-detail').classList.add('active');
}

function inlineEditSensor(sensorId, field) {
    const s = sensors.find(x => x.id === sensorId);
    if (!s) return;

    const labels = { soaTagId: 'SOA Tag ID', location: 'Location', datePurchased: 'Purchase Date', collocationDates: 'Collocation Dates' };
    const label = labels[field] || field;
    const oldVal = s[field] || '';
    const newVal = prompt(`Edit ${label}:`, oldVal);
    if (newVal === null || newVal.trim() === oldVal) return;

    s[field] = newVal.trim();
    persist();
    showSensorDetail(sensorId);

    // Queue annotation for this change
    currentAnnotationSensorId = sensorId;
    pendingAnnotations = [{
        sensorId: sensorId,
        summary: `${label} changed from "${oldVal || '(empty)'}" to "${newVal.trim()}"`,
        field: field,
        oldVal: oldVal || '(empty)',
        newVal: newVal.trim(),
        label: label,
    }];
    showNextAnnotation();
}

// ===== COMMUNITIES =====
function showCommunity(communityId) {
    const community = COMMUNITIES.find(c => c.id === communityId);
    if (!community) return;
    currentCommunity = communityId;

    document.getElementById('community-name').textContent = community.name;
    document.getElementById('community-type-badge').textContent = community.type;

    document.querySelectorAll('.community-list a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.community-list a[data-community="${communityId}"]`);
    if (link) link.classList.add('active');
    document.getElementById('community-list').classList.add('open');

    // Sensors
    const commSensors = sensors.filter(s => s.community === communityId);
    document.getElementById('community-sensors-tbody').innerHTML = commSensors.map(s => `
        <tr>
            <td><span class="clickable" onclick="showSensorDetail('${s.id}')">${s.id}</span><br><small style="color:#888">${s.type}</small></td>
            <td>${s.soaTagId || '—'}</td>
            <td><span class="badge ${getStatusBadgeClass(s.status)} badge-clickable" onclick="openStatusChangeModal('${s.id}')">${s.status}</span></td>
            <td>${s.location || '—'}</td>
            <td>${s.datePurchased || '—'}</td>
            <td>${s.collocationDates || '—'}</td>
            <td>
                <button class="btn btn-sm" onclick="openEditSensorModal('${s.id}')">Edit</button>
                <button class="btn btn-sm" onclick="openMoveSensorModal('${s.id}')">Move</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="empty-state">No sensors in this community.</td></tr>';

    // Contacts
    const commContacts = contacts.filter(c => c.community === communityId);
    document.getElementById('community-contacts-list').innerHTML = commContacts.map(c => `
        <div class="contact-card" onclick="showContactDetail('${c.id}')">
            <h3>${c.name}</h3>
            <div class="contact-role">${c.role || ''}</div>
            <div class="contact-detail">${c.org || ''}</div>
            <div class="contact-detail">${c.email ? `<a href="mailto:${c.email}" class="clickable" onclick="event.stopPropagation()">${c.email}</a>` : ''}</div>
            <div class="contact-detail">${c.phone ? `<a href="tel:${c.phone}" class="clickable" onclick="event.stopPropagation()">${c.phone}</a>` : ''}</div>
        </div>
    `).join('') || '<div class="empty-state">No contacts for this community.</div>';

    // History
    const commNotes = notes.filter(n => n.taggedCommunities && n.taggedCommunities.includes(communityId));
    renderTimeline('community-history-timeline', commNotes);

    // Comms
    const commComms = comms.filter(c => c.community === communityId || (c.taggedCommunities && c.taggedCommunities.includes(communityId)));
    renderTimeline('community-comms-timeline', commComms.map(c => ({
        ...c,
        type: c.commType || c.type,
    })));

    // Files
    renderCommunityFiles(communityId);

    resetTabs(document.getElementById('view-community'));

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-community').classList.add('active');
}

// ===== FILES =====
function handleFileUpload(event) {
    const files = event.target.files;
    if (!files.length || !currentCommunity) return;

    if (!communityFiles[currentCommunity]) communityFiles[currentCommunity] = [];

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            communityFiles[currentCommunity].push({
                id: 'f' + Date.now() + Math.random().toString(36).slice(2, 6),
                name: file.name,
                type: file.type,
                data: e.target.result,
                date: nowDatetime(),
            });
            persist();
            renderCommunityFiles(currentCommunity);
        };
        reader.readAsDataURL(file);
    }

    event.target.value = '';
}

function renderCommunityFiles(communityId) {
    const files = communityFiles[communityId] || [];
    const grid = document.getElementById('community-files-grid');

    if (!files.length) {
        grid.innerHTML = '<div class="empty-state">No files uploaded yet.</div>';
        return;
    }

    grid.innerHTML = files.map(f => {
        if (f.type && f.type.startsWith('image/')) {
            return `
                <div class="file-card">
                    <img src="${f.data}" alt="${f.name}" onclick="window.open('${f.data}', '_blank')">
                    <div class="file-info">
                        <div>
                            <div class="file-name">${f.name}</div>
                            <div class="file-date">${formatDate(f.date)}</div>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="deleteFile('${communityId}', '${f.id}')">Delete</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="file-card">
                    <div class="file-card-pdf">
                        <div class="pdf-icon">&#128196;</div>
                        <div class="pdf-label">${f.name}</div>
                    </div>
                    <div class="file-info">
                        <div>
                            <div class="file-name">${f.name}</div>
                            <div class="file-date">${formatDate(f.date)}</div>
                        </div>
                        <div>
                            <a class="btn btn-sm" href="${f.data}" download="${f.name}">Download</a>
                            <button class="btn btn-sm btn-danger" onclick="deleteFile('${communityId}', '${f.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function deleteFile(communityId, fileId) {
    if (!confirm('Delete this file?')) return;
    communityFiles[communityId] = (communityFiles[communityId] || []).filter(f => f.id !== fileId);
    persist();
    renderCommunityFiles(communityId);
}

// ===== CONTACTS =====
function renderContacts() {
    const search = (document.getElementById('contact-search')?.value || '').toLowerCase();
    let filtered = contacts.filter(c => {
        if (search && !c.name.toLowerCase().includes(search) && !getCommunityName(c.community).toLowerCase().includes(search)) return false;
        return true;
    });

    // Group by community, sorted alphabetically
    const groups = {};
    filtered.forEach(c => {
        const commName = getCommunityName(c.community);
        if (!groups[commName]) groups[commName] = [];
        groups[commName].push(c);
    });

    // Sort community names alphabetically
    const sortedCommunities = Object.keys(groups).sort();

    // Sort contacts within each community alphabetically
    sortedCommunities.forEach(comm => {
        groups[comm].sort((a, b) => a.name.localeCompare(b.name));
    });

    const container = document.getElementById('contacts-grid');
    container.innerHTML = sortedCommunities.map(commName => `
        <div class="contacts-group">
            <div class="contacts-group-header">${commName}</div>
            <div class="contacts-grid">
                ${groups[commName].map(c => `
                    <div class="contact-card" onclick="showContactDetail('${c.id}')">
                        <h3>${c.name}</h3>
                        <div class="contact-role">${c.role || ''}</div>
                        <div class="contact-detail">${c.org || ''}</div>
                        <div class="contact-detail">${c.email ? `<a href="mailto:${c.email}" class="clickable" onclick="event.stopPropagation()">${c.email}</a>` : ''}</div>
                        <div class="contact-detail">${c.phone ? `<a href="tel:${c.phone}" class="clickable" onclick="event.stopPropagation()">${c.phone}</a>` : ''}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('') || '<div class="empty-state">No contacts found.</div>';
}

function openAddContactModal() {
    document.getElementById('contact-modal-title').textContent = 'Add New Contact';
    document.getElementById('contact-form').reset();
    document.getElementById('contact-edit-id').value = '';
    populateCommunitySelect('contact-community-input');
    openModal('modal-add-contact');
}

function saveContact(e) {
    e.preventDefault();
    const editId = document.getElementById('contact-edit-id').value;
    const data = {
        id: editId || 'c' + Date.now(),
        name: document.getElementById('contact-name-input').value.trim(),
        role: document.getElementById('contact-role-input').value.trim(),
        community: document.getElementById('contact-community-input').value,
        email: document.getElementById('contact-email-input').value.trim(),
        phone: document.getElementById('contact-phone-input').value.trim(),
        org: document.getElementById('contact-org-input').value.trim(),
    };

    if (editId) {
        const idx = contacts.findIndex(c => c.id === editId);
        if (idx >= 0) contacts[idx] = data;
    } else {
        contacts.push(data);
    }

    persist();
    closeModal('modal-add-contact');
    renderContacts();
}

function showContactDetail(contactId) {
    const c = contacts.find(x => x.id === contactId);
    if (!c) return;
    currentContact = contactId;

    document.getElementById('contact-detail-name').textContent = c.name;
    document.getElementById('contact-info-card').innerHTML = `
        <div class="info-item"><label>Role</label><p>${c.role || '—'}</p></div>
        <div class="info-item"><label>Community</label><p><span class="clickable" onclick="showCommunity('${c.community}')">${getCommunityName(c.community)}</span></p></div>
        <div class="info-item"><label>Organization</label><p>${c.org || '—'}</p></div>
        <div class="info-item"><label>Email</label><p>${c.email ? `<a href="mailto:${c.email}" class="clickable">${c.email}</a>` : '—'}</p></div>
        <div class="info-item"><label>Phone</label><p>${c.phone ? `<a href="tel:${c.phone}" class="clickable">${c.phone}</a>` : '—'}</p></div>
    `;

    // Combine notes and comms into one list
    const contactNotes = notes.filter(n => n.taggedContacts && n.taggedContacts.includes(contactId));
    const contactComms = comms.filter(cm => cm.taggedContacts && cm.taggedContacts.includes(contactId))
        .map(cm => ({ ...cm, type: cm.commType || cm.type }));
    const allItems = [...contactNotes, ...contactComms];
    renderTimeline('contact-all-timeline', allItems);

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-contact-detail').classList.add('active');
}

function openContactCommModal() {
    if (!currentContact) return;
    const c = contacts.find(x => x.id === currentContact);
    if (!c) return;
    // Open the comm modal with the contact's community, and pre-fill the contact name
    document.getElementById('comm-form').reset();
    document.getElementById('comm-community-id').value = c.community;
    document.getElementById('comm-date-input').value = nowDatetime();
    document.getElementById('comm-contacts-input').value = c.name;
    openModal('modal-comm');
}

// ===== EMAIL COMPOSER =====
function openEmailModal() {
    populateCommunitySelect('email-community-filter');
    renderEmailRecipients();
    document.getElementById('email-subject').value = '';
    document.getElementById('email-body').value = '';
    openModal('modal-email');
}

function renderEmailRecipients() {
    const list = document.getElementById('email-recipients-list');

    // Group contacts by community alphabetically
    const groups = {};
    contacts.forEach(c => {
        const commName = getCommunityName(c.community);
        if (!groups[commName]) groups[commName] = [];
        groups[commName].push(c);
    });

    const sortedCommunities = Object.keys(groups).sort();

    list.innerHTML = sortedCommunities.map(commName => {
        const groupContacts = groups[commName].sort((a, b) => a.name.localeCompare(b.name));
        return `
            <div class="email-community-header">${commName}</div>
            ${groupContacts.map(c => `
                <div class="email-recipient-row">
                    <input type="checkbox" id="email-cb-${c.id}" data-contact-id="${c.id}" data-community="${c.community}" checked>
                    <label for="email-cb-${c.id}">${c.name}</label>
                    <span class="recipient-community">${c.email || 'no email'}</span>
                </div>
            `).join('')}
        `;
    }).join('');
}

function emailSelectAll() {
    document.querySelectorAll('#email-recipients-list input[type="checkbox"]').forEach(cb => cb.checked = true);
}

function emailDeselectAll() {
    document.querySelectorAll('#email-recipients-list input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function emailShowAll() {
    document.getElementById('email-community-filter').value = '';
    renderEmailRecipients();
    emailDeselectAll();
}

function emailFilterByCommunity() {
    const commId = document.getElementById('email-community-filter').value;
    if (!commId) {
        // Show all contacts, none checked
        renderEmailRecipients();
        emailDeselectAll();
        return;
    }

    // Show only contacts from the selected community
    const filtered = contacts.filter(c => c.community === commId);
    const list = document.getElementById('email-recipients-list');
    const commName = getCommunityName(commId);

    list.innerHTML = `
        <div class="email-community-header">${commName}</div>
        ${filtered.sort((a, b) => a.name.localeCompare(b.name)).map(c => `
            <div class="email-recipient-row">
                <input type="checkbox" id="email-cb-${c.id}" data-contact-id="${c.id}" data-community="${c.community}" checked>
                <label for="email-cb-${c.id}">${c.name}</label>
                <span class="recipient-community">${c.email || 'no email'}</span>
            </div>
        `).join('')}
    `;

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">No contacts in this community.</div>';
    }
}

function sendEmail() {
    const subject = document.getElementById('email-subject').value.trim();
    const body = document.getElementById('email-body').value.trim();

    // Get checked contacts
    const checkedBoxes = document.querySelectorAll('#email-recipients-list input[type="checkbox"]:checked');
    const selectedContactIds = Array.from(checkedBoxes).map(cb => cb.dataset.contactId);
    const selectedContacts = selectedContactIds.map(id => contacts.find(c => c.id === id)).filter(Boolean);
    const emails = selectedContacts.map(c => c.email).filter(Boolean);

    if (emails.length === 0) {
        alert('No contacts with email addresses are selected.');
        return;
    }

    // Open mailto link (works with Outlook and other mail clients)
    const mailtoLink = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    // Log the communication under each involved contact and community
    const involvedCommunities = [...new Set(selectedContacts.map(c => c.community))];

    const comm = {
        id: 'comm' + Date.now(),
        date: nowDatetime(),
        type: 'Communication',
        commType: 'Email',
        subject: subject,
        fullBody: body,
        text: `[Email] Subject: ${subject}`,
        community: involvedCommunities[0] || '',
        taggedContacts: selectedContactIds,
        taggedCommunities: involvedCommunities,
    };

    comms.push(comm);
    persist();
    closeModal('modal-email');
}

// ===== NOTES =====
function openAddNoteModal(contextId, contextType) {
    document.getElementById('note-form').reset();
    document.getElementById('note-context-id').value = contextId;
    document.getElementById('note-context-type').value = contextType;
    document.getElementById('note-date-input').value = nowDatetime();

    // Clear all chip containers
    document.querySelectorAll('#modal-add-note .tag-chip').forEach(c => c.remove());

    // Pre-fill based on context
    if (contextType === 'community') {
        prefillChip('tag-communities-container', getCommunityName(contextId));
    } else if (contextType === 'sensor') {
        prefillChip('tag-sensors-container', contextId);
    }

    // Init tag chip inputs
    setupTagChipInput('tag-sensors-container',
        () => sensors,
        s => s.id
    );
    setupTagChipInput('tag-communities-container',
        () => COMMUNITIES,
        c => c.name
    );
    setupTagChipInput('tag-contacts-container',
        () => contacts,
        c => c.name
    );

    openModal('modal-add-note');
}

function saveNote(e) {
    e.preventDefault();

    const text = document.getElementById('note-text-input').value.trim();
    const type = document.getElementById('note-type-input').value;
    const noteDate = document.getElementById('note-date-input').value || nowDatetime();

    const sensorTags = getChipValues('tag-sensors-container');

    const communityTags = getChipValues('tag-communities-container')
        .map(name => {
            const c = COMMUNITIES.find(c => c.name.toLowerCase() === name.toLowerCase());
            return c ? c.id : null;
        }).filter(Boolean);

    const contactTags = getChipValues('tag-contacts-container')
        .map(name => {
            const c = contacts.find(c => c.name.toLowerCase() === name.toLowerCase());
            return c ? c.id : null;
        }).filter(Boolean);

    // Also parse @mentions from the note text itself
    const textMentions = parseMentionedContacts(text);
    textMentions.forEach(id => {
        if (!contactTags.includes(id)) contactTags.push(id);
    });

    const note = {
        id: 'n' + Date.now(),
        date: noteDate,
        type: type,
        text: text,
        taggedSensors: sensorTags,
        taggedCommunities: communityTags,
        taggedContacts: contactTags,
    };

    notes.push(note);
    persist();
    closeModal('modal-add-note');

    if (currentCommunity) showCommunity(currentCommunity);
    if (currentSensor) showSensorDetail(currentSensor);
}

// ===== COMMUNICATIONS =====
function openCommModal(communityId) {
    document.getElementById('comm-form').reset();
    document.getElementById('comm-community-id').value = communityId;
    document.getElementById('comm-date-input').value = nowDatetime();
    openModal('modal-comm');
}

function saveComm(e) {
    e.preventDefault();

    const communityId = document.getElementById('comm-community-id').value;
    const commType = document.getElementById('comm-type-input').value;
    const commDate = document.getElementById('comm-date-input').value || nowDatetime();
    const text = document.getElementById('comm-text-input').value.trim();
    const contactNames = document.getElementById('comm-contacts-input').value
        .split(',').map(s => s.trim()).filter(Boolean);

    const taggedContacts = contactNames.map(name => {
        const c = contacts.find(c => c.name.toLowerCase() === name.toLowerCase());
        return c ? c.id : null;
    }).filter(Boolean);

    const comm = {
        id: 'comm' + Date.now(),
        date: commDate,
        type: 'Communication',
        commType: commType,
        text: `[${commType}] ${text}`,
        community: communityId,
        taggedContacts: taggedContacts,
        taggedCommunities: [communityId],
    };

    comms.push(comm);
    persist();
    closeModal('modal-comm');

    if (currentCommunity) showCommunity(currentCommunity);
}

// ===== TIMELINE RENDERER =====
function renderTimeline(containerId, items) {
    const container = document.getElementById(containerId);
    if (!items.length) {
        container.innerHTML = '<div class="empty-state">No history yet.</div>';
        return;
    }

    items.sort((a, b) => b.date.localeCompare(a.date));

    container.innerHTML = items.map(item => {
        const typeClass = getTimelineTypeClass(item.type);
        const tags = buildTagsHTML(item);
        const hasFullBody = item.fullBody;
        const expandable = hasFullBody ? `onclick="this.querySelector('.timeline-text-full').classList.toggle('open')" style="cursor:pointer"` : '';

        const additionalInfoHtml = item.additionalInfo
            ? `<div class="timeline-additional-info"><em>${highlightMentions(item.additionalInfo)}</em></div>`
            : '';

        return `
            <div class="timeline-item ${typeClass}" ${expandable}>
                <div class="timeline-date">${formatDate(item.date)}</div>
                <div class="timeline-type">${item.commType || item.type}</div>
                <div class="timeline-text">${highlightMentions(item.text)}${hasFullBody ? ' <small style="color:#2563eb">(click to expand)</small>' : ''}</div>
                ${additionalInfoHtml}
                ${hasFullBody ? `<div class="timeline-text-full">${item.fullBody}</div>` : ''}
                ${tags ? `<div class="timeline-tags">${tags}</div>` : ''}
            </div>
        `;
    }).join('');
}

function getTimelineTypeClass(type) {
    const map = {
        'Audit': 'type-audit',
        'Movement': 'type-movement',
        'Issue': 'type-issue',
        'Communication': 'type-comm',
        'Status Change': 'type-status',
        'Info Edit': 'type-edit',
    };
    return map[type] || '';
}

function buildTagsHTML(item) {
    let tags = '';
    if (item.taggedSensors) {
        tags += item.taggedSensors.map(s =>
            `<span class="tag tag-sensor" onclick="event.stopPropagation(); showSensorDetail('${s}')">${s}</span>`
        ).join('');
    }
    if (item.taggedCommunities) {
        tags += item.taggedCommunities.map(c =>
            `<span class="tag tag-community" onclick="event.stopPropagation(); showCommunity('${c}')">${getCommunityName(c)}</span>`
        ).join('');
    }
    if (item.taggedContacts) {
        tags += item.taggedContacts.map(cId => {
            const contact = contacts.find(x => x.id === cId);
            return contact ? `<span class="tag tag-contact" onclick="event.stopPropagation(); showContactDetail('${cId}')">${contact.name}</span>` : '';
        }).join('');
    }
    return tags;
}

function highlightMentions(text) {
    return text.replace(/@([\w\s]+?)(?=\.|,|$|@)/g, '<strong style="color:#6c3483">@$1</strong>');
}

function nowDatetime() {
    const now = new Date();
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    // Handle both "2026-03-14" and "2026-03-14T10:30" formats
    const hasTime = dateStr.includes('T') && dateStr.split('T')[1];
    let d;
    if (hasTime) {
        d = new Date(dateStr);
    } else {
        d = new Date(dateStr + 'T00:00:00');
    }
    const datePart = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    if (hasTime) {
        const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${datePart} at ${timePart}`;
    }
    return datePart;
}

// ===== @ MENTION AUTOCOMPLETE =====
function setupMentionAutocomplete(textarea, dropdown) {
    let mentionStart = -1;

    textarea.addEventListener('input', function() {
        const val = this.value;
        const cursorPos = this.selectionStart;

        // Find the last @ before the cursor
        const beforeCursor = val.substring(0, cursorPos);
        const atIndex = beforeCursor.lastIndexOf('@');

        if (atIndex >= 0) {
            const afterAt = beforeCursor.substring(atIndex + 1);
            // Only show dropdown if no newline between @ and cursor
            if (!afterAt.includes('\n')) {
                mentionStart = atIndex;
                const query = afterAt.toLowerCase();
                const matches = contacts.filter(c =>
                    c.name.toLowerCase().includes(query)
                );

                if (matches.length > 0 && query.length > 0) {
                    dropdown.innerHTML = matches.map((c, i) =>
                        `<div class="mention-option${i === 0 ? ' selected' : ''}" data-name="${c.name}" data-community="${getCommunityName(c.community)}">
                            <span>${c.name}</span>
                            <span class="mention-community">${getCommunityName(c.community)}</span>
                        </div>`
                    ).join('');
                    dropdown.classList.add('visible');

                    dropdown.querySelectorAll('.mention-option').forEach(opt => {
                        opt.addEventListener('mousedown', function(e) {
                            e.preventDefault();
                            insertMention(textarea, dropdown, mentionStart, this.dataset.name);
                        });
                    });
                    return;
                }
            }
        }

        dropdown.classList.remove('visible');
    });

    textarea.addEventListener('keydown', function(e) {
        if (!dropdown.classList.contains('visible')) return;

        const options = dropdown.querySelectorAll('.mention-option');
        const selected = dropdown.querySelector('.mention-option.selected');
        let selectedIndex = Array.from(options).indexOf(selected);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selectedIndex < options.length - 1) {
                options[selectedIndex]?.classList.remove('selected');
                options[selectedIndex + 1]?.classList.add('selected');
                options[selectedIndex + 1]?.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selectedIndex > 0) {
                options[selectedIndex]?.classList.remove('selected');
                options[selectedIndex - 1]?.classList.add('selected');
                options[selectedIndex - 1]?.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (selected) {
                e.preventDefault();
                insertMention(textarea, dropdown, mentionStart, selected.dataset.name);
            }
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('visible');
        }
    });

    textarea.addEventListener('blur', function() {
        setTimeout(() => dropdown.classList.remove('visible'), 200);
    });
}

function insertMention(textarea, dropdown, startPos, name) {
    const before = textarea.value.substring(0, startPos);
    const after = textarea.value.substring(textarea.selectionStart);
    textarea.value = before + '@' + name + ' ' + after;
    const newPos = startPos + name.length + 2;
    textarea.setSelectionRange(newPos, newPos);
    textarea.focus();
    dropdown.classList.remove('visible');
}

// ===== HELPER: Parse @mentions from text =====
function parseMentionedContacts(text) {
    const mentioned = [];
    const mentionRegex = /@([\w\s]+?)(?=\.|,|$|@)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const contact = contacts.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (contact && !mentioned.includes(contact.id)) mentioned.push(contact.id);
    }
    return mentioned;
}

function filterSensorHistory() {
    if (!currentSensor) return;
    const filterVal = document.getElementById('sensor-history-filter')?.value || '';

    let sensorNotes = notes.filter(n => n.taggedSensors && n.taggedSensors.includes(currentSensor));

    if (filterVal) {
        sensorNotes = sensorNotes.filter(n => n.type === filterVal);
    }

    renderTimeline('sensor-history-timeline', sensorNotes);
}

// ===== INLINE COMMUNITY CHANGE (sensor detail) =====
function openInlineCommunityChange(sensorId) {
    // Reuse the move sensor modal
    openMoveSensorModal(sensorId);
}

// ===== TAG-CHIP INPUTS (Facebook Marketplace style) =====
function setupTagChipInput(containerId, getOptions, getLabel) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chips = container.querySelector('.tag-chips');
    const input = container.querySelector('.tag-chip-input');
    const dropdown = container.querySelector('.tag-chip-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        if (query.length === 0) {
            dropdown.classList.remove('visible');
            return;
        }

        const currentTags = getChipValues(containerId);
        const options = getOptions().filter(opt =>
            getLabel(opt).toLowerCase().includes(query) &&
            !currentTags.includes(getLabel(opt))
        );

        if (options.length > 0) {
            dropdown.innerHTML = options.map((opt, i) =>
                `<div class="mention-option${i === 0 ? ' selected' : ''}" data-value="${getLabel(opt)}">
                    <span>${getLabel(opt)}</span>
                </div>`
            ).join('');
            dropdown.classList.add('visible');

            dropdown.querySelectorAll('.mention-option').forEach(opt => {
                opt.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    addChip(containerId, this.dataset.value);
                    input.value = '';
                    dropdown.classList.remove('visible');
                    input.focus();
                });
            });
        } else {
            dropdown.classList.remove('visible');
        }
    });

    input.addEventListener('keydown', function(e) {
        if (dropdown.classList.contains('visible')) {
            const options = dropdown.querySelectorAll('.mention-option');
            const selected = dropdown.querySelector('.mention-option.selected');
            let idx = Array.from(options).indexOf(selected);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (idx < options.length - 1) {
                    options[idx]?.classList.remove('selected');
                    options[idx + 1]?.classList.add('selected');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx > 0) {
                    options[idx]?.classList.remove('selected');
                    options[idx - 1]?.classList.add('selected');
                }
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (selected) {
                    e.preventDefault();
                    addChip(containerId, selected.dataset.value);
                    input.value = '';
                    dropdown.classList.remove('visible');
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('visible');
            }
        }

        // Backspace to remove last chip
        if (e.key === 'Backspace' && input.value === '') {
            const lastChip = chips.querySelector('.tag-chip:last-of-type');
            if (lastChip) lastChip.remove();
        }
    });

    input.addEventListener('blur', function() {
        setTimeout(() => dropdown.classList.remove('visible'), 200);
    });
}

function addChip(containerId, value) {
    const container = document.getElementById(containerId);
    const chips = container.querySelector('.tag-chips');
    const input = container.querySelector('.tag-chip-input');

    // Don't add duplicates
    const existing = chips.querySelectorAll('.tag-chip');
    for (const chip of existing) {
        if (chip.dataset.value === value) return;
    }

    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.dataset.value = value;
    chip.innerHTML = `${value} <span class="tag-chip-remove" onclick="this.parentElement.remove()">&times;</span>`;
    chips.insertBefore(chip, input);
}

function getChipValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.tag-chip')).map(c => c.dataset.value);
}

function prefillChip(containerId, value) {
    if (value) addChip(containerId, value);
}

// ===== TABS =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab')) {
        const tabId = e.target.dataset.tab;
        const container = e.target.closest('.view');

        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        container.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');
    }
});

function resetTabs(container) {
    const tabs = container.querySelectorAll('.tab');
    const contents = container.querySelectorAll('.tab-content');
    tabs.forEach((t, i) => t.classList.toggle('active', i === 0));
    contents.forEach((c, i) => c.classList.toggle('active', i === 0));
}

// ===== MODALS =====
function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });
});

// ===== HELPERS =====
function populateCommunitySelect(selectId) {
    const select = document.getElementById(selectId);
    const currentVal = select.value;
    select.innerHTML = '<option value="">— Select —</option>' +
        COMMUNITIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (currentVal) select.value = currentVal;
}

// ===== INIT =====
buildSidebar();
showView('dashboard');

// Set up all mention autocomplete textareas
document.addEventListener('DOMContentLoaded', () => {
    const pairs = [
        ['note-text-input', 'note-mention-dropdown'],
        ['move-additional-info', 'move-mention-dropdown'],
        ['status-change-info', 'status-mention-dropdown'],
        ['comm-text-input', 'comm-mention-dropdown'],
    ];
    pairs.forEach(([textareaId, dropdownId]) => {
        const ta = document.getElementById(textareaId);
        const dd = document.getElementById(dropdownId);
        if (ta && dd) setupMentionAutocomplete(ta, dd);
    });
});

// Fallback: if DOMContentLoaded already fired
if (document.readyState !== 'loading') {
    const pairs = [
        ['note-text-input', 'note-mention-dropdown'],
        ['move-additional-info', 'move-mention-dropdown'],
        ['status-change-info', 'status-mention-dropdown'],
        ['comm-text-input', 'comm-mention-dropdown'],
    ];
    pairs.forEach(([textareaId, dropdownId]) => {
        const ta = document.getElementById(textareaId);
        const dd = document.getElementById(dropdownId);
        if (ta && dd) setupMentionAutocomplete(ta, dd);
    });
}

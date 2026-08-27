// Simple data storage using localStorage
const DB = {
    get(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// Current user state
let currentUser = null;
let currentMonth = new Date().toISOString().slice(0, 7);

// Login function
function loginAs(role) {
    if (role === 'admin') {
        currentUser = {
            id: 'admin1',
            name: 'Abraham',
            role: 'admin',
            weeklySessions: 0,
            points: 0,
            email: 'abrahamsosu16@gmail.com'
        };
    } else {
        currentUser = {
            id: 'client1',
            name: 'Mohammed',
            role: 'client',
            weeklySessions: 3,
            points: 0,
            email: 'mohammed@test.com'
        };
    }
    
    // Save to localStorage
    localStorage.setItem('dps_current_user', JSON.stringify(currentUser));
    
    // Show main app
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    // Initialize the app
    initializeApp();
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('dps_current_user');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

// Initialize app
function initializeApp() {
    // Set welcome name
    document.getElementById('welcomeName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Admin' : 'Client';
    document.getElementById('weeklySessions').textContent = currentUser.weeklySessions;
    document.getElementById('userPoints').textContent = currentUser.points;
    
    // Show/hide admin features
    const isAdmin = currentUser.role === 'admin';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });
    
    // Set minimum booking date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('bookingDate').min = tomorrow.toISOString().split('T')[0];
    
    // Set current month
    document.getElementById('monthPicker').value = currentMonth;
    document.getElementById('bookingsMonthFilter').value = currentMonth;
    document.getElementById('matchesMonthFilter').value = currentMonth;
    document.getElementById('adminBookingsMonth').value = currentMonth;
    document.getElementById('adminAttendanceMonth').value = currentMonth;
    document.getElementById('dailyMatchesMonth').value = currentMonth;
    
    // Load initial data
    loadAttendance();
    loadUpcomingSessions();
    loadDashboardAnnouncements();
    loadBookings();
    loadAnnouncements();
    loadMatches();
    loadMessages();
    
    if (isAdmin) {
        loadAdminData();
    }
}

// Navigation function
function navigateTo(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewName);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    
    // Load view-specific data
    if (viewName === 'dashboard') {
        loadAttendance();
        loadUpcomingSessions();
        loadDashboardAnnouncements();
    }
    if (viewName === 'bookings') loadBookings();
    if (viewName === 'announcements') loadAnnouncements();
    if (viewName === 'matches') loadMatches();
    if (viewName === 'messages') loadMessages();
    if (viewName === 'adminPanel' && currentUser.role === 'admin') loadAdminData();
}

// Load attendance
function loadAttendance() {
    const attendance = DB.get('dps_attendance');
    const key = `${currentUser.id}_${currentMonth}`;
    const monthData = attendance[key];
    
    const grid = document.getElementById('attendanceGrid');
    
    if (!monthData) {
        // Initialize empty attendance for the month
        const daysInMonth = new Date(
            parseInt(currentMonth.slice(0, 4)),
            parseInt(currentMonth.slice(5, 7)),
            0
        ).getDate();
        
        const sessions = new Array(daysInMonth).fill(false);
        attendance[key] = { sessions: sessions };
        DB.set('dps_attendance', attendance);
        
        renderAttendanceGrid(sessions);
    } else {
        renderAttendanceGrid(monthData.sessions);
    }
}

function renderAttendanceGrid(sessions) {
    const grid = document.getElementById('attendanceGrid');
    grid.innerHTML = '';
    
    const today = new Date();
    const currentDay = today.getDate();
    const isCurrentMonth = currentMonth === today.toISOString().slice(0, 7);
    
    sessions.forEach((attended, index) => {
        const day = index + 1;
        const circle = document.createElement('div');
        circle.className = 'attendance-circle';
        
        if (attended) {
            circle.classList.add('attended');
            circle.textContent = day;
        } else {
            circle.classList.add('missed');
            circle.textContent = day;
        }
        
        circle.title = `Day ${day}${attended ? ' - Attended' : ' - Not Attended'}`;
        grid.appendChild(circle);
    });
}

function changeMonth(delta) {
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() + delta);
    currentMonth = date.toISOString().slice(0, 7);
    document.getElementById('monthPicker').value = currentMonth;
    loadAttendance();
}

function updateMonth(value) {
    currentMonth = value;
    loadAttendance();
}

function copyAttendance() {
    const attendance = DB.get('dps_attendance');
    const key = `${currentUser.id}_${currentMonth}`;
    const monthData = attendance[key];
    
    if (monthData) {
        const sessions = monthData.sessions;
        const attended = sessions.filter(s => s).length;
        const text = `Attendance Report - ${currentMonth}\nUser: ${currentUser.name}\nAttended: ${attended}/${sessions.length} sessions`;
        
        navigator.clipboard.writeText(text).then(() => {
            alert('Attendance copied to clipboard!');
        });
    } else {
        alert('No attendance data for this month');
    }
}

// Load upcoming sessions
function loadUpcomingSessions() {
    const bookings = DB.get('dps_bookings');
    const today = new Date().toISOString().split('T')[0];
    
    const upcoming = bookings
        .filter(b => b.userId === currentUser.id && b.status === 'booked' && b.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
    
    const list = document.getElementById('upcomingSessionsList');
    
    if (upcoming.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No upcoming sessions</p>';
        return;
    }
    
    list.innerHTML = upcoming.map(booking => `
        <div class="booking-card">
            <p><strong>${booking.programType}</strong></p>
            <p>Date: ${booking.date}</p>
            <span class="badge badge-booked">Booked</span>
        </div>
    `).join('');
}

// Load dashboard announcements
function loadDashboardAnnouncements() {
    const announcements = DB.get('dps_announcements');
    const sorted = announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    
    const list = document.getElementById('dashboardAnnouncements');
    
    if (sorted.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No announcements</p>';
        return;
    }
    
    list.innerHTML = sorted.map(announcement => `
        <div class="announcement-card">
            <h4>${announcement.title}</h4>
            <p>${announcement.body}</p>
            <small style="color: #A0A0A0;">${new Date(announcement.createdAt).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// Load all announcements
function loadAnnouncements() {
    const announcements = DB.get('dps_announcements');
    const sorted = announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const list = document.getElementById('announcementsList');
    
    if (sorted.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No announcements</p>';
        return;
    }
    
    list.innerHTML = sorted.map(announcement => `
        <div class="announcement-card">
            <h3>${announcement.title}</h3>
            <p>${announcement.body}</p>
            <small style="color: #A0A0A0;">${new Date(announcement.createdAt).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// Load bookings
function loadBookings() {
    const bookings = DB.get('dps_bookings');
    const selectedMonth = document.getElementById('bookingsMonthFilter').value;
    
    const userBookings = bookings
        .filter(b => b.userId === currentUser.id)
        .filter(b => !selectedMonth || b.date.startsWith(selectedMonth))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const list = document.getElementById('bookingsList');
    
    if (userBookings.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No bookings found</p>';
        return;
    }
    
    list.innerHTML = userBookings.map(booking => {
        const statusClass = {
            'booked': 'badge-booked',
            'attended': 'badge-attended',
            'cancelled': 'badge-cancelled'
        }[booking.status] || 'badge-booked';
        
        return `
            <div class="booking-card">
                <div class="booking-header">
                    <span class="badge ${statusClass}">${booking.status}</span>
                    <small>${booking.date}</small>
                </div>
                <p><strong>${booking.programType}</strong></p>
                <p>${booking.groupSession ? 'Group Session' : 'Private Session'}</p>
                ${booking.status === 'booked' ? 
                    `<button class="btn-danger" onclick="cancelBooking('${booking.id}')">Cancel Booking</button>` : ''}
            </div>
        `;
    }).join('');
}

function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    const bookings = DB.get('dps_bookings');
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'cancelled';
        DB.set('dps_bookings', bookings);
        loadBookings();
        loadUpcomingSessions();
        alert('Booking cancelled');
    }
}

function copyBookings() {
    const bookings = DB.get('dps_bookings');
    const userBookings = bookings.filter(b => b.userId === currentUser.id);
    
    let text = `My Bookings\n\n`;
    userBookings.forEach(booking => {
        text += `${booking.date} - ${booking.programType} - ${booking.status}\n`;
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Bookings copied to clipboard!');
    });
}

// Load matches
function loadMatches() {
    const matches = DB.get('dps_matches');
    const selectedMonth = document.getElementById('matchesMonthFilter').value;
    
    const filtered = matches
        .filter(m => !selectedMonth || m.month === selectedMonth)
        .sort((a, b) => b.date.localeCompare(a.date));
    
    const list = document.getElementById('matchesList');
    
    if (filtered.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No matches found</p>';
        return;
    }
    
    list.innerHTML = filtered.map(match => {
        const hasScore = match.score && match.score !== 'Upcoming';
        return `
            <div class="match-card">
                <div class="match-header">
                    <span class="badge ${hasScore ? 'badge-attended' : 'badge-booked'}">
                        ${hasScore ? 'Completed' : 'Upcoming'}
                    </span>
                    <small>${match.date}</small>
                </div>
                <p><strong>${match.category}</strong></p>
                <p>${match.players}</p>
                ${hasScore ? `<p>Score: ${match.score}</p>` : ''}
            </div>
        `;
    }).join('');
}

function copyMatches() {
    const matches = DB.get('dps_matches');
    const selectedMonth = document.getElementById('matchesMonthFilter').value;
    
    let text = `Matches - ${selectedMonth}\n\n`;
    matches.filter(m => m.month === selectedMonth).forEach(match => {
        text += `${match.date} - ${match.category}\n${match.players}\n`;
        if (match.score && match.score !== 'Upcoming') {
            text += `Score: ${match.score}\n`;
        }
        text += '---\n';
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Matches copied to clipboard!');
    });
}

// Load messages
function loadMessages() {
    const messages = DB.get('dps_messages');
    const chatMessages = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<p style="text-align: center; color: #A0A0A0;">No messages yet. Start the conversation!</p>';
        return;
    }
    
    chatMessages.innerHTML = messages.map(message => {
        const isSent = message.userId === currentUser.id;
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-sender">${message.senderName}</div>
                <div>${message.text}</div>
                <div class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</div>
                ${currentUser.role === 'admin' ? 
                    `<button class="btn-danger" onclick="deleteMessage('${message.id}')" style="margin-top: 5px; font-size: 0.7rem; padding: 4px 8px;">Delete</button>` : ''}
            </div>
        `;
    }).join('');
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const messages = DB.get('dps_messages');
    messages.push({
        id: 'msg_' + Date.now(),
        userId: currentUser.id,
        senderName: currentUser.name,
        text: text,
        createdAt: new Date().toISOString()
    });
    
    DB.set('dps_messages', messages);
    input.value = '';
    loadMessages();
}

function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;
    
    const messages = DB.get('dps_messages');
    DB.set('dps_messages', messages.filter(m => m.id !== messageId));
    loadMessages();
}

// Booking function
function confirmBooking() {
    const date = document.getElementById('bookingDate').value;
    const programType = document.getElementById('programType').value;
    
    if (!date || !programType) {
        alert('Please select date and program type');
        return;
    }
    
    if (!confirm('Cancellation Policy: Cancellations must be made at least 1 hour before the session. Do you agree?')) {
        return;
    }
    
    const bookings = DB.get('dps_bookings');
    bookings.push({
        id: 'booking_' + Date.now(),
        userId: currentUser.id,
        clientName: currentUser.name,
        programType: programType,
        date: date,
        groupSession: programType === 'Group Lesson' || programType === 'Kids Training',
        status: 'booked',
        createdAt: new Date().toISOString()
    });
    
    DB.set('dps_bookings', bookings);
    
    alert('Booking confirmed!');
    document.getElementById('bookingDate').value = '';
    document.getElementById('programType').value = '';
    loadBookings();
    loadUpcomingSessions();
}

// Admin functions
function switchAdminTab(tabName, element) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const tabMap = {
        'bookings': 'adminBookings',
        'attendance': 'adminAttendance',
        'announcements': 'adminAnnouncements',
        'users': 'adminUsers',
        'reviews': 'adminReviews',
        'dailyMatches': 'adminDailyMatches'
    };
    
    document.getElementById(tabMap[tabName]).classList.add('active');
    element.classList.add('active');
}

function loadAdminData() {
    loadAdminBookings();
    loadAdminAttendance();
    loadAdminAnnouncements();
    loadUsers();
    loadReviews();
    loadDailyMatches();
}

function loadAdminBookings() {
    const bookings = DB.get('dps_bookings');
    const selectedMonth = document.getElementById('adminBookingsMonth').value;
    
    const filtered = bookings.filter(b => !selectedMonth || b.date.startsWith(selectedMonth));
    
    const list = document.getElementById('adminBookingsList');
    
    if (filtered.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No bookings found</p>';
        return;
    }
    
    list.innerHTML = filtered.map(booking => {
        const statusClass = {
            'booked': 'badge-booked',
            'attended': 'badge-attended',
            'cancelled': 'badge-cancelled'
        }[booking.status] || 'badge-booked';
        
        return `
            <div class="booking-card">
                <div class="booking-header">
                    <span class="badge ${statusClass}">${booking.status}</span>
                    <small>${booking.date}</small>
                </div>
                <p><strong>${booking.clientName}</strong></p>
                <p>${booking.programType}</p>
                ${booking.status === 'booked' ? 
                    `<button class="btn-primary" onclick="markAttended('${booking.id}')">Mark Attended</button>` : ''}
            </div>
        `;
    }).join('');
}

function markAttended(bookingId) {
    if (!confirm('Mark this booking as attended?')) return;
    
    const bookings = DB.get('dps_bookings');
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'attended';
        DB.set('dps_bookings', bookings);
        loadAdminBookings();
        alert('Marked as attended');
    }
}

function copyAdminBookings() {
    const bookings = DB.get('dps_bookings');
    
    let text = `All Bookings\n\n`;
    bookings.forEach(booking => {
        text += `${booking.date} - ${booking.clientName} - ${booking.programType} - ${booking.status}\n`;
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Bookings copied to clipboard!');
    });
}

function loadAdminAttendance() {
    const users = [
        { id: 'client1', name: 'Mohammed' }
    ];
    const attendance = DB.get('dps_attendance');
    const selectedMonth = document.getElementById('adminAttendanceMonth').value;
    
    const list = document.getElementById('adminAttendanceList');
    
    list.innerHTML = users.map(user => {
        const key = `${user.id}_${selectedMonth}`;
        const monthData = attendance[key];
        
        if (monthData) {
            const sessions = monthData.sessions;
            const attended = sessions.filter(s => s).length;
            
            return `
                <div class="card">
                    <h4>${user.name}</h4>
                    <p>Attended: ${attended}/${sessions.length} sessions</p>
                    <div class="attendance-grid" style="margin-top: 10px;">
                        ${sessions.map((attended, index) => `
                            <div class="attendance-circle ${attended ? 'attended' : 'missed'}" 
                                 style="cursor: pointer;"
                                 onclick="toggleAttendance('${user.id}', ${index}, ${attended})"
                                 title="Day ${index + 1}">
                                ${index + 1}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="card">
                    <h4>${user.name}</h4>
                    <p>No attendance record</p>
                </div>
            `;
        }
    }).join('');
}

function toggleAttendance(userId, dayIndex, currentValue) {
    const attendance = DB.get('dps_attendance');
    const selectedMonth = document.getElementById('adminAttendanceMonth').value;
    const key = `${userId}_${selectedMonth}`;
    
    if (attendance[key]) {
        attendance[key].sessions[dayIndex] = !currentValue;
        DB.set('dps_attendance', attendance);
        loadAdminAttendance();
    }
}

function copyAdminAttendance() {
    const attendance = DB.get('dps_attendance');
    const selectedMonth = document.getElementById('adminAttendanceMonth').value;
    
    let text = `Attendance Report - ${selectedMonth}\n\n`;
    
    const users = [{ id: 'client1', name: 'Mohammed' }];
    users.forEach(user => {
        const key = `${user.id}_${selectedMonth}`;
        const monthData = attendance[key];
        
        if (monthData) {
            const sessions = monthData.sessions;
            const attended = sessions.filter(s => s).length;
            text += `${user.name}: ${attended}/${sessions.length} sessions\n`;
        }
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Attendance copied to clipboard!');
    });
}

function loadAdminAnnouncements() {
    const announcements = DB.get('dps_announcements');
    const list = document.getElementById('adminAnnouncementsList');
    
    if (announcements.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No announcements</p>';
        return;
    }
    
    list.innerHTML = announcements.map(announcement => `
        <div class="announcement-card">
            <h4>${announcement.title}</h4>
            <p>${announcement.body}</p>
            <small style="color: #A0A0A0;">${new Date(announcement.createdAt).toLocaleDateString()}</small>
            <br>
            <button class="btn-danger" onclick="deleteAnnouncement('${announcement.id}')" style="margin-top: 10px;">Delete</button>
        </div>
    `).join('');
}

function createAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const body = document.getElementById('announcementBody').value.trim();
    
    if (!title || !body) {
        alert('Please enter title and body');
        return;
    }
    
    const announcements = DB.get('dps_announcements');
    announcements.push({
        id: 'announcement_' + Date.now(),
        title: title,
        body: body,
        createdAt: new Date().toISOString()
    });
    
    DB.set('dps_announcements', announcements);
    
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementBody').value = '';
    loadAdminAnnouncements();
    loadAnnouncements();
    loadDashboardAnnouncements();
    alert('Announcement posted!');
}

function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    
    const announcements = DB.get('dps_announcements');
    DB.set('dps_announcements', announcements.filter(a => a.id !== id));
    loadAdminAnnouncements();
    loadAnnouncements();
    loadDashboardAnnouncements();
    alert('Announcement deleted');
}

function loadUsers() {
    const users = [
        { name: 'Abraham', email: 'abrahamsosu16@gmail.com', role: 'Admin', gender: 'Male', weeklySessions: 0, points: 0 },
        { name: 'Mohammed', email: 'mohammed@test.com', role: 'Client', gender: 'Male', weeklySessions: 3, points: 0 }
    ];
    
    const list = document.getElementById('usersList');
    list.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Gender</th>
                        <th>Weekly Sessions</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>${user.gender}</td>
                            <td>${user.weeklySessions}</td>
                            <td>${user.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function loadReviews() {
    const reviews = DB.get('dps_reviews');
    const list = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No reviews yet</p>';
        return;
    }
    
    list.innerHTML = reviews.map(review => `
        <div class="card">
            <h4>${review.userName}</h4>
            <p>Rating: ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
            <p>${review.comment}</p>
            <small style="color: #A0A0A0;">${new Date(review.createdAt).toLocaleDateString()}</small>
        </div>
    `).join('');
}

function loadDailyMatches() {
    const matches = DB.get('dps_matches');
    const selectedMonth = document.getElementById('dailyMatchesMonth').value;
    
    const filtered = matches.filter(m => !selectedMonth || m.month === selectedMonth);
    
    const list = document.getElementById('dailyMatchesList');
    
    if (filtered.length === 0) {
        list.innerHTML = '<p style="color: #A0A0A0;">No matches</p>';
        return;
    }
    
    list.innerHTML = filtered.map(match => `
        <div class="match-card">
            <p><strong>${match.date}</strong> - ${match.category}</p>
            <p>${match.players}</p>
            ${match.score ? `<p>Score: ${match.score}</p>` : ''}
            <button class="btn-danger" onclick="deleteMatch('${match.id}')" style="margin-top: 10px;">Delete</button>
        </div>
    `).join('');
}

function addMatch() {
    const date = document.getElementById('matchDate').value;
    const category = document.getElementById('matchCategory').value;
    const players = document.getElementById('matchPlayers').value.trim();
    const score = document.getElementById('matchScore').value.trim();
    
    if (!date || !players) {
        alert('Please fill in date and players');
        return;
    }
    
    const matches = DB.get('dps_matches');
    matches.push({
        id: 'match_' + Date.now(),
        date: date,
        month: date.slice(0, 7),
        category: category,
        players: players,
        score: score || 'Upcoming',
        createdAt: new Date().toISOString()
    });
    
    DB.set('dps_matches', matches);
    
    document.getElementById('matchDate').value = '';
    document.getElementById('matchPlayers').value = '';
    document.getElementById('matchScore').value = '';
    loadDailyMatches();
    loadMatches();
    alert('Match added!');
}

function deleteMatch(id) {
    if (!confirm('Delete this match?')) return;
    
    const matches = DB.get('dps_matches');
    DB.set('dps_matches', matches.filter(m => m.id !== id));
    loadDailyMatches();
    loadMatches();
}

function copyDailyMatches() {
    const matches = DB.get('dps_matches');
    const selectedMonth = document.getElementById('dailyMatchesMonth').value;
    
    let text = `Daily Matches - ${selectedMonth}\n\n`;
    matches.filter(m => m.month === selectedMonth).forEach(match => {
        text += `${match.date} - ${match.category}\n${match.players}\n`;
        if (match.score && match.score !== 'Upcoming') {
            text += `Score: ${match.score}\n`;
        }
        text += '---\n';
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Matches copied to clipboard!');
    });
}

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('dps_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        initializeApp();
    }
});

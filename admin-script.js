// ============================================
// ADMIN PANEL SCRIPT - COMPLETE
// ============================================

// ===== ADMIN LOGIN =====
function adminLogin() {
    var name = document.getElementById('adminName').value.trim();
    var securityCode = document.getElementById('adminSecurityCode').value.trim();

    var errorDiv = document.getElementById('adminLoginError');

    if (name === ADMIN_NAME && securityCode === ADMIN_SECURITY_CODE) {
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        errorDiv.style.display = 'none';
    } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent = '❌ Invalid Admin Name or Security Code';
    }
}

// ===== FAKE DATA FOR TRAFFIC =====
function getTrafficData(type) {
    var data = {
        'month': '48,763',
        'pastMonth': '1,13,987',
        'threeMonth': '4,96,989',
        'avg': '6,053',
        'total': '6,59,739'
    };
    return data[type] || '0';
}

// ===== FAKE DATA FOR ADVERTISEMENT =====
function getAdData(type) {
    var data = {
        'contracts': '0',
        'opportunities': '4,982',
        'potential': '₹48,824/month',
        'requests': '5,698'
    };
    return data[type] || 'N/A';
}

// ===== TOGGLE TRAFFIC OPTIONS =====
function toggleTrafficOptions() {
    var options = document.getElementById('trafficOptions');
    options.classList.toggle('open');
}

// ===== TOGGLE AD OPTIONS =====
function toggleAdOptions() {
    var options = document.getElementById('adOptions');
    options.classList.toggle('open');
}

// ===== LOADING POPUP =====
function showLoadingPopup(label, type, dataKey, element) {
    // Store the element reference to update it later
    var targetElement = element;

    var popup = document.createElement('div');
    popup.className = 'loading-popup-overlay';
    popup.id = 'loadingPopup';
    popup.innerHTML = 
        '<div class="loading-popup-box">' +
            '<div class="loading-spinner"></div>' +
            '<div class="loading-text">Fetching Data From Source</div>' +
        '</div>';

    document.body.appendChild(popup);

    // Reduced delay: 7-10 seconds
    var delay = Math.floor(Math.random() * 3000) + 7000;
    setTimeout(function() {
        var popupElement = document.getElementById('loadingPopup');
        if (popupElement) {
            popupElement.style.opacity = '0';
            popupElement.style.transition = 'opacity 0.3s ease';
            setTimeout(function() {
                if (popupElement.parentNode) popupElement.remove();
                var resultValue = '';
                if (type === 'traffic') {
                    resultValue = getTrafficData(dataKey);
                } else if (type === 'ad') {
                    resultValue = getAdData(dataKey);
                }
                // Update the clicked option with the result
                if (targetElement) {
                    targetElement.innerHTML = resultValue;
                    targetElement.style.color = '#4caf50';
                }
                showResultPopup(label, resultValue);
            }, 300);
        }
    }, delay);
}

// ===== RESULT POPUP =====
function showResultPopup(label, value) {
    var popup = document.createElement('div');
    popup.className = 'loading-popup-overlay';
    popup.id = 'resultPopup';
    popup.innerHTML = 
        '<div class="loading-popup-box" style="border-color: rgba(76, 175, 80, 0.3);">' +
            '<div style="font-size:48px; margin-bottom:12px;">✅</div>' +
            '<div class="loading-text" style="color: #4caf50; font-size: 20px;">' + value + '</div>' +
            '<div style="font-size:13px; color: rgba(255,255,255,0.5); margin-top: 8px;">' + label + '</div>' +
            '<button class="result-popup-btn" onclick="closeResultPopup()">Got It</button>' +
        '</div>';

    document.body.appendChild(popup);
}

// ===== CLOSE RESULT POPUP =====
function closeResultPopup() {
    var popup = document.getElementById('resultPopup');
    if (popup) {
        popup.style.opacity = '0';
        popup.style.transition = 'opacity 0.3s ease';
        setTimeout(function() {
            if (popup.parentNode) popup.remove();
        }, 300);
    }
}

// ===== ADMIN LOGOUT =====
function adminLogout() {
    document.getElementById('adminLoginForm').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminName').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPhone').value = '';
    document.getElementById('adminIP').value = '';
    document.getElementById('adminSecurityCode').value = '';
    document.getElementById('adminLoginError').style.display = 'none';
}

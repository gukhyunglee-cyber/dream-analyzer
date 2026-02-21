// API Configuration
const API_URL = '/api';

// Get authentication token
function getToken() {
    return localStorage.getItem('token');
}

// Get user info
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth.html';
}

// Protected fetch with authentication
async function authenticatedFetch(url, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = '/auth.html';
        throw new Error('Not authenticated');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // If unauthorized, logout
    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expired');
    }

    return response;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format datetime for display
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading" style="height: 100px; border-radius: var(--radius-md);"></div>';
    }
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="card" style="background: rgba(255, 82, 82, 0.1); border-color: var(--color-error); color: var(--color-error);">
      <p>⚠️ ${message}</p>
    </div>`;
    }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered!', reg))
            .catch(err => console.error('SW registration failed!', err));
    });
}

// Setup Global Navigation & Profile Modal
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        const authSections = document.querySelectorAll('#nav-auth-section');
        authSections.forEach(section => {
            section.innerHTML = '<a href="/auth.html" class="navbar-link">로그인</a>';
        });
        return;
    }
    setupGlobalProfileNav();
});

async function setupGlobalProfileNav() {
    if (!document.getElementById('globalProfileModal')) {
        const modalHtml = `
        <div id="globalProfileModal" class="modal hidden">
            <div class="modal-content">
                <button class="modal-close" onclick="closeGlobalModals()">&times;</button>
                <h2 class="mb-md text-center">개인정보 수정</h2>
                <form id="globalProfileForm" onsubmit="handleGlobalProfileSubmit(event)">
                    <div class="avatar-preview-container" id="globalAvatarPreview" onclick="document.getElementById('globalProfileImageUpload').click()">
                        <span style="font-size: 2rem; color: rgba(255,255,255,0.3);" id="globalAvatarPlaceholder">👤</span>
                    </div>
                    <div class="text-center text-muted" style="font-size: 0.8rem; margin-bottom: 1rem;">클릭하여 프로필 사진 등록</div>
                    <input type="file" id="globalProfileImageUpload" accept="image/*" style="display: none;" onchange="previewGlobalAvatar(event)">

                    <div class="form-group mb-sm">
                        <label class="form-label" for="globalProfileNickname">별명 (게시판 표시용)</label>
                        <input type="text" id="globalProfileNickname" class="form-input" placeholder="새로운 별명을 입력하세요">
                    </div>

                    <div class="form-group mb-sm">
                        <label class="form-label" for="globalProfileEmail">이메일</label>
                        <input type="email" id="globalProfileEmail" class="form-input" placeholder="이메일 입력">
                    </div>

                    <div class="form-group mb-sm">
                        <label class="form-label" for="globalProfilePassword">새 비밀번호 (변경 원치 않음 시 빈칸 유지)</label>
                        <input type="password" id="globalProfilePassword" class="form-input" placeholder="새 비밀번호 입력 (선택)">
                    </div>

                    <div class="form-group mb-sm">
                        <label class="form-label" for="globalProfileBirthDate">생년월일</label>
                        <input type="date" id="globalProfileBirthDate" class="form-input">
                    </div>

                    <div class="form-group mb-lg">
                        <label class="form-label" for="globalProfileGender">성별</label>
                        <select id="globalProfileGender" class="form-select">
                            <option value="">선택 안함</option>
                            <option value="남성">남성</option>
                            <option value="여성">여성</option>
                            <option value="기타">기타</option>
                        </select>
                    </div>

                    <div id="globalProfileMessage" style="margin-bottom: 1rem; font-size: 0.9rem;"></div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;" id="btnUpdateGlobalProfile">프로필 수정 완료</button>
                </form>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    if (!window.globalProfileClickAttached) {
        document.addEventListener('click', () => {
            const menu = document.getElementById('global-nav-profile-menu');
            if (menu) menu.style.display = 'none';
        });
        window.globalProfileClickAttached = true;
    }

    try {
        const res = await authenticatedFetch('/api/auth/me');
        const user = await res.json();
        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(user));

            const avatarUrl = user.profile_image_url || '';
            let avatarContent = avatarUrl
                ? `<img src="${avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

            const profileHtml = `
            <div class="user-profile-widget" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; position: relative;" onclick="toggleGlobalProfileMenu(event)">
                <div style="width: 35px; height: 35px; border-radius: 50%; background-color: #ffd700; border: 2px solid var(--color-primary-light); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${avatarContent}
                </div>
                
                <div id="global-nav-profile-menu" style="display: none; position: absolute; top: 120%; right: 0; background: var(--color-surface); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 0.5rem 0; min-width: 150px; box-shadow: var(--shadow-md); z-index: 1000; text-align: left;">
                    <a href="#" onclick="openGlobalProfileModal(event)" style="display: block; padding: 0.5rem 1rem; color: var(--color-text); text-decoration: none; font-size: 0.9rem;">내정보</a>
                    <div style="height: 1px; background: var(--glass-border); margin: 0.25rem 0;"></div>
                    <a href="#" onclick="confirmGlobalLogout(event)" style="display: block; padding: 0.5rem 1rem; color: var(--color-error); text-decoration: none; font-size: 0.9rem;">로그아웃</a>
                </div>
            </div>
            `;

            const authSections = document.querySelectorAll('#nav-auth-section');
            authSections.forEach(section => {
                section.innerHTML = profileHtml;
            });
        }
    } catch (e) {
        console.error('Failed to load user for nav', e);
        const authSections = document.querySelectorAll('#nav-auth-section');
        authSections.forEach(section => {
            section.innerHTML = '<a href="#" class="navbar-link" onclick="confirmGlobalLogout(event)">로그아웃</a>';
        });
    }
}

function toggleGlobalProfileMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('global-nav-profile-menu');
    if (menu) {
        menu.style.display = (menu.style.display === 'none' || !menu.style.display) ? 'block' : 'none';

        document.querySelectorAll('[id^=nav-profile-menu]').forEach(m => {
            if (m !== menu) m.style.display = 'none';
        });
    }
}

function confirmGlobalLogout(e) {
    if (e) e.preventDefault();
    if (confirm('정말 로그아웃 하시겠습니까?')) {
        logout();
    }
}

function closeGlobalModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function openGlobalProfileModal(e) {
    if (e) e.preventDefault();
    closeGlobalModals();

    const user = getUser();
    if (user) {
        document.getElementById('globalProfileNickname').value = user.nickname || '';
        document.getElementById('globalProfileEmail').value = user.email || '';
        document.getElementById('globalProfileBirthDate').value = user.birth_date || '';
        document.getElementById('globalProfileGender').value = user.gender || '';

        const avatarPreview = document.getElementById('globalAvatarPreview');
        const placeholder = document.getElementById('globalAvatarPlaceholder');
        if (user.profile_image_url) {
            avatarPreview.style.backgroundImage = `url(${user.profile_image_url})`;
            if (placeholder) placeholder.style.display = 'none';
        } else {
            avatarPreview.style.backgroundImage = 'none';
            if (placeholder) placeholder.style.display = 'block';
        }
    }

    document.getElementById('globalProfileMessage').textContent = '';
    document.getElementById('globalProfileModal').classList.remove('hidden');
}

function previewGlobalAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('globalAvatarPreview');
            preview.style.backgroundImage = `url(${e.target.result})`;
            const ph = document.getElementById('globalAvatarPlaceholder');
            if (ph) ph.style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
}

async function handleGlobalProfileSubmit(event) {
    event.preventDefault();
    const nickname = document.getElementById('globalProfileNickname').value;
    const email = document.getElementById('globalProfileEmail').value;
    const password = document.getElementById('globalProfilePassword').value;
    const birth_date = document.getElementById('globalProfileBirthDate').value;
    const gender = document.getElementById('globalProfileGender').value;
    const imageFile = document.getElementById('globalProfileImageUpload').files[0];
    const msgDiv = document.getElementById('globalProfileMessage');

    msgDiv.textContent = '';
    msgDiv.style.color = 'var(--color-text-primary)';

    if (!nickname || nickname.trim() === '') {
        msgDiv.textContent = '별명을 입력해주세요.';
        msgDiv.style.color = 'var(--color-error)';
        return;
    }

    if (!email || email.trim() === '') {
        msgDiv.textContent = '이메일을 입력해주세요.';
        msgDiv.style.color = 'var(--color-error)';
        return;
    }

    const formData = new FormData();
    formData.append('nickname', nickname.trim());
    formData.append('email', email.trim());
    if (password && password.trim() !== '') formData.append('password', password);
    formData.append('birth_date', birth_date || '');
    formData.append('gender', gender || '');

    if (imageFile) {
        formData.append('profile_image', imageFile);
    }

    document.getElementById('btnUpdateGlobalProfile').disabled = true;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('user', JSON.stringify(data.user));

            msgDiv.textContent = '프로필이 성공적으로 수정되었습니다.';
            msgDiv.style.color = 'var(--color-success)';
            document.getElementById('globalProfilePassword').value = '';

            setupGlobalProfileNav();

            if (typeof updateUIAfterLoad === 'function') updateUIAfterLoad();

            setTimeout(closeGlobalModals, 1500);
        } else {
            const data = await res.json();
            msgDiv.textContent = data.error || '프로필 수정 실패';
            msgDiv.style.color = 'var(--color-error)';
        }
    } catch (e) {
        msgDiv.textContent = '서버 통신 오류가 발생했습니다.';
        msgDiv.style.color = 'var(--color-error)';
    } finally {
        document.getElementById('btnUpdateGlobalProfile').disabled = false;
    }
}

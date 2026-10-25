/* login.js - Sign in / Register (Firebase Authentication) */
let loginMode = 'signin';   // 'signin' | 'register' | 'reset'

function renderLogin(container) {
    const join = new URLSearchParams(location.search).get('join');
    if (join) sessionStorage.setItem('adnd2e_pendingJoin', join);
    const pendingJoin = sessionStorage.getItem('adnd2e_pendingJoin');
    const title = loginMode === 'register' ? 'Create Account' : loginMode === 'reset' ? 'Reset Password' : 'Sign In';

    container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="parchment scroll-border p-8 max-w-md w-full fade-in">
                <div class="mb-6 text-center">
                    <i class="fas fa-dragon text-6xl text-amber-700 mb-4"></i>
                    <h1 class="fantasy-font text-3xl font-bold text-amber-900 mb-2">AD&D 2nd Edition</h1>
                    <p class="text-amber-800 italic">Character Sheet Manager</p>
                </div>
                ${pendingJoin ? `<div class="mb-4 p-3 bg-green-50 border border-green-300 rounded text-sm text-green-800 text-center">
                    <i class="fas fa-envelope-open-text mr-1"></i>You've been invited to a campaign (code <b>${escapeHtml(pendingJoin)}</b>). Sign in or create an account to join.
                </div>` : ''}
                ${loginMode !== 'reset' ? `
                <div class="flex mb-5 border-b-2 border-amber-300">
                    <button class="tab-btn flex-1 ${loginMode === 'signin' ? 'active' : ''}" onclick="setLoginMode('signin')">Sign In</button>
                    <button class="tab-btn flex-1 ${loginMode === 'register' ? 'active' : ''}" onclick="setLoginMode('register')">Register</button>
                </div>` : `<h2 class="fantasy-font text-xl font-bold text-amber-900 mb-3 text-center">${title}</h2>`}
                <form id="authForm" class="space-y-4" onsubmit="event.preventDefault(); submitAuth();">
                    ${loginMode === 'register' ? `
                    <div>
                        <label class="block text-sm font-bold text-amber-900 mb-1" for="authName">Your name</label>
                        <input type="text" id="authName" autocomplete="name" placeholder="Shown to your party" maxlength="40" class="input-fantasy w-full px-4 py-3 text-lg" required>
                    </div>` : ''}
                    <div>
                        <label class="block text-sm font-bold text-amber-900 mb-1" for="authEmail">Email</label>
                        <input type="email" id="authEmail" autocomplete="email" placeholder="you@example.com" class="input-fantasy w-full px-4 py-3 text-lg" required>
                    </div>
                    ${loginMode !== 'reset' ? `
                    <div>
                        <label class="block text-sm font-bold text-amber-900 mb-1" for="authPassword">Password</label>
                        <input type="password" id="authPassword" autocomplete="${loginMode === 'register' ? 'new-password' : 'current-password'}" placeholder="${loginMode === 'register' ? 'At least 6 characters' : 'Your password'}" minlength="6" class="input-fantasy w-full px-4 py-3 text-lg" required>
                    </div>` : ''}
                    <p id="authError" class="text-sm text-red-700 hidden"></p>
                    <button type="submit" id="authSubmit" class="btn-fantasy w-full py-3 rounded-lg font-bold">
                        <i class="fas ${loginMode === 'register' ? 'fa-user-plus' : loginMode === 'reset' ? 'fa-paper-plane' : 'fa-sign-in-alt'} mr-2"></i>${loginMode === 'register' ? 'Create Account' : loginMode === 'reset' ? 'Send Reset Email' : 'Sign In'}
                    </button>
                </form>
                ${loginMode === 'signin' ? `<div class="text-right mt-2"><button class="text-sm text-amber-800 underline" onclick="setLoginMode('reset')">Forgot password?</button></div>` : ''}
                ${loginMode === 'reset' ? `<div class="text-center mt-3"><button class="text-sm text-amber-800 underline" onclick="setLoginMode('signin')">Back to sign in</button></div>` : ''}
                ${loginMode !== 'reset' ? `
                <div class="flex items-center gap-3 my-5"><div class="flex-1 border-t border-amber-300"></div><span class="text-xs text-amber-700 uppercase">or</span><div class="flex-1 border-t border-amber-300"></div></div>
                <button onclick="googleLogin()" id="googleBtn" class="w-full py-3 rounded-lg font-bold bg-white border-2 border-amber-700 text-gray-800 flex items-center justify-center gap-2 hover:bg-amber-50">
                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                    Continue with Google
                </button>` : ''}
                <div class="mt-6 text-xs text-amber-800 opacity-80 text-center">
                    <p><i class="fas fa-shield-alt mr-1"></i>Accounts are handled by Google Firebase. Your password is never stored by this app.</p>
                </div>
            </div>
        </div>
    `;
}

function setLoginMode(mode) {
    const email = document.getElementById('authEmail')?.value || '';
    loginMode = mode;
    renderLogin(document.getElementById('app'));
    if (email && document.getElementById('authEmail')) document.getElementById('authEmail').value = email;
}

function showAuthError(msg) {
    const el = document.getElementById('authError');
    if (!el) return toast(msg, 'error');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function setAuthBusy(busy) {
    document.querySelectorAll('#app button, #app input').forEach(el => { el.disabled = busy; });
}

async function submitAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword')?.value || '';
    const name = document.getElementById('authName')?.value.trim() || '';
    setAuthBusy(true);
    try {
        if (loginMode === 'reset') {
            await resetPassword(email);
            toast('Password reset email sent. Check your inbox.');
            loginMode = 'signin';
            renderLogin(document.getElementById('app'));
            document.getElementById('authEmail').value = email;
            return;
        }
        if (loginMode === 'register') {
            if (!name) throw { message: 'Please enter your name.' };
            await registerEmail(name, email, password);
            toast(`Welcome, ${name}! We sent you an email to confirm your address.`);
        } else {
            await signInEmail(email, password);
        }
        afterLogin();
    } catch (err) {
        showAuthError(authErrorMessage(err));
    } finally {
        setAuthBusy(false);
    }
}

async function googleLogin() {
    setAuthBusy(true);
    try {
        const res = await signInGoogle();
        if (res && res.user) afterLogin();
    } catch (err) {
        showAuthError(authErrorMessage(err));
    } finally {
        setAuthBusy(false);
    }
}

function afterLogin() {
    sessionStorage.setItem('adnd2e_justLoggedIn', '1');
    // The dashboard picks up the pending invite (if any) and loads everything
    const join = sessionStorage.getItem('adnd2e_pendingJoin');
    window.location.href = 'dashboard.html' + (join ? '?join=' + encodeURIComponent(join) : '');
}

function render() { renderLogin(document.getElementById('app')); }

/* Init */
initApp().then(() => {
    if (State.currentUser) afterLogin();
    else renderLogin(document.getElementById('app'));
});

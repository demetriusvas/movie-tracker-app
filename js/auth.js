// Verificar estado de autenticação
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // Usuário não está logado
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// Login com email e senha
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
});

// Login com Google
document.getElementById('googleLogin')?.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        await auth.signInWithPopup(provider);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Erro ao fazer login com Google: ' + error.message);
    }
});
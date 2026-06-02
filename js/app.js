// ==========================================
// 1. SISTEMA DE NAVEGAÇÃO DE PÁGINAS
// ==========================================

function showPage(pageId) {
    // Esconde todas as páginas que usam a classe '.page'
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Busca a página pelo ID
    const targetPage = document.getElementById(pageId);

    // PROTEÇÃO: Só tenta ativar se a página realmente existir no HTML
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error(`Erro: A página com o ID "${pageId}" não existe no seu HTML! Verifique se digitou o ID correto.`);
        alert(`Erro de navegação: A página "${pageId}" não foi encontrada.`);
    }
}

function switchSection(el, sectionId) {
    // Muda a aba ativa no menu lateral
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    el.classList.add('active');

    // Muda a seção de conteúdo principal ativa
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// ==========================================
// 2. SISTEMA DE CADASTRO (REGISTER)
// ==========================================

function handleRegister() {
    console.log("Processando tentativa de cadastro...");
    
    // Captura os dados dos campos do HTML
    const nome = document.getElementById('reg-name').value.trim();
    const turma = document.getElementById('reg-class').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const curso = document.getElementById('reg-course').value;
    const senha = document.getElementById('reg-password').value;
    const perfilOption = document.querySelector('input[name="role"]:checked');

    // Validação de seleção do Perfil (Aluno/Professor)
    if (!perfilOption) {
        alert("Por favor, selecione se você é Aluno ou Professor.");
        return;
    }
    const perfil = perfilOption.value;

    // Validação simples para não cadastrar campos vazios obrigatórios
    if (!nome || !email || !senha) {
        alert("Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Senha).");
        return;
    }

    // Pega a lista de usuários já cadastrados no localStorage (ou cria uma vazia se for o primeiro)
    let listaUsuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    // Verifica se o e-mail digitado já foi cadastrado antes por outra pessoa
    const emailExiste = listaUsuarios.some(user => user.email.toLowerCase() === email.toLowerCase());
    if (emailExiste) {
        alert("Este e-mail já está cadastrado em nosso sistema!");
        return;
    }

    // Cria o objeto com as informações do novo usuário
    const novoUsuario = { nome, turma, email, curso, perfil, senha };

    // Adiciona o novo usuário na lista e salva permanentemente no navegador
    listaUsuarios.push(novoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(listaUsuarios));

    alert("Conta criada com sucesso!");
    
    // Limpa os campos do formulário de registro após o sucesso
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-class').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-course').value = '';
    document.getElementById('reg-password').value = '';

    // Redireciona de volta para a tela de login
    showPage('page-login'); 
}

// ==========================================
// 3. SISTEMA DE ACESSO (LOGIN)
// ==========================================

function handleLogin() {
    console.log("Processando tentativa de login...");

    // 1. Pega os dados digitados na tela de LOGIN
    const emailLogin = document.getElementById('login-email').value.trim();
    const senhaLogin = document.getElementById('login-password').value;

    // Validação de campos em branco
    if (!emailLogin || !senhaLogin) {
        alert("Por favor, preencha os campos de E-mail e Senha.");
        return;
    }

    // Efeito visual opcional de carregando no botão
    const btnText = document.querySelector('#page-login .btn-primary .btn-text');
    if (btnText) btnText.innerText = "Entrando...";

    // Simula o tempo de resposta antes de validar e logar
    setTimeout(() => {
        // 2. Busca a lista de usuários gravados no localStorage
        let listaUsuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

        // 3. Procura se existe algum usuário com o par exato de e-mail e senha correspondentes
        const usuarioEncontrado = listaUsuarios.find(user => 
            user.email.toLowerCase() === emailLogin.toLowerCase() && user.senha === senhaLogin
        );

        // 4. Verificação de credenciais
        if (usuarioEncontrado) {
            alert(`Bem-vindo de volta, ${usuarioEncontrado.nome}!`);
            
            // ATENÇÃO: Altere o nome abaixo para o ID real da sua tela principal.
            // Se o ID no seu HTML for 'page-dashboard', mude aqui para 'page-dashboard'
            showPage('page-dashboard'); 
        } else {
            alert("E-mail ou senha incorretos. Tente novamente.");
            // Reseta o texto do botão caso falhe
            if (btnText) btnText.innerText = "Entrar";
        }
    }, 800); // 800 milissegundos de delay para efeito visual de login
}

// ==========================================
// 4. SISTEMA DE SAÍDA (LOGOUT)
// ==========================================

function handleLogout() {
    // 1. Limpa as caixas de texto do login por segurança
    if (document.getElementById('login-email')) document.getElementById('login-email').value = '';
    if (document.getElementById('login-password')) document.getElementById('login-password').value = '';
    
    // 2. Redireciona visualmente o app de volta para a tela inicial de login
    showPage('page-login');
    
    // 3. Oculta menus flutuantes que possam ter ficado abertos
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.classList.add('hidden');
    }
}

// ==========================================
// 5. FUNÇÕES AUXILIARES DA INTERFACE
// ==========================================

function togglePassword(inputId, buttonElement) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}
/* ------------------------VARIÁVEIS GLOBAIS ------------------*/
let dados = [];
let mapa;
let marker;
let carrinho = [];
// Simulação de banco de dados
const usuariosCadastrados = [
    { user: "teste", senha: "123", pontos: 7000 },
    { user: "teste2", senha: "222" , pontos:3000 }
];
let unidadeAtual = null;
let usuarioLogado = null;
let descontoAtivo = 0;
let pontos = 0;
let descontoAplicado = false;

/*----------------------- Carrega os dados do arquivo JSON ------------------------*/
async function carregarDados() {
    const res = await fetch("js/data.json");
    dados = await res.json();
}

/*----------------------------- Renderiza a página nossa história ------------------------*/
async function renderSobreNos() {
    const main = document.getElementById("conteudo-principal");
    if (!main) return;

    main.innerHTML = `
        <div class="informacoes">
            <h2>Sobre a Rede Raízes do Nordeste</h2>
            <img src="assets/img/francisca.png" alt="Dona Francisca" class="img-sobre">
            <p>
                O cheiro de cuscuz quente, café passado na hora e manteiga de garrafa ainda domina o
                pequeno salão da primeira unidade da Raízes do Nordeste, inaugurada há pouco mais de seis anos
                em um bairro tradicional de Recife.
            </p>
            <p>
                O que começou como um pequeno negócio familiar, comandado por Dona Francisca e seus dois filhos,
                hoje se transformou em uma rede de lanchonetes nordestinas em franca expansão, presente em
                diferentes capitais e cidades do interior do Brasil.
            </p>
            <p>
                A proposta sempre foi clara: levar a culinária nordestina para o dia a dia urbano, com rapidez,
                qualidade e identidade cultural.
            </p>
            <p>
                Tapiocas, cuscuz recheado, bolo de macaxeira, sucos regionais e cafés da manhã completos
                conquistaram um público fiel, desde trabalhadores que passam antes do expediente até famílias
                nos fins de semana.
            </p>
        </div>
    `;
}

/*---------------------- Renderiza a página de contato -----------------------*/
async function renderContato() {
    const main = document.getElementById("conteudo-principal");
    main.innerHTML = `
        <div class="informacoes">
            <h2>Fale Conosco</h2>
            <p>Tem alguma dúvida ou sugestão? Entre em contato conosco!</p>
            <div class="contato-info">
                <p><i class="fas fa-phone"></i> (99) 9999-9999</p>
                <p><i class="fas fa-envelope"></i> contato@raizesdonordeste.com.br</p>
                <p><i class="fab fa-instagram"></i> @raizesdonordeste</p>
            </div>
        </div>
    `;
}

/*------------------- Renderiza a página inicial com os cards das unidades -----------------*/
async function renderHome() {
    if (dados.length === 0) {
        await carregarDados();
    }

    if (!dados.unidades) return;

    const lista = document.getElementById("lista");
    let html = "<h2>Selecione a unidade</h2>";

    dados.unidades.forEach(u => {
        html += `
            <div class="card-unidade" onclick="moverMapa(${u.coords.lat}, ${u.coords.lng}, '${u.nome}')">
                <div class="info">
                    <h3>${u.nome}</h3>
                    <p>${u.endereco} - ${u.cidade}</p>
                </div>
                <div class="foto">
                    <img src="${u.foto}" alt="${u.nome}">
                </div>
                <button onclick="abrirCardapio(${u.id}); event.stopPropagation();">
                    Ver Cardápio
                </button>
            </div>
        `;
    });

    lista.innerHTML = html;
}

function renderUsuario() {
    const area = document.getElementById("area-usuario");
    if (!area) return;

    if (usuarioLogado) {
        area.innerHTML = `
            <span onclick="renderizarPainelPontos()">Olá ${usuarioLogado.user} - (Ver seus pontos)</span>
            <button class="btn-logout" onclick="logout()">Sair</button>
        `;
    } else {
        area.innerHTML = `
            <button class="btn-login" onclick="fazerLogin()">
                👤 Entrar / Cadastrar
            </button>
        `;
    }
}

/* ----------------------------segunda tela ------------------------------- */
async function abrirCardapio(idUnidade, manterCarrinho = false) {
    const main = document.getElementById("conteudo-principal");
    const unidade = dados.unidades.find(u => u.id === idUnidade);
    
    unidadeAtual = idUnidade;
    
    const produtosPorCategoria = {};
    unidade.produtos.forEach(produto => {
        if (!produtosPorCategoria[produto.categoria]) {
            produtosPorCategoria[produto.categoria] = [];
        }
        produtosPorCategoria[produto.categoria].push(produto);
    });
    
    const nomeCategorias = {
        'cafe': '☕ Café da Manhã',
        'almoco': '🍽️ Almoço',
        'lanche': '🍔 Lanches',
        'doce': '🍰 Sobremesas',
        'bebida': '🥤 Bebidas'
    };
    
    let categoriasHTML = '';
    
    for (const [categoria, produtos] of Object.entries(produtosPorCategoria)) {
        const nomeCategoria = nomeCategorias[categoria] || categoria;
        
        let produtosHTML = '';
        produtos.forEach(produto => {
            produtosHTML += `
                <div class="card-produto">
                    <img src="${produto.foto}" alt="${produto.nome}">
                    <div class="card-body">
                        <strong>${produto.nome}</strong>
                        <p>${produto.descricao}</p>
                        <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
                        <button class="btn-add" onclick='adicionarAoCarrinho(${JSON.stringify(produto)})'>
                            + ADD AO CARRINHO
                        </button>
                    </div>
                </div>
            `;
        });
        
        categoriasHTML += `
            <div class="categoria">
                <h3 class="categoria-titulo">${nomeCategoria}</h3>
                <div class="produtos-grid">
                    ${produtosHTML}
                </div>
            </div>
        `;
    }
    
    // Montar página com carrinho
    main.innerHTML = `
        <div class="cardapio-layout">
            <div class="cardapio-container">
                <div class="cardapio-header">
                    <h2>${unidade.nome}</h2>
                    <p>${unidade.endereco} - ${unidade.cidade}/${unidade.estado}</p>
                </div>
                ${categoriasHTML}
            </div>

            <aside class="carrinho-lateral" id="carrinho">
                <div class="carrinho-header">
                    <h3>🛒 Seu Pedido</h3>
                </div>
                <div id="itens-carrinho">
                    ${carrinho.length === 0 ? '<p>Carrinho vazio</p>' : ''}
                </div>
                <div class="carrinho-footer">
                    <div class="total" id="ver-total">Total: <strong>R$ ${calcularTotalCarrinho().toFixed(2)}</strong></div>

                    ${usuarioLogado 
                        ? `
                        <div class="fidelidade-checkout">
                            <p>Você tem <strong>${usuarioLogado.pontos} pts</strong></p>
                            <select id="selecao-desconto" onchange="aplicarDescontoFidelidade(this.value)">
                                <option value="0">Não usar pontos</option>
                                <option value="10" ${usuarioLogado.pontos < 1000 ? 'disabled' : ''}>10% OFF (1000 pts)</option>
                                <option value="20" ${usuarioLogado.pontos < 3000 ? 'disabled' : ''}>20% OFF (3000 pts)</option>
                                <option value="50" ${usuarioLogado.pontos < 7000 ? 'disabled' : ''}>50% OFF (7000 pts)</option>
                            </select>
                        </div>
                        ` 
                        : `<button class="btn-log-desconto" onclick='fazerLogin()'>Logar Para Aplicar Desconto</button>`
                    }
                    <button class="btn-finalizar" onclick="finalizarPedido()">Finalizar Pedido</button>
                </div>
            </aside>
        </div>
    `;
    
    // Renderiza o carrinho se tiver itens
    if (carrinho.length > 0) {
        renderCarrinho();
        atualizarTotalCarrinho();
    }
}

function calcularTotalCarrinho() {
    return carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
}

/*---------------------------- colocar e remover carrinho -------------------------------*/
function adicionarAoCarrinho(produto){
    const itemRepetido = carrinho.find(item => item.id === produto.id);

    if (itemRepetido) {
        itemRepetido.quantidade++;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1
        });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));

    atualizarTotalCarrinho();
    renderCarrinho();
    
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`);

}

/*---------------- pegar status carrinho qd finalizar compra e clicar para logar ------ */
function voltarParaCardapioComCarrinho() {
    const carrinhoSalvo = sessionStorage.getItem('carrinhoAntesLogin');
    const unidadeSalva = sessionStorage.getItem('unidadeAntesLogin');
    
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
    
    if (unidadeSalva && unidadeSalva !== 'null') {
        abrirCardapio(parseInt(unidadeSalva));
    } else {
        voltarParaHome();
    }
    
    sessionStorage.removeItem('carrinhoAntesLogin');
    sessionStorage.removeItem('unidadeAntesLogin');
}

function renderCarrinho() {
    const lista = document.querySelector('#itens-carrinho');

    if (!lista) return;

    lista.innerHTML = '';

    if (carrinho.length === 0) {
        lista.innerHTML = '<p>Carrinho vazio</p>';
        return;
    }

    carrinho.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-carrinho';

        div.innerHTML = `
            <div class="info">
                <p>${item.nome}</p>
                <span>R$ ${item.preco.toFixed(2)} x ${item.quantidade}</span>
            </div>

            <div class="remover">
                <button onclick="removerDoCarrinho(${item.id})">⛔</button>
            </div>
        `;

        lista.appendChild(div);
    });
}

function atualizarTotalCarrinho() {
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const totalElement = document.querySelector('.carrinho-footer .total strong');
    if (totalElement) {
        totalElement.innerText = `R$ ${total.toFixed(2)}`;
    }
}

function removerDoCarrinho(id) {
    const index = carrinho.findIndex(item => item.id === id);

    if (index !== -1) {
        carrinho[index].quantidade--;

        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));

    renderCarrinho();
    atualizarTotalCarrinho();
}

function mostrarNotificacao(mensagem) {
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao';
    notificacao.innerHTML = mensagem;
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.remove();
    }, 2000);
}

/*-------------- Terceira tela ao clicar em logar e desconto ----------------*/
function fazerLogin() {
    const main = document.getElementById("conteudo-principal");

    sessionStorage.setItem('carrinhoAntesLogin', JSON.stringify(carrinho));
    sessionStorage.setItem('unidadeAntesLogin', unidadeAtual);
    
    main.innerHTML = `
        <div class="login-container-fidelidade">
            <h2>LOGIN</h2>
            <div class="form-group">
                <input type="text" id="login-cpf-email" placeholder="CPF OU E-MAIL">
            </div>
            <div class="form-group">
                <input type="password" id="login-senha" placeholder="SENHA">
            </div>
            <button class="btn-entrar" onclick="confirmarLogin()">ENTRAR</button>
            <button class="btn-entrar" onclick="abrirTermoLGPD()">CADASTRAR</button>
            <button class="btn-voltar" onclick="voltarParaHome()">VOLTAR</button>
        </div>
    `;
}

function confirmarLogin() {
    const main = document.getElementById("conteudo-principal");
    const userDigitado = document.getElementById("login-cpf-email").value;
    const senhaDigitada = document.getElementById("login-senha").value;
    const usuarioEncontrado = usuariosCadastrados.find(u => u.user === userDigitado && u.senha === senhaDigitada);

    if (usuarioEncontrado) {
        usuarioLogado = usuarioEncontrado;

        renderUsuario();
        mostrarNotificacao(`Bem-vindo, ${usuarioLogado.user}!`);
        voltarParaCardapioComCarrinho();

        setTimeout(() => {
            const selectDesconto = document.getElementById("selecao-desconto");
            if (selectDesconto) {
                const option10 = selectDesconto.querySelector('option[value="10"]');
                const option20 = selectDesconto.querySelector('option[value="20"]');
                const option50 = selectDesconto.querySelector('option[value="50"]');
                
                if (option10) option10.disabled = usuarioLogado.pontos < 1000;
                if (option20) option20.disabled = usuarioLogado.pontos < 3000;
                if (option50) option50.disabled = usuarioLogado.pontos < 7000;
            }
        }, 100);

    } else {
        // Se não encontrar solicita cadastro
        main.innerHTML = `
            <div class="login-container-fidelidade">
                <h2>USUÁRIO NÃO ENCONTRADO</h2>
                <p>Deseja realizar seu cadastro para acumular pontos?</p>
                <button class="btn-voltar" onclick="fazerLogin()">VOLTAR</button>
                <button class="btn-entrar" onclick="abrirTermoLGPD()">CADASTRAR</button>
            </div>
        `;
    }
}

function logout() {
    usuarioLogado = null;
    descontoAtivo = 0;
    pontos = 0;

    renderUsuario();
    mostrarNotificacao("Você saiu da conta.");
    if (unidadeAtual) {
        abrirCardapio(unidadeAtual);
    } else {
        voltarParaHome();
    }
}

/*-------------- lgpd ----------------*/
function abrirTermoLGPD() {
    const overlay = document.createElement("div");
    overlay.className = "overlay-lgpd";
    overlay.id = "overlay-lgpd";

    const modal = document.createElement("div");
    modal.className = "modal-lgpd";
    modal.id = "modal-lgpd";
    
    modal.innerHTML = `
        <h3>Termo de Privacidade</h3>
        <p>
            Para acumular pontos e receber descontos, precisamos processar seus dados de compra. 
            Você aceita nossos termos de uso e política de privacidade (LGPD)?
        </p>
        <button class="btn-aceitar" onclick="confirmarAceiteLGPD()">EU ACEITO E QUERO ME CADASTRAR</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function confirmarAceiteLGPD() {
    document.getElementById("overlay-lgpd").remove();
    document.getElementById("modal-lgpd").remove();
    
    irParaTelaCadastro(); 
}

function irParaTelaCadastro() {
    const main = document.getElementById("conteudo-principal");
    if (!main) return;

    main.innerHTML = `
        <div class="login-container-fidelidade">
            <h2>CRIAR CONTA</h2>
            <div class="form-group">
                <input type="text" id="novo-nome" placeholder="NOME COMPLETO">
            </div>
            <div class="form-group">
                <input type="text" id="novo-email" placeholder="E-MAIL OU CPF">
            </div>
            <div class="form-group">
                <input type="password" id="nova-senha" placeholder="CRIE UMA SENHA">
            </div>
            <button class="btn-entrar" onclick="salvarNovoUsuario()">FINALIZAR CADASTRO</button>
            <button class="btn-voltar" onclick="fazerLogin()">CANCELAR</button>
        </div>
    `;
}

function salvarNovoUsuario(){
    alert("Aqui enviaria para o servidor back-end via fetch e mostraria uma mensagem de cadastro realizado e já redirecionaria para tela de pontos.")
}

function renderizarPainelPontos() {
    const main = document.getElementById("conteudo-principal");
    if (!main) return;
    
    main.innerHTML = `
        <div class="area-cliente-fidelidade">
            <h3>MINHA CONTA</h3>
            <div class="perfil-info">
                <p>Usuário: <strong>${usuarioLogado.user}</strong></p>
                <div class="total-pontos-box">
                    <p>SALDO ATUAL</p>
                    <span class="pts-destaque">${usuarioLogado.pontos} PTS</span>
                </div>
            </div>
            <button class="btn-voltar" onclick="voltarParaHome()">VOLTAR PARA O INÍCIO</button>
        </div>
    `;
}

function selecionarDesconto(porcentagem, custoPontos) {
    if (usuarioLogado.pontos >= custoPontos) {
        descontoAtivo = porcentagem;
        pontos = custoPontos;
        
        mostrarNotificacao(`Desconto de ${porcentagem}% aplicado!`);
        
        renderizarPainelPontos();
        atualizarVisualizacaoCarrinho();
    } else {
        mostrarNotificacao("Você não tem pontos suficientes para este desconto!");
    }
}

function atualizarVisualizacaoCarrinho() {
    const areaFooter = document.querySelector(".carrinho-footer");

    if (!areaFooter) {
        console.log("Elemento .carrinho-footer não encontrado na tela atual");
        return;
    }
    
    let subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    let valorDesconto = (subtotal * descontoAtivo) / 100;
    let totalFinal = subtotal - valorDesconto;

    areaFooter.innerHTML = `
        <div class="resumo-valores">
            <p>Subtotal: R$ ${subtotal.toFixed(2)}</p>
            ${descontoAtivo > 0 ? `<p>Desconto (${descontoAtivo}%): - R$ ${valorDesconto.toFixed(2)}</p>` : ''}
            <div class="total">Total: <strong>R$ ${totalFinal.toFixed(2)}</strong></div>
        </div>
        
        ${usuarioLogado 
            ? `<button class="btn-finalizar" onclick="finalizarPedido()">Finalizar Pedido</button>`
            : `<button class="btn-log-desconto" onclick="fazerLogin()">Logar Para Aplicar Desconto</button>`
        }
    `;
}

function resetarCompra() {
    carrinho = [];
    descontoAtivo = 0;
    pontos = 0;

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    if (document.querySelector('#itens-carrinho')) {
        renderCarrinho();
    }
    
    if (document.querySelector(".area-cliente-fidelidade")) {
        renderizarPainelPontos();
    }
}

/*------------- Finalizar pedido, forma de pagto e acompanhar status ----------- */
function finalizarPedido() {
    const main = document.getElementById("conteudo-principal");
    
    if (carrinho.length === 0) {
        mostrarNotificacao("Seu carrinho está vazio!");
        return;
    }

    let subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    let valorDesconto = 0;
    let totalFinal = subtotal;

    if (usuarioLogado && descontoAtivo > 0) {
        valorDesconto = (subtotal * descontoAtivo) / 100;
        totalFinal = subtotal - valorDesconto;
    }

    // 3. Renderização da tela de Checkout
    main.innerHTML = `
        <div class="checkout-container-duplo">
            <div class="coluna-pagamento">
                <h3>PAGAMENTO 💰</h3>
                <div class="recibo-detalhado">
                    ${carrinho.map(item => `
                        <p><span>${item.quantidade}x ${item.nome}</span> <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span></p>
                    `).join('')}
                    <hr>
                    <p>Subtotal: R$ ${subtotal.toFixed(2)}</p>
                    ${valorDesconto > 0 ? `<p class="txt-desconto">Desc: - R$ ${valorDesconto.toFixed(2)}</p>` : ''}
                    <p class="total-checkout">TOTAL: R$ ${totalFinal.toFixed(2)}</p>
                </div>

                <div class="metodos-grid">
                    <button class="btn-metodo" onclick="processarFluxoPagamento('Dinheiro')">💵 Dinheiro</button>
                    <button class="btn-metodo" onclick="processarFluxoPagamento('Cartão')">💳 Cartão</button>
                    <button class="btn-metodo" onclick="processarFluxoPagamento('Pix')">🏦 Pix</button>
                </div>
                
                <div id="area-interativa-pagamento">
                </div>
            </div>

            <div class="coluna-status">
                <h3>ACOMPANHAR STATUS ⌛</h3>
                <div id="status-checkout" class="painel-timeline">
                    <p class="msg-espera">Aguardando pagamento para iniciar o pedido.</p>
                </div>
            </div>
        </div>
    `;
}

function processarFluxoPagamento(metodo) {
    const areaInterativa = document.getElementById("area-interativa-pagamento");
    
    if (metodo === 'Dinheiro') {
        areaInterativa.innerHTML = `
            <div class="card-pagamento-info">
                <p>💵 <strong>PAGAMENTO NO CAIXA</strong></p>
                <p>Por favor, dirija-se ao balcão...</p>
            </div>`;
        statusPreparo();
    } else {
        areaInterativa.innerHTML = `
            <div class="card-pagamento-info">
                <p>Conectando ao banco...</p>
                <div class="spinner-p"></div>
                ${metodo === 'Pix' ? '<img src="/assets/img/qr_code.png" alt="QR Code Pix" class="qr-code-img">' : '<p>Inserir ou aproximar o cartão...</p>'}
            </div>`;
        
        setTimeout(() => {
            areaInterativa.innerHTML = `<div class="card-pagamento-info"><p>✅ Pagamento Aprovado!</p></div>`;
            statusPreparo();
        }, 3500);
    }
}

function aplicarDescontoFidelidade(porcentagem) {
    if (!usuarioLogado) return;
    
    let custoPontos = 0;
    if (porcentagem == 10) custoPontos = 1000;
    else if (porcentagem == 20) custoPontos = 3000;
    else if (porcentagem == 50) custoPontos = 7000;
    
    if (porcentagem == 0) {
        descontoAtivo = 0;
        pontos = 0;
        descontoAplicado = false;
        atualizarVisualizacaoCarrinho();
        mostrarNotificacao("Opção sem desconto selecionada");
        return;
    }
    
    if (usuarioLogado.pontos >= custoPontos && !descontoAplicado) {
        descontoAtivo = parseInt(porcentagem);
        pontos = custoPontos;
        descontoAplicado = true;
        atualizarVisualizacaoCarrinho();
        mostrarNotificacao(`Desconto de ${porcentagem}% aplicado! Serão debitados ${custoPontos} pontos`);
    } else if (usuarioLogado.pontos < custoPontos) {
        mostrarNotificacao(`Pontos insuficientes! Você tem ${usuarioLogado.pontos} pontos`);
        document.getElementById("selecao-desconto").value = "0";
        descontoAtivo = 0;
        pontos = 0;
        descontoAplicado = false;
    }
}

function iniciarPagamento(metodo) {
    const areaStatus = document.getElementById("status-checkout");
    let segundos = 3;

    areaStatus.innerHTML = `<div class="timer-regressivo">Conectando ao banco... ${segundos}s</div>`;

    const cronometro = setInterval(() => {
        segundos--;
        document.querySelector(".timer-regressivo").innerText = `Conectando ao banco... ${segundos}s`;

        if (segundos <= 0) {
            clearInterval(cronometro);
            statusPreparo();
        }
    }, 1000);
}

function statusPreparo() {
    const areaStatus = document.getElementById("status-checkout");
    
    // Debitar pontos (se houver desconto aplicado)
    if (usuarioLogado && pontos > 0) {
        const saldoAnterior = usuarioLogado.pontos;
        usuarioLogado.pontos -= pontos;
        
        console.log(`[FIDELIDADE] Debitando ${pontos}. Novo saldo: ${usuarioLogado.pontos}`);
        mostrarNotificacao(`Desconto aplicado! -${pontos} pts`);
        
        pontos = 0; 
        descontoAtivo = 0;
        descontoAplicado = false;
    }

    areaStatus.innerHTML = `
        <div class="timeline-visual">
            <div class="step" id="st-1"><span class="icon">✓</span> PEDIDO REALIZADO</div>
            <div class="step" id="st-2"><span class="icon">✓</span> REPASSANDO PEDIDO</div>
            <div class="step" id="st-3"><span class="icon">⌛</span> EM PREPARO...</div>
            <div class="step" id="st-4"><span class="icon">●</span> ENTREGUE/RETIRADA</div>
            <div class="linha-progresso"></div>
        </div>
    `;

    // 3. Simulação da Cozinha 
    setTimeout(() => document.getElementById("st-1").classList.add("active"), 2000);
    setTimeout(() => document.getElementById("st-2").classList.add("active"), 4000);
    setTimeout(() => document.getElementById("st-3").classList.add("active"), 6000);
    
    setTimeout(() => {
        document.getElementById("st-4").classList.add("active");
        finalizarEntregaEPontuar(); 
    }, 15000);
}

function finalizarEntregaEPontuar() {
    const areaStatus = document.getElementById("status-checkout");

    if (!areaStatus) return;

    if (usuarioLogado) {
        usuarioLogado.pontos += 300;
        renderizarPainelPontos();
        mostrarNotificacao("Parabéns! Ganhou 300 pontos pela compra.");
    }

    carrinho = [];
    descontoAtivo = 0;
    pontos = 0;

    localStorage.setItem('carrinho', JSON.stringify(carrinho));

    if (document.querySelector('#itens-carrinho')) {
        renderCarrinho();
        atualizarVisualizacaoCarrinho();
    }

    areaStatus.innerHTML = `
        <h3>PEDIDO ENTREGUE!</h3>
        ${usuarioLogado ? `
                <p>Seu novo saldo: <strong>${usuarioLogado.pontos} PTS</strong></p>
            ` : `
                <p>Você ganhou <strong>+300 PONTOS</strong> nesta compra!</p>
                <p>Crie uma conta para não perder seus pontos.</p>
        `}
        
        <div class="banner-final">
            <p>Obrigado pela preferência!</p>
            
            <button onclick="voltarParaHome()">🏠 Home</button>
                ${!usuarioLogado ? `
                <button onclick="abrirTermoLGPD()">🔥 Criar conta e resgatar pontos</button>
             ` : `
                <button onclick="renderizarPainelPontos()">Ver meus pontos</button>
            `}
        </div>
    `;
}

/*-------------- Inicializa o mapa com OpenStreetMap ----------------*/
function iniciarMapa() {
    mapa = L.map('mapa').setView([-8.0476, -34.8770], 7);
    marker = L.marker([-8.0476, -34.8770]).addTo(mapa);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
}

/*---------------- Move o mapa ---------------------*/
function moverMapa(lat, lng) {
    mapa.setView([lat, lng], 10);
    marker.setLatLng([lat, lng]);
}

/*---------------- Volta para a tela inicial ---------------------*/
function voltarParaHome() {
    const main = document.getElementById("conteudo-principal");

    if (mapa) {
        mapa.remove();
    }
    main.innerHTML = `
        <div id="home">
            <div id="lista"></div>
            <div class="moldura-mapa">
                <div id="mapa"></div>
            </div>
        </div>
    `;

    iniciarMapa();
    renderHome();
    resetarCompra();
    renderUsuario();
}

/*---------------------- Inicializa o sistema  --------------------------*/
document.addEventListener("DOMContentLoaded", async () => {
    await carregarDados();
    iniciarMapa();
    renderHome();
    renderUsuario();
    
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
});
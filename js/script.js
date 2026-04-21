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
let usuarioLogado = null;
let descontoAtivo = 0;
let pontos = 0;

/*----------------------- Carrega os dados do arquivo JSON ------------------------*/
async function carregarDados() {
    const res = await fetch("js/data.json");
    dados = await res.json();
}

/*----------------------------- Renderiza a página nossa história ------------------------*/
async function renderSobreNos() {
    const main = document.getElementById("conteudo-principal");
    main.innerHTML = `
        <div class="informacoes">
            <h2>Sobre a Rede Raízes do Nordeste</h2>
            <p>Nossa história começou com o desejo de trazer o sabor autêntico do sertão para a cidade...</p>
            <p>Hoje, somos referência em culinária nordestina, mantendo vivas as tradições de nossos antepassados.</p>
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
                <p><i class="fas fa-phone"></i> (81) 9999-9999</p>
                <p><i class="fas fa-envelope"></i> contato@raizesdonordeste.com.br</p>
                <p><i class="fab fa-instagram"></i> @raizesdonordeste</p>
            </div>
        </div>
    `;
}

/*------------------- Renderiza a página inicial com os cards das unidades -----------------*/
async function renderHome() {
    if (dados.length === 0 || !dados.unidades) {
        await carregarDados();
    }

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

/* ----------------------------segunda tela ------------------------------- */
async function abrirCardapio(idUnidade) {
    const main = document.getElementById("conteudo-principal");
    const unidade = dados.unidades.find(u => u.id === idUnidade);
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
                    <p style="color: #666; text-align: center;">Carrinho vazio</p>
                </div>
                <div class="carrinho-footer">
                    <div class="total">Total: <strong>R$ 0,00</strong></div>
                    <button class="btn-log-desconto" onclick='fazerLogin()'>
                        Logar Para Aplicar Desconto
                    </button>
                    <button class="btn-finalizar" onclick="finalizarPedido()">Finalizar Pedido</button>
                </div>
            </aside>
        </div>
    `;
    unidadeAtual = idUnidade;
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

function renderCarrinho() {
    const lista = document.querySelector('#itens-carrinho');
    lista.innerHTML = '';

    if (!lista) return;
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
    const containerEsquerdo = document.querySelector(".cardapio-container");

    containerEsquerdo.innerHTML = `
        <div class="login-container-fidelidade">
            <h2>LOGIN</h2>
            <div class="form-group">
                <input type="text" id="login-cpf-email" placeholder="CPF OU E-MAIL">
            </div>
            <div class="form-group">
                <input type="password" id="login-senha" placeholder="SENHA">
            </div>
            <button class="btn-entrar" onclick="confirmarLogin()">ENTRAR</button>
        </div>
    `;
}

function confirmarLogin() {
    const userDigitado = document.getElementById("login-cpf-email").value;
    const senhaDigitada = document.getElementById("login-senha").value;
    const containerEsquerdo = document.querySelector(".cardapio-container");

    const usuarioEncontrado = usuariosCadastrados.find(u => u.user === userDigitado && u.senha === senhaDigitada);

    if (usuarioEncontrado) {
        usuarioLogado = usuarioEncontrado;
        renderizarPainelPontos();
    } else {
        // Se não encontrar solicita cadastro
        containerEsquerdo.innerHTML = `
            <div class="login-container-fidelidade">
                <h2>USUÁRIO NÃO ENCONTRADO</h2>
                <p>Deseja realizar seu cadastro para acumular pontos?</p>
                <button class="btn-voltar" onclick="fazerLogin()">VOLTAR</button>
                <button class="btn-entrar" onclick="abrirTermoLGPD()">CADASTRAR</button>
            </div>
        `;
    }
}

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
    const containerEsquerdo = document.querySelector(".cardapio-container");
    
    containerEsquerdo.innerHTML = `
        <div class="login-container-fidelidade">
            <h2>CADASTRO</h2>
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
    const containerEsquerdo = document.querySelector(".cardapio-container");
    
    containerEsquerdo.innerHTML = `
        <div class="area-cliente-fidelidade">
            <h3>BEM VINDO, ${usuarioLogado.user}!</h3>
            <div class="total-pontos-box">
                <span>PONTOS DISPONÍVEIS: ${usuarioLogado.pontos} PTS</span>
            </div>
            <div class="lista-resgate">
                <p>Escolha seu desconto:</p>
                <button onclick="selecionarDesconto(10, 1000)" ${usuarioLogado.pontos < 1000 ? 'disabled' : ''}>10% - 1000 PTS</button>
                <button onclick="selecionarDesconto(20, 3000)" ${usuarioLogado.pontos < 3000 ? 'disabled' : ''}>20% - 3000 PTS</button>
                <button onclick="selecionarDesconto(30, 5000)" ${usuarioLogado.pontos < 5000 ? 'disabled' : ''}>30% - 5000 PTS</button>
                <button onclick="selecionarDesconto(50, 7000)" ${usuarioLogado.pontos < 7000 ? 'disabled' : ''}>50% - 7000 PTS</button>
                </div>
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
    
    let subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    let valorDesconto = (subtotal * descontoAtivo) / 100;
    let totalFinal = subtotal - valorDesconto;

    areaFooter.innerHTML = `
        <div class="resumo-valores">
            <p>Subtotal: R$ ${subtotal.toFixed(2)}</p>
            ${descontoAtivo > 0 ? `<p>Desconto (${descontoAtivo}%): - R$ ${valorDesconto.toFixed(2)}</p>` : ''}
            <div class="total">Total: <strong>R$ ${totalFinal.toFixed(2)}</strong></div>
        </div>
        
        ${descontoAtivo > 0 
            ? `<button class="btn-finalizar" onclick="finalizarPedido()">Finalizar Pedido</button>` 
            : `<button class="btn-log-desconto" onclick="fazerLogin()">Logar Para Aplicar Desconto</button>`
        }
    `;
}

function resetarCompra() {
    carrinho = [];
    
    descontoAtivo = 0;
    custoPontosPendente = 0; 

    renderCarrinho();
    
    if (document.querySelector(".area-cliente-fidelidade")) {
        renderizarPainelPontos();
    }
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
}

/*---------------------- Inicializa o sistema  --------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    iniciarMapa();
    renderHome();
});
/* ------------------------VARIÁVEIS GLOBAIS ------------------*/
let dados = [];
let mapa;
let marker;

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
                    <button class="btn-finalizar">Finalizar Pedido</button>
                </div>
            </aside>
        </div>
    `;
}

/*--------------------------------------------------------------------------*/

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
}

/*---------------------- Inicializa o sistema  --------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    iniciarMapa();
    renderHome();
});
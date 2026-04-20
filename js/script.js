/* Acessa JSON para manipula-lo */ 
let dados = [];

async function carregarDados() {
  const res = await fetch("js/data.json");
  dados = await res.json();
}

/*carrega o mapa pela api do OpenStreetMap*/
let mapa;
let marker;

function iniciarMapa() {
  mapa = L.map('mapa').setView([-8.0476, -34.8770], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);

  marker = L.marker([-8.0476, -34.8770]).addTo(mapa);

//captura e mostra no console as coord do clique no mapa p/ simular loc das unidades no json (apagar)
  mapa.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    console.log("Latitude:", lat);
    console.log("Longitude:", lng);

    // Move o marcador ao clicar no mapa
    marker.setLatLng([lat, lng]);
  });
}

/* mover mapa ao clicar nas unidades */
function moverMapa(lat, lng) {
  mapa.setView([lat, lng], 10);
  marker.setLatLng([lat, lng]);
}

/* Renderiza a primeira tela dos cards das unidades */
async function renderHome() {
  await carregarDados();

  const lista = document.getElementById("lista");

  let html = "<h2>Selecione a unidade</h2>";

  dados.unidades.forEach(u => {
    console.log(u.coords);
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

/* Renderiza a segunda tela do cardápio de acordo com a unidade q foi selecionada */
async function abrirCardapio(idUnidade) {
    const main = document.getElementById("conteudo-principal");
    const unidade = dados.unidades.find(u => u.id === idUnidade);

    main.innerHTML = "";

    // Agrupamento por categoria
    const categoriasAgrupadas = {};
    unidade.produtos.forEach(prod => {
        if (!categoriasAgrupadas[prod.categoria]) categoriasAgrupadas[prod.categoria] = [];
        categoriasAgrupadas[prod.categoria].push(prod);
    });

    let htmlCardapio = `

        <div class="tela-cardapio">
            <header class="cardapio-header">
                <button onclick="voltarParaHome()" class="btn-voltar">← Voltar</button>
                <h2>Bem Vindo!</h2>
            </header>
            <div class="layout-cardapio">
            <div class="coluna-produtos">
        `;

    const nomesCategorias = { "cafe": "Café da Manhã ☕", "almoco": "Almoço 🍽️", "lanche": "Lanches 🥪", "doce": "Sobremesas 🍫", "bebida": "Bebidas 🥤" };

    for (let cat in categoriasAgrupadas) {
        htmlCardapio += `<h3 class="titulo-categoria">${nomesCategorias[cat] || cat}</h3>`;
        htmlCardapio += `<div class="grid-produtos">`;

        categoriasAgrupadas[cat].forEach(item => {
            htmlCardapio += `
                <div class="card-produto">
                    <img src="${item.foto}" alt="${item.nome}">
                    <div class="card-body">
                        <strong>${item.nome}</strong>
                        <p>${item.descricao}</p>
                        <span class="preco">R$ ${item.preco.toFixed(2)}</span>
                        <button class="btn-add"> + ADD AO CARRINHO </button>
                    </div>
                </div>
            `;
        });
        htmlCardapio += `</div>`;
    }

    htmlCardapio += `
                </div> <aside class="coluna-carrinho">
                    <div class="carrinho-fixo">
                        <i class="fas fa-shopping-cart icone-carrinho"></i>
                        <div class="carrinho-box">
                            <ul id="itens-carrinho">
                                <li>- PROD 1 ........... R$22</li>
                                <li>- PROD 2 ........... R$8</li>
                            </ul>
                            <hr>
                            <div class="total">TOTAL: R$ 30,00</div>
                            <button class="btn-login-desconto">LOGAR P/ DESCONTO</button>
                            <button class="btn-finalizar">✓ Finalizar Compra</button>
                        </div>
                    </div>
                </aside>

            </div> </div>
    `;

    main.innerHTML = htmlCardapio;
}

// Função para voltar
function voltarParaHome() {
    const main = document.getElementById("conteudo-principal");
    main.innerHTML = `<div id="lista"></div><div class="moldura-mapa"><div id="mapa"></div></div>`;
    
    iniciarMapa();
    renderHome();
}


document.addEventListener("DOMContentLoaded", () => {
  iniciarMapa();
  renderHome();
});
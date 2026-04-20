/* Acessa JSON para manipula-lo */ 
let dados = [];

async function carregarDados() {
  const res = await fetch("js/data.json");
  dados = await res.json();
}

/* Tela Nossa História */
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

/* Tela Contato */
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

/*cria e carrega o mapa pela api do OpenStreetMap*/
let mapa;
let marker;

function iniciarMapa() {
  mapa = L.map('mapa').setView([-8.0476, -34.8770], 7);
  marker = L.marker([-8.0476, -34.8770]).addTo(mapa);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);
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


// Função para voltar inicio
function voltarParaHome() {
    const main = document.getElementById("conteudo-principal");
    main.innerHTML = 
    `<div id="lista"></div>
        <div class="moldura-mapa">
            <div id="mapa"></div>
        </div>
    `;
    
    iniciarMapa();
    renderHome();
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarMapa();
  renderHome();
});
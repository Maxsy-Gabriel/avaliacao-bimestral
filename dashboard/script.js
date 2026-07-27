const URL_BASE = "http://localhost:3000";

// Guarda os dados já buscados para reaplicar o filtro por bloco sem novo fetch
let dadosCarregados = null;

const elementoCarregando = document.getElementById("estado-carregando");
const elementoErro = document.getElementById("estado-erro");
const elementoPainel = document.getElementById("painel");
const seletorBloco = document.getElementById("filtro-bloco");
const notaFiltroGeral = document.getElementById("nota-filtro-geral");

// Pequenos glifos usados como "anotações à mão" ao lado de cada área/categoria
const GLIFOS_POR_AREA = {
  "salão de festas": "✦",
  "churrasqueira": "♨",
  "quadra": "◯"
};

const GLIFOS_POR_CATEGORIA = {
  "manutenção": "⚙",
  "barulho": "♪",
  "segurança": "⚑",
  "outros": "◆"
};

document.addEventListener("DOMContentLoaded", iniciarDashboard);
document.getElementById("botao-tentar-novamente").addEventListener("click", iniciarDashboard);
seletorBloco.addEventListener("change", aoTrocarFiltroDeBloco);

// -----------------------------------------------------------
// Carregamento inicial
// -----------------------------------------------------------

async function iniciarDashboard() {
  mostrarApenas(elementoCarregando);

  try {
    dadosCarregados = await buscarTodosOsDados();
  } catch (erro) {
    console.error("Falha ao carregar o livro de ocorrências:", erro);
    mostrarApenas(elementoErro);
    return;
  }

  popularFiltroDeBloco(dadosCarregados.unidades);
  renderizarPainel(dadosCarregados, "");
  renderizarCarimboDeAtualizacao();

  mostrarApenas(elementoPainel);
}

async function buscarTodosOsDados() {
  const respostaUnidades = await fetch(`${URL_BASE}/unidades`);
  const respostaMoradores = await fetch(`${URL_BASE}/moradores`);
  const respostaReservas = await fetch(`${URL_BASE}/reservas`);
  const respostaChamados = await fetch(`${URL_BASE}/chamados`);

  if (!respostaUnidades.ok || !respostaMoradores.ok || !respostaReservas.ok || !respostaChamados.ok) {
    throw new Error("Falha ao buscar dados do servidor.");
  }

  const unidades = await respostaUnidades.json();
  const moradores = await respostaMoradores.json();
  const reservas = await respostaReservas.json();
  const chamados = await respostaChamados.json();

  return { unidades, moradores, reservas, chamados };
}

function mostrarApenas(elementoParaMostrar) {
  elementoCarregando.classList.add("oculto");
  elementoErro.classList.add("oculto");
  elementoPainel.classList.add("oculto");
  elementoParaMostrar.classList.remove("oculto");
}

function renderizarCarimboDeAtualizacao() {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString("pt-BR");
  const horaFormatada = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("carimbo-atualizacao").textContent = `Registrado em ${dataFormatada} às ${horaFormatada}`;
}

// -----------------------------------------------------------
// Filtro por bloco
// -----------------------------------------------------------

function popularFiltroDeBloco(unidades) {
  const blocosEncontrados = [];

  for (const unidade of unidades) {
    if (!blocosEncontrados.includes(unidade.bloco)) {
      blocosEncontrados.push(unidade.bloco);
    }
  }

  blocosEncontrados.sort();

  for (const bloco of blocosEncontrados) {
    const opcao = document.createElement("option");
    opcao.value = bloco;
    opcao.textContent = `Bloco ${bloco}`;
    seletorBloco.appendChild(opcao);
  }

  seletorBloco.disabled = false;
}

function aoTrocarFiltroDeBloco() {
  const blocoSelecionado = seletorBloco.value.trim();
  renderizarPainel(dadosCarregados, blocoSelecionado);
}

// -----------------------------------------------------------
// O filtro por bloco restringe TODAS as seções do painel aos
// moradores das unidades daquele bloco (e, por consequência,
// às reservas e chamados feitos por esses moradores).
// -----------------------------------------------------------

function renderizarPainel(dados, blocoSelecionado) {
  const moradoresDoBloco = filtrarMoradoresPorBloco(dados.moradores, dados.unidades, blocoSelecionado);
  const idsDosMoradoresDoBloco = [];

  for (const morador of moradoresDoBloco) {
    idsDosMoradoresDoBloco.push(String(morador.id));
  }

  const reservasFiltradas = [];
  for (const reserva of dados.reservas) {
    if (idsDosMoradoresDoBloco.includes(String(reserva.moradorId))) {
      reservasFiltradas.push(reserva);
    }
  }

  const chamadosFiltrados = [];
  for (const chamado of dados.chamados) {
    if (idsDosMoradoresDoBloco.includes(String(chamado.moradorId))) {
      chamadosFiltrados.push(chamado);
    }
  }

  const contagemPorArea = contarReservasConfirmadasPorArea(reservasFiltradas);
  renderizarReservasPorArea(contagemPorArea);
  renderizarRankingDeAreas(contagemPorArea);

  const tempoMedio = calcularTempoMedioDeResolucao(chamadosFiltrados);
  renderizarTempoMedio(tempoMedio);

  const distribuicaoCategorias = calcularDistribuicaoPorCategoria(chamadosFiltrados);
  renderizarDistribuicaoCategorias(distribuicaoCategorias);

  const contagemPorStatus = contarChamadosPorStatus(chamadosFiltrados);
  renderizarCardsDeStatus(contagemPorStatus);
  repetirAnimacaoDosCarimbos();

  const ranking = calcularRankingDeMoradores(chamadosFiltrados, dados.moradores, dados.unidades);
  renderizarRankingDeMoradores(ranking);

  renderizarFachada(dados.unidades, dados.moradores, dados.chamados);

  atualizarNotaDeFiltro(blocoSelecionado);
}

// Mapa visual do prédio: acende a unidade que tem algum chamado não resolvido.
// Sempre olha para o conjunto completo (não segue o filtro de bloco), pois é
// uma visão geral do prédio inteiro. Não recalcula nem altera nenhum dado.
function renderizarFachada(unidades, moradores, chamados) {
  const elementoFachada = document.getElementById("fachada");
  if (!elementoFachada) {
    return;
  }

  const idsDeMoradoresComChamadoAberto = [];
  for (const chamado of chamados) {
    if (chamado.status !== "resolvido") {
      idsDeMoradoresComChamadoAberto.push(String(chamado.moradorId));
    }
  }

  const idsDeUnidadesComChamadoAberto = [];
  for (const morador of moradores) {
    if (idsDeMoradoresComChamadoAberto.includes(String(morador.id))) {
      idsDeUnidadesComChamadoAberto.push(String(morador.unidadeId));
    }
  }

  const blocos = {};
  for (const unidade of unidades) {
    if (!blocos[unidade.bloco]) {
      blocos[unidade.bloco] = [];
    }
    blocos[unidade.bloco].push(unidade);
  }

  elementoFachada.innerHTML = "";

  const nomesDosBlocos = Object.keys(blocos).sort();
  for (const nomeDoBloco of nomesDosBlocos) {
    const blocoElemento = document.createElement("div");
    blocoElemento.className = "fachada__bloco";

    const nomeElemento = document.createElement("span");
    nomeElemento.className = "fachada__nome";
    nomeElemento.textContent = `Bloco ${nomeDoBloco}`;
    blocoElemento.appendChild(nomeElemento);

    const celsElemento = document.createElement("div");
    celsElemento.className = "fachada__cels";

    for (const unidade of blocos[nomeDoBloco]) {
      const temChamadoAberto = idsDeUnidadesComChamadoAberto.includes(String(unidade.id));
      const celula = document.createElement("div");
      celula.className = temChamadoAberto ? "fachada__cel fachada__cel--chamado" : "fachada__cel";
      celula.textContent = unidade.numero;
      celula.title = temChamadoAberto ? "Há chamado em aberto nesta unidade" : "Sem chamado em aberto";
      celsElemento.appendChild(celula);
    }

    blocoElemento.appendChild(celsElemento);
    elementoFachada.appendChild(blocoElemento);
  }
}

function atualizarNotaDeFiltro(blocoSelecionado) {
  if (blocoSelecionado === "") {
    notaFiltroGeral.classList.add("oculto");
    return;
  }

  notaFiltroGeral.textContent = `Exibindo dados apenas do Bloco ${blocoSelecionado}.`;
  notaFiltroGeral.classList.remove("oculto");
}

function contarReservasConfirmadasPorArea(reservas) {
  const contagem = {
    "salão de festas": 0,
    "churrasqueira": 0,
    "quadra": 0
  };

  for (const reserva of reservas) {
    if (reserva.status === "confirmada") {
      contagem[reserva.area] = contagem[reserva.area] + 1;
    }
  }

  return contagem;
}

function renderizarReservasPorArea(contagemPorArea) {
  const areas = Object.keys(contagemPorArea);
  let maiorContagem = 0;

  for (const area of areas) {
    if (contagemPorArea[area] > maiorContagem) {
      maiorContagem = contagemPorArea[area];
    }
  }

  const lista = document.getElementById("lista-reservas-area");
  lista.innerHTML = "";

  if (maiorContagem === 0) {
    lista.appendChild(criarItemVazio("Nenhum dado disponível"));
    return;
  }

  for (const area of areas) {
    const valor = contagemPorArea[area];
    const percentual = Math.round((valor / maiorContagem) * 100);
    lista.appendChild(criarItemBarra(area, valor, percentual, GLIFOS_POR_AREA[area]));
  }
}

function renderizarRankingDeAreas(contagemPorArea) {
  const ranking = [];

  for (const area of Object.keys(contagemPorArea)) {
    ranking.push({ nome: area, valor: contagemPorArea[area] });
  }

  ranking.sort((a, b) => b.valor - a.valor);

  const lista = document.getElementById("lista-ranking-areas");
  lista.innerHTML = "";

  if (ranking[0].valor === 0) {
    lista.appendChild(criarItemVazio("Nenhum dado disponível"));
    return;
  }

  for (const item of ranking) {
    lista.appendChild(criarItemRanking(item.nome, `${item.valor} reserva(s)`));
  }
}

function calcularTempoMedioDeResolucao(chamados) {
  let somaDeDias = 0;
  let totalResolvidos = 0;

  for (const chamado of chamados) {
    if (chamado.status === "resolvido" && chamado.dataResolucao) {
      const dataAbertura = new Date(chamado.dataAbertura);
      const dataResolucao = new Date(chamado.dataResolucao);
      const diferencaEmMilissegundos = dataResolucao - dataAbertura;
      const diferencaEmDias = diferencaEmMilissegundos / (1000 * 60 * 60 * 24);

      somaDeDias = somaDeDias + diferencaEmDias;
      totalResolvidos = totalResolvidos + 1;
    }
  }

  if (totalResolvidos === 0) {
    return null;
  }

  return somaDeDias / totalResolvidos;
}

function renderizarTempoMedio(tempoMedio) {
  const elemento = document.getElementById("tempo-medio-resolucao");

  if (tempoMedio === null) {
    elemento.textContent = "Nenhum dado disponível";
    elemento.classList.add("mensagem-vazia");
    return;
  }

  elemento.classList.remove("mensagem-vazia");
  elemento.innerHTML = `${tempoMedio.toFixed(1)} <span class="estatistica-grande__unidade">dias</span>`;
}

function calcularDistribuicaoPorCategoria(chamados) {
  const contagem = {
    "manutenção": 0,
    "barulho": 0,
    "segurança": 0,
    "outros": 0
  };

  for (const chamado of chamados) {
    contagem[chamado.categoria] = contagem[chamado.categoria] + 1;
  }

  const total = chamados.length;
  const distribuicao = [];

  for (const categoria of Object.keys(contagem)) {
    const percentual = total === 0 ? 0 : (contagem[categoria] / total) * 100;
    distribuicao.push({ nome: categoria, quantidade: contagem[categoria], percentual });
  }

  return distribuicao;
}

function renderizarDistribuicaoCategorias(distribuicao) {
  const lista = document.getElementById("lista-categoria");
  lista.innerHTML = "";

  let totalChamados = 0;
  for (const item of distribuicao) {
    totalChamados = totalChamados + item.quantidade;
  }

  document.getElementById("total-chamados-valor").textContent = totalChamados;

  if (totalChamados === 0) {
    lista.appendChild(criarItemVazio("Nenhum dado disponível"));
    return;
  }

  for (const item of distribuicao) {
    const percentualArredondado = Math.round(item.percentual);
    const valorExibido = `${item.quantidade} (${percentualArredondado}%)`;
    lista.appendChild(criarItemBarra(item.nome, valorExibido, percentualArredondado, GLIFOS_POR_CATEGORIA[item.nome]));
  }
}

function filtrarMoradoresPorBloco(moradores, unidades, blocoSelecionado) {
  if (blocoSelecionado === "") {
    return moradores;
  }

  const moradoresFiltrados = [];

  for (const morador of moradores) {
    const unidadeDoMorador = unidades.find((unidade) => String(unidade.id) === String(morador.unidadeId));
    if (unidadeDoMorador && unidadeDoMorador.bloco === blocoSelecionado) {
      moradoresFiltrados.push(morador);
    }
  }

  return moradoresFiltrados;
}

function contarChamadosPorStatus(chamados) {
  const contagem = {
    "aberto": 0,
    "em andamento": 0,
    "resolvido": 0
  };

  for (const chamado of chamados) {
    contagem[chamado.status] = contagem[chamado.status] + 1;
  }

  return contagem;
}

function renderizarCardsDeStatus(contagem) {
  animarNumero(document.getElementById("numero-aberto"), contagem["aberto"]);
  animarNumero(document.getElementById("numero-em-andamento"), contagem["em andamento"]);
  animarNumero(document.getElementById("numero-resolvido"), contagem["resolvido"]);
}

// Sobe o número até o valor final já calculado — puramente visual, não recalcula nada
function animarNumero(elemento, valorFinal) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elemento.textContent = valorFinal;
    return;
  }

  const duracao = 700;
  const valorInicial = Number(elemento.textContent) || 0;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const suavizado = 1 - Math.pow(1 - progresso, 3);
    elemento.textContent = Math.round(valorInicial + (valorFinal - valorInicial) * suavizado);
    if (progresso < 1) {
      requestAnimationFrame(passo);
    }
  }

  requestAnimationFrame(passo);
}

// Reinicia a animação de "carimbada" dos selos sempre que os números mudam
function repetirAnimacaoDosCarimbos() {
  const selos = document.querySelectorAll(".selo");

  for (const selo of selos) {
    selo.style.animation = "none";
    void selo.offsetWidth;
    selo.style.animation = "";
  }
}

function calcularRankingDeMoradores(chamados, moradores, unidades) {
  const contagemPorMorador = {};

  for (const chamado of chamados) {
    const idMorador = String(chamado.moradorId);
    if (contagemPorMorador[idMorador] === undefined) {
      contagemPorMorador[idMorador] = 0;
    }
    contagemPorMorador[idMorador] = contagemPorMorador[idMorador] + 1;
  }

  const ranking = [];

  for (const idMorador of Object.keys(contagemPorMorador)) {
    const morador = moradores.find((m) => String(m.id) === idMorador);
    if (!morador) {
      continue;
    }

    const unidade = unidades.find((u) => String(u.id) === String(morador.unidadeId));
    const identificacaoUnidade = unidade ? `${unidade.numero}/${unidade.bloco}` : "sem unidade";

    ranking.push({
      nome: morador.nome,
      unidade: identificacaoUnidade,
      totalChamados: contagemPorMorador[idMorador]
    });
  }

  ranking.sort((a, b) => {
    if (b.totalChamados !== a.totalChamados) {
      return b.totalChamados - a.totalChamados;
    }
    return a.nome.localeCompare(b.nome);
  });

  return ranking;
}

function renderizarRankingDeMoradores(ranking) {
  const lista = document.getElementById("lista-ranking-moradores");
  lista.innerHTML = "";

  if (ranking.length === 0) {
    lista.appendChild(criarItemVazio("Nenhum dado disponível"));
    return;
  }

  for (const item of ranking) {
    const li = document.createElement("li");
    li.className = "item-ranking";
    li.innerHTML = `
      <span class="item-ranking__nome">${item.nome}</span>
      <span class="item-ranking__unidade">${item.unidade}</span>
      <span class="item-ranking__valor">${item.totalChamados} chamado(s)</span>
    `;
    lista.appendChild(li);
  }
}

// -----------------------------------------------------------
// Helpers de criação de elementos
// -----------------------------------------------------------

function criarItemBarra(rotulo, valorExibido, percentual, glifo) {
  const li = document.createElement("li");
  li.innerHTML = `
    <div class="item-barra__topo">
      <span class="item-barra__icone" aria-hidden="true">${glifo || ""}</span>
      <span class="item-barra__rotulo">${rotulo}</span>
      <span class="item-barra__valor">${valorExibido}</span>
    </div>
    <div class="item-barra__trilho">
      <div class="item-barra__preenchimento" style="width: ${percentual}%"></div>
    </div>
  `;
  return li;
}

function criarItemRanking(nome, valorExibido) {
  const li = document.createElement("li");
  li.className = "item-ranking";
  li.innerHTML = `
    <span class="item-ranking__nome">${nome}</span>
    <span class="item-ranking__valor">${valorExibido}</span>
  `;
  return li;
}

function criarItemVazio(texto) {
  const li = document.createElement("li");
  li.className = "mensagem-vazia";
  li.textContent = texto;
  return li;
}

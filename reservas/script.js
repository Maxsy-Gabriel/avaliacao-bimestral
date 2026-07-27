const URL_BASE = "http://localhost:3000";
const ITENS_POR_PAGINA = 10;

let reservasCarregadas = [];
let moradoresCarregados = [];
let unidadesCarregadas = [];

let termoBusca = "";
let paginaAtual = 1;
let idReservaParaCancelar = null;

const elementoCarregando = document.getElementById("estado-carregando");
const elementoErro = document.getElementById("estado-erro");
const elementoPainel = document.getElementById("painel");
const corpoTabela = document.getElementById("corpo-tabela-reservas");
const campoBusca = document.getElementById("campo-busca");

const elementoPaginacao = document.getElementById("paginacao");
const textoPagina = document.getElementById("texto-pagina");
const botaoPaginaAnterior = document.getElementById("botao-pagina-anterior");
const botaoPaginaProxima = document.getElementById("botao-pagina-proxima");

const mensagemElemento = document.getElementById("mensagem");
const mensagemTexto = document.getElementById("mensagem-texto");
const botaoFecharMensagem = document.getElementById("botao-fechar-mensagem");

const botaoNovaReserva = document.getElementById("botao-nova-reserva");

const overlayFormulario = document.getElementById("overlay-formulario");
const formulario = document.getElementById("formulario-reserva");
const avisoSemMoradores = document.getElementById("aviso-sem-moradores");
const campoMorador = document.getElementById("campo-morador");
const campoArea = document.getElementById("campo-area");
const campoData = document.getElementById("campo-data");
const erroMorador = document.getElementById("erro-morador");
const erroData = document.getElementById("erro-data");
const erroConflito = document.getElementById("erro-conflito");
const botaoFecharFormulario = document.getElementById("botao-fechar-formulario");
const botaoCancelarFormulario = document.getElementById("botao-cancelar-formulario");

const overlayConfirmacao = document.getElementById("overlay-confirmacao");
const textoConfirmacao = document.getElementById("texto-confirmacao");
const botaoVoltarConfirmacao = document.getElementById("botao-voltar-confirmacao");
const botaoConfirmarCancelamento = document.getElementById("botao-confirmar-cancelamento");

document.addEventListener("DOMContentLoaded", iniciarPagina);
document.getElementById("botao-tentar-novamente").addEventListener("click", iniciarPagina);

campoBusca.addEventListener("input", () => {
  termoBusca = campoBusca.value.trim();
  paginaAtual = 1;
  renderizarTabela();
});

botaoPaginaAnterior.addEventListener("click", () => {
  paginaAtual = paginaAtual - 1;
  renderizarTabela();
});

botaoPaginaProxima.addEventListener("click", () => {
  paginaAtual = paginaAtual + 1;
  renderizarTabela();
});

botaoNovaReserva.addEventListener("click", abrirModalNovaReserva);
botaoFecharFormulario.addEventListener("click", fecharModalFormulario);
botaoCancelarFormulario.addEventListener("click", fecharModalFormulario);
formulario.addEventListener("submit", aoSubmeterFormulario);

botaoVoltarConfirmacao.addEventListener("click", fecharModalConfirmacao);
botaoConfirmarCancelamento.addEventListener("click", confirmarCancelamento);

botaoFecharMensagem.addEventListener("click", fecharMensagem);

overlayFormulario.addEventListener("click", (evento) => {
  if (evento.target === overlayFormulario) {
    fecharModalFormulario();
  }
});

overlayConfirmacao.addEventListener("click", (evento) => {
  if (evento.target === overlayConfirmacao) {
    fecharModalConfirmacao();
  }
});

document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape") {
    return;
  }
  if (!overlayFormulario.classList.contains("oculto")) {
    fecharModalFormulario();
  }
  if (!overlayConfirmacao.classList.contains("oculto")) {
    fecharModalConfirmacao();
  }
});

// -----------------------------------------------------------
// Carregamento inicial
// -----------------------------------------------------------

async function iniciarPagina() {
  mostrarApenas(elementoCarregando);

  try {
    const dados = await buscarDados();
    reservasCarregadas = dados.reservas;
    moradoresCarregados = dados.moradores;
    unidadesCarregadas = dados.unidades;
  } catch (erro) {
    console.error("Falha ao carregar reservas:", erro);
    mostrarApenas(elementoErro);
    return;
  }

  renderizarTabela();
  mostrarApenas(elementoPainel);
}

async function buscarDados() {
  const respostaReservas = await fetch(`${URL_BASE}/reservas`);
  const respostaMoradores = await fetch(`${URL_BASE}/moradores`);
  const respostaUnidades = await fetch(`${URL_BASE}/unidades`);

  if (!respostaReservas.ok || !respostaMoradores.ok || !respostaUnidades.ok) {
    throw new Error("Falha ao buscar dados do servidor.");
  }

  const reservas = await respostaReservas.json();
  const moradores = await respostaMoradores.json();
  const unidades = await respostaUnidades.json();

  return { reservas, moradores, unidades };
}

// Recarrega os dados após criar/cancelar, sem exibir o spinner de tela cheia
async function recarregarReservas() {
  const dados = await buscarDados();
  reservasCarregadas = dados.reservas;
  moradoresCarregados = dados.moradores;
  unidadesCarregadas = dados.unidades;
  renderizarTabela();
}

function mostrarApenas(elementoParaMostrar) {
  elementoCarregando.classList.add("oculto");
  elementoErro.classList.add("oculto");
  elementoPainel.classList.add("oculto");
  elementoParaMostrar.classList.remove("oculto");
}

// -----------------------------------------------------------
// Busca + paginação + tabela
// -----------------------------------------------------------

function encontrarMoradorDaReserva(reserva) {
  return moradoresCarregados.find((morador) => String(morador.id) === String(reserva.moradorId));
}

function obterReservasFiltradas() {
  if (termoBusca === "") {
    return reservasCarregadas;
  }

  const termo = termoBusca.toLowerCase();
  const filtradas = [];

  for (const reserva of reservasCarregadas) {
    const morador = encontrarMoradorDaReserva(reserva);
    const nomeMorador = morador ? morador.nome.toLowerCase() : "";

    if (nomeMorador.includes(termo) || reserva.area.toLowerCase().includes(termo)) {
      filtradas.push(reserva);
    }
  }

  return filtradas;
}

function renderizarTabela() {
  corpoTabela.innerHTML = "";

  if (reservasCarregadas.length === 0) {
    corpoTabela.appendChild(criarLinhaVazia("Nenhuma reserva cadastrada."));
    elementoPaginacao.classList.add("oculto");
    return;
  }

  const filtradas = obterReservasFiltradas();

  if (filtradas.length === 0) {
    corpoTabela.appendChild(criarLinhaVazia("Nenhuma reserva encontrada para a busca informada."));
    elementoPaginacao.classList.add("oculto");
    return;
  }

  const totalPaginas = Math.ceil(filtradas.length / ITENS_POR_PAGINA);

  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }
  if (paginaAtual < 1) {
    paginaAtual = 1;
  }

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const itensDaPagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  for (const reserva of itensDaPagina) {
    corpoTabela.appendChild(criarLinhaReserva(reserva));
  }

  elementoPaginacao.classList.remove("oculto");
  textoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

function criarLinhaVazia(texto) {
  const linha = document.createElement("tr");
  linha.className = "tabela__vazio";
  linha.innerHTML = `<td colspan="6">${texto}</td>`;
  return linha;
}

// O status armazenado nunca muda sozinho (só pelo botão Cancelar, conforme o enunciado).
// Aqui só decidimos como EXIBIR a linha: uma reserva confirmada de um morador que virou
// inativo aparece visualmente como cancelada, pra não parecer que a data ainda está ocupada.
function obterApresentacaoDeStatus(reserva, morador) {
  if (reserva.status === "cancelada") {
    return { rotulo: "cancelada", classeBadge: "badge-situacao--cancelada", podeCancelar: false };
  }

  const moradorInativo = morador ? !morador.ativo : false;

  if (moradorInativo) {
    return {
      rotulo: "cancelada (morador inativo)",
      classeBadge: "badge-situacao--cancelada",
      podeCancelar: false
    };
  }

  return { rotulo: "confirmada", classeBadge: "badge-situacao--confirmada", podeCancelar: true };
}

function criarLinhaReserva(reserva) {
  const linha = document.createElement("tr");

  const morador = encontrarMoradorDaReserva(reserva);
  const unidade = morador
    ? unidadesCarregadas.find((u) => String(u.id) === String(morador.unidadeId))
    : null;

  const celulaMorador = document.createElement("td");
  celulaMorador.textContent = morador ? morador.nome : "morador removido";

  const celulaUnidade = document.createElement("td");
  celulaUnidade.textContent = unidade ? `${unidade.numero}/${unidade.bloco}` : "—";

  const celulaArea = document.createElement("td");
  celulaArea.textContent = reserva.area;

  const celulaData = document.createElement("td");
  celulaData.textContent = formatarDataParaExibicao(reserva.data);

  const apresentacao = obterApresentacaoDeStatus(reserva, morador);

  const celulaStatus = document.createElement("td");
  celulaStatus.innerHTML = `<span class="badge-situacao ${apresentacao.classeBadge}">${apresentacao.rotulo}</span>`;

  const celulaAcoes = document.createElement("td");
  celulaAcoes.className = "tabela__acoes";

  if (apresentacao.podeCancelar) {
    const botaoCancelar = document.createElement("button");
    botaoCancelar.type = "button";
    botaoCancelar.className = "botao-pequeno botao-pequeno--perigo";
    botaoCancelar.textContent = "Cancelar";
    botaoCancelar.addEventListener("click", () => prepararCancelamento(reserva));
    celulaAcoes.appendChild(botaoCancelar);
  } else {
    const textoSomenteLeitura = document.createElement("span");
    textoSomenteLeitura.className = "tabela__somente-leitura";
    textoSomenteLeitura.textContent = "Somente leitura";
    celulaAcoes.appendChild(textoSomenteLeitura);
  }

  linha.appendChild(celulaMorador);
  linha.appendChild(celulaUnidade);
  linha.appendChild(celulaArea);
  linha.appendChild(celulaData);
  linha.appendChild(celulaStatus);
  linha.appendChild(celulaAcoes);

  return linha;
}

function formatarDataParaExibicao(data) {
  const partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obterDataDeHojeComoString() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// -----------------------------------------------------------
// Modal de nova reserva
// -----------------------------------------------------------

function obterMoradoresAtivos() {
  const ativos = [];

  for (const morador of moradoresCarregados) {
    if (morador.ativo) {
      ativos.push(morador);
    }
  }

  return ativos;
}

function prepararSelectMoradores(moradoresAtivos) {
  campoMorador.innerHTML = "";

  const opcaoPlaceholder = document.createElement("option");
  opcaoPlaceholder.value = "";
  opcaoPlaceholder.textContent = "Selecione um morador";
  opcaoPlaceholder.disabled = true;
  opcaoPlaceholder.selected = true;
  campoMorador.appendChild(opcaoPlaceholder);

  for (const morador of moradoresAtivos) {
    const opcao = document.createElement("option");
    opcao.value = String(morador.id);
    opcao.textContent = morador.nome;
    campoMorador.appendChild(opcao);
  }
}

function abrirModalNovaReserva() {
  limparErrosFormulario();
  formulario.reset();

  const moradoresAtivos = obterMoradoresAtivos();
  prepararSelectMoradores(moradoresAtivos);

  const semMoradoresAtivos = moradoresAtivos.length === 0;
  avisoSemMoradores.classList.toggle("oculto", !semMoradoresAtivos);
  formulario.classList.toggle("oculto", semMoradoresAtivos);

  campoData.min = obterDataDeHojeComoString();

  overlayFormulario.classList.remove("oculto");

  if (!semMoradoresAtivos) {
    campoMorador.focus();
  }
}

function fecharModalFormulario() {
  overlayFormulario.classList.add("oculto");
}

function limparErrosFormulario() {
  erroMorador.textContent = "";
  erroData.textContent = "";
  erroConflito.textContent = "";
}

// Reservas confirmadas de moradores inativos, ou com data já passada, não bloqueiam
// mais o slot: o morador inativo "liberou" a data para outros moradores usarem
function encontrarConflitoDeAgenda(area, data) {
  const hoje = obterDataDeHojeComoString();

  for (const reserva of reservasCarregadas) {
    if (reserva.status !== "confirmada" || reserva.area !== area || reserva.data !== data) {
      continue;
    }

    if (reserva.data < hoje) {
      continue;
    }

    const moradorDaReserva = encontrarMoradorDaReserva(reserva);
    if (moradorDaReserva && moradorDaReserva.ativo) {
      return reserva;
    }
  }

  return null;
}

function validarFormulario() {
  limparErrosFormulario();
  let valido = true;

  const moradorId = campoMorador.value;
  const area = campoArea.value;
  const data = campoData.value;

  if (moradorId === "") {
    erroMorador.textContent = "Selecione um morador.";
    valido = false;
  }

  if (data === "") {
    erroData.textContent = "Informe a data da reserva.";
    valido = false;
  } else if (data < obterDataDeHojeComoString()) {
    erroData.textContent = "A data não pode ser anterior à data atual.";
    valido = false;
  }

  if (valido) {
    const conflito = encontrarConflitoDeAgenda(area, data);

    if (conflito) {
      erroConflito.textContent = `Já existe uma reserva confirmada para "${area}" em ${formatarDataParaExibicao(data)}.`;
      valido = false;
    }
  }

  return valido;
}

async function aoSubmeterFormulario(evento) {
  evento.preventDefault();

  if (!validarFormulario()) {
    return;
  }

  const dadosReserva = {
    moradorId: campoMorador.value,
    area: campoArea.value,
    data: campoData.value,
    status: "confirmada"
  };

  try {
    const resposta = await fetch(`${URL_BASE}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosReserva)
    });

    if (!resposta.ok) {
      throw new Error("Falha ao criar reserva.");
    }

    fecharModalFormulario();
    await recarregarReservas();
    mostrarMensagem("sucesso", "Reserva criada com sucesso.");
  } catch (erro) {
    console.error("Falha ao criar reserva:", erro);
    mostrarMensagem("erro", "Não foi possível criar a reserva. Tente novamente.");
  }
}

// -----------------------------------------------------------
// Cancelamento (com confirmação)
// -----------------------------------------------------------

function prepararCancelamento(reserva) {
  const morador = encontrarMoradorDaReserva(reserva);
  const nomeMorador = morador ? morador.nome : "morador removido";

  idReservaParaCancelar = reserva.id;
  textoConfirmacao.textContent =
    `Tem certeza que deseja cancelar a reserva de ${nomeMorador} para ${reserva.area} em ${formatarDataParaExibicao(reserva.data)}?`;

  overlayConfirmacao.classList.remove("oculto");
}

function fecharModalConfirmacao() {
  overlayConfirmacao.classList.add("oculto");
  idReservaParaCancelar = null;
}

async function confirmarCancelamento() {
  if (idReservaParaCancelar === null) {
    return;
  }

  try {
    const resposta = await fetch(`${URL_BASE}/reservas/${idReservaParaCancelar}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelada" })
    });

    if (!resposta.ok) {
      throw new Error("Falha ao cancelar reserva.");
    }

    fecharModalConfirmacao();
    await recarregarReservas();
    mostrarMensagem("sucesso", "Reserva cancelada com sucesso.");
  } catch (erro) {
    console.error("Falha ao cancelar reserva:", erro);
    fecharModalConfirmacao();
    mostrarMensagem("erro", "Não foi possível cancelar a reserva. Tente novamente.");
  }
}

// -----------------------------------------------------------
// Mensagem (banner fixo até ser fechado ou substituído)
// -----------------------------------------------------------

function mostrarMensagem(tipo, texto) {
  const prefixo = tipo === "sucesso" ? "✓" : "✕";
  mensagemTexto.textContent = `${prefixo} ${texto}`;

  mensagemElemento.classList.remove("mensagem--sucesso", "mensagem--erro", "oculto");
  mensagemElemento.classList.add(tipo === "sucesso" ? "mensagem--sucesso" : "mensagem--erro");

  mensagemElemento.style.animation = "none";
  void mensagemElemento.offsetWidth;
  mensagemElemento.style.animation = "";

  mensagemElemento.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fecharMensagem() {
  mensagemElemento.classList.add("oculto");
}

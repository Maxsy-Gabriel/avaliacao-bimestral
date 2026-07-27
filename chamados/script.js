const URL_BASE = "http://localhost:3000";
const ITENS_POR_PAGINA = 10;
const SEQUENCIA_STATUS = ["aberto", "em andamento", "resolvido"];

let chamadosCarregados = [];
let moradoresCarregados = [];

let termoBusca = "";
let categoriaSelecionada = "";
let paginaAtual = 1;
let chamadoParaAvancar = null;

const elementoCarregando = document.getElementById("estado-carregando");
const elementoErro = document.getElementById("estado-erro");
const elementoPainel = document.getElementById("painel");
const corpoTabela = document.getElementById("corpo-tabela-chamados");
const campoBusca = document.getElementById("campo-busca");
const campoFiltroCategoria = document.getElementById("campo-filtro-categoria");

const elementoPaginacao = document.getElementById("paginacao");
const textoPagina = document.getElementById("texto-pagina");
const botaoPaginaAnterior = document.getElementById("botao-pagina-anterior");
const botaoPaginaProxima = document.getElementById("botao-pagina-proxima");

const mensagemElemento = document.getElementById("mensagem");
const mensagemTexto = document.getElementById("mensagem-texto");
const botaoFecharMensagem = document.getElementById("botao-fechar-mensagem");

const botaoNovoChamado = document.getElementById("botao-novo-chamado");

const overlayFormulario = document.getElementById("overlay-formulario");
const formulario = document.getElementById("formulario-chamado");
const avisoSemMoradores = document.getElementById("aviso-sem-moradores");
const campoMorador = document.getElementById("campo-morador");
const campoCategoria = document.getElementById("campo-categoria");
const campoDescricao = document.getElementById("campo-descricao");
const erroMorador = document.getElementById("erro-morador");
const erroDescricao = document.getElementById("erro-descricao");
const botaoFecharFormulario = document.getElementById("botao-fechar-formulario");
const botaoCancelarFormulario = document.getElementById("botao-cancelar-formulario");

const overlayConfirmacao = document.getElementById("overlay-confirmacao");
const textoConfirmacao = document.getElementById("texto-confirmacao");
const botaoVoltarConfirmacao = document.getElementById("botao-voltar-confirmacao");
const botaoConfirmarAvanco = document.getElementById("botao-confirmar-avanco");

document.addEventListener("DOMContentLoaded", iniciarPagina);
document.getElementById("botao-tentar-novamente").addEventListener("click", iniciarPagina);

campoBusca.addEventListener("input", () => {
  termoBusca = campoBusca.value.trim();
  paginaAtual = 1;
  renderizarTabela();
});

campoFiltroCategoria.addEventListener("change", () => {
  categoriaSelecionada = campoFiltroCategoria.value;
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

botaoNovoChamado.addEventListener("click", abrirModalNovoChamado);
botaoFecharFormulario.addEventListener("click", fecharModalFormulario);
botaoCancelarFormulario.addEventListener("click", fecharModalFormulario);
formulario.addEventListener("submit", aoSubmeterFormulario);

botaoVoltarConfirmacao.addEventListener("click", fecharModalConfirmacao);
botaoConfirmarAvanco.addEventListener("click", confirmarAvancoDeStatus);

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
    chamadosCarregados = dados.chamados;
    moradoresCarregados = dados.moradores;
  } catch (erro) {
    console.error("Falha ao carregar chamados:", erro);
    mostrarApenas(elementoErro);
    return;
  }

  renderizarTabela();
  mostrarApenas(elementoPainel);
}

async function buscarDados() {
  const respostaChamados = await fetch(`${URL_BASE}/chamados`);
  const respostaMoradores = await fetch(`${URL_BASE}/moradores`);

  if (!respostaChamados.ok || !respostaMoradores.ok) {
    throw new Error("Falha ao buscar dados do servidor.");
  }

  const chamados = await respostaChamados.json();
  const moradores = await respostaMoradores.json();

  return { chamados, moradores };
}

// Recarrega os dados após criar/avançar status, sem exibir o spinner de tela cheia
async function recarregarChamados() {
  const dados = await buscarDados();
  chamadosCarregados = dados.chamados;
  moradoresCarregados = dados.moradores;
  renderizarTabela();
}

function mostrarApenas(elementoParaMostrar) {
  elementoCarregando.classList.add("oculto");
  elementoErro.classList.add("oculto");
  elementoPainel.classList.add("oculto");
  elementoParaMostrar.classList.remove("oculto");
}

// -----------------------------------------------------------
// Busca + filtro + paginação + tabela
// -----------------------------------------------------------

function encontrarMoradorDoChamado(chamado) {
  return moradoresCarregados.find((morador) => String(morador.id) === String(chamado.moradorId));
}

function obterChamadosFiltrados() {
  const termo = termoBusca.toLowerCase();
  const filtrados = [];

  for (const chamado of chamadosCarregados) {
    const morador = encontrarMoradorDoChamado(chamado);
    const nomeMorador = morador ? morador.nome.toLowerCase() : "";

    const combinaBusca = termo === "" || nomeMorador.includes(termo);
    const combinaCategoria = categoriaSelecionada === "" || chamado.categoria === categoriaSelecionada;

    if (combinaBusca && combinaCategoria) {
      filtrados.push(chamado);
    }
  }

  return filtrados;
}

function renderizarTabela() {
  corpoTabela.innerHTML = "";

  if (chamadosCarregados.length === 0) {
    corpoTabela.appendChild(criarLinhaVazia("Nenhum chamado cadastrado."));
    elementoPaginacao.classList.add("oculto");
    return;
  }

  const filtrados = obterChamadosFiltrados();

  if (filtrados.length === 0) {
    corpoTabela.appendChild(criarLinhaVazia("Nenhum chamado corresponde à busca/filtro informado."));
    elementoPaginacao.classList.add("oculto");
    return;
  }

  const totalPaginas = Math.ceil(filtrados.length / ITENS_POR_PAGINA);

  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }
  if (paginaAtual < 1) {
    paginaAtual = 1;
  }

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const itensDaPagina = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  for (const chamado of itensDaPagina) {
    corpoTabela.appendChild(criarLinhaChamado(chamado));
  }

  elementoPaginacao.classList.remove("oculto");
  textoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

function criarLinhaVazia(texto) {
  const linha = document.createElement("tr");
  linha.className = "tabela__vazio";
  linha.innerHTML = `<td colspan="7">${texto}</td>`;
  return linha;
}

function truncarDescricao(texto) {
  const LIMITE = 60;

  if (texto.length <= LIMITE) {
    return texto;
  }

  return `${texto.slice(0, LIMITE).trim()}...`;
}

// Só desenha o progresso aberto → em andamento → resolvido; não recalcula nada,
// usa a mesma SEQUENCIA_STATUS que já existia
function criarStepperMini(status) {
  const indiceAtual = SEQUENCIA_STATUS.indexOf(status);
  let pontos = "";

  for (let i = 0; i < SEQUENCIA_STATUS.length; i = i + 1) {
    const classeExtra = i <= indiceAtual ? " stepper-mini__ponto--cheio" : "";
    pontos += `<span class="stepper-mini__ponto${classeExtra}"></span>`;
  }

  return `<div class="stepper-mini" aria-hidden="true">${pontos}</div>`;
}

function obterClasseBadgeDeStatus(status) {
  if (status === "aberto") {
    return "badge-situacao--aberto";
  }
  if (status === "em andamento") {
    return "badge-situacao--andamento";
  }
  return "badge-situacao--resolvido";
}

function criarLinhaChamado(chamado) {
  const linha = document.createElement("tr");

  const morador = encontrarMoradorDoChamado(chamado);

  const celulaMorador = document.createElement("td");
  celulaMorador.textContent = morador ? morador.nome : "morador removido";

  const celulaCategoria = document.createElement("td");
  celulaCategoria.className = "tabela__categoria";
  celulaCategoria.textContent = chamado.categoria;

  const celulaDescricao = document.createElement("td");
  celulaDescricao.className = "tabela__descricao";
  celulaDescricao.textContent = truncarDescricao(chamado.descricao);
  celulaDescricao.title = chamado.descricao;

  const celulaDataAbertura = document.createElement("td");
  celulaDataAbertura.textContent = formatarDataParaExibicao(chamado.dataAbertura);

  const celulaDataResolucao = document.createElement("td");
  celulaDataResolucao.textContent = chamado.dataResolucao ? formatarDataParaExibicao(chamado.dataResolucao) : "—";

  const celulaStatus = document.createElement("td");
  const classeBadge = obterClasseBadgeDeStatus(chamado.status);
  celulaStatus.innerHTML = `
    <div class="celula-status">
      <span class="badge-situacao ${classeBadge}">${chamado.status}</span>
      ${criarStepperMini(chamado.status)}
    </div>
  `;

  const celulaAcoes = document.createElement("td");
  const areaAcoes = document.createElement("div");
  areaAcoes.className = "tabela__acoes";

  if (chamado.status === "resolvido") {
    const textoSomenteLeitura = document.createElement("span");
    textoSomenteLeitura.className = "tabela__somente-leitura";
    textoSomenteLeitura.textContent = "Somente leitura";
    areaAcoes.appendChild(textoSomenteLeitura);
  } else {
    const botaoAvancar = document.createElement("button");
    botaoAvancar.type = "button";
    botaoAvancar.className = "botao-pequeno";
    botaoAvancar.textContent = "Avançar status";
    botaoAvancar.addEventListener("click", () => prepararAvancoDeStatus(chamado));
    areaAcoes.appendChild(botaoAvancar);
  }

  celulaAcoes.appendChild(areaAcoes);

  linha.appendChild(celulaMorador);
  linha.appendChild(celulaCategoria);
  linha.appendChild(celulaDescricao);
  linha.appendChild(celulaDataAbertura);
  linha.appendChild(celulaDataResolucao);
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
// Modal de novo chamado
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

function abrirModalNovoChamado() {
  limparErrosFormulario();
  formulario.reset();

  const moradoresAtivos = obterMoradoresAtivos();
  prepararSelectMoradores(moradoresAtivos);

  const semMoradoresAtivos = moradoresAtivos.length === 0;
  avisoSemMoradores.classList.toggle("oculto", !semMoradoresAtivos);
  formulario.classList.toggle("oculto", semMoradoresAtivos);

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
  erroDescricao.textContent = "";
}

function validarFormulario() {
  limparErrosFormulario();
  let valido = true;

  const moradorId = campoMorador.value;
  const descricao = campoDescricao.value.trim();

  if (moradorId === "") {
    erroMorador.textContent = "Selecione um morador.";
    valido = false;
  }

  if (descricao === "") {
    erroDescricao.textContent = "Informe a descrição do chamado.";
    valido = false;
  }

  return valido;
}

async function aoSubmeterFormulario(evento) {
  evento.preventDefault();

  if (!validarFormulario()) {
    return;
  }

  const dadosChamado = {
    moradorId: campoMorador.value,
    categoria: campoCategoria.value,
    descricao: campoDescricao.value.trim(),
    status: "aberto",
    dataAbertura: obterDataDeHojeComoString(),
    dataResolucao: null
  };

  try {
    const resposta = await fetch(`${URL_BASE}/chamados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosChamado)
    });

    if (!resposta.ok) {
      throw new Error("Falha ao registrar chamado.");
    }

    fecharModalFormulario();
    await recarregarChamados();
    mostrarMensagem("sucesso", "Chamado registrado com sucesso.");
  } catch (erro) {
    console.error("Falha ao registrar chamado:", erro);
    mostrarMensagem("erro", "Não foi possível registrar o chamado. Tente novamente.");
  }
}

// -----------------------------------------------------------
// Avançar status (com confirmação)
// -----------------------------------------------------------

function obterProximoStatus(statusAtual) {
  const indiceAtual = SEQUENCIA_STATUS.indexOf(statusAtual);
  return SEQUENCIA_STATUS[indiceAtual + 1];
}

function prepararAvancoDeStatus(chamado) {
  chamadoParaAvancar = chamado;
  const proximoStatus = obterProximoStatus(chamado.status);

  textoConfirmacao.textContent =
    `Tem certeza que deseja avançar o status deste chamado de "${chamado.status}" para "${proximoStatus}"?`;

  overlayConfirmacao.classList.remove("oculto");
}

function fecharModalConfirmacao() {
  overlayConfirmacao.classList.add("oculto");
  chamadoParaAvancar = null;
}

async function confirmarAvancoDeStatus() {
  if (chamadoParaAvancar === null) {
    return;
  }

  const proximoStatus = obterProximoStatus(chamadoParaAvancar.status);
  const dadosAtualizados = { status: proximoStatus };

  if (proximoStatus === "resolvido") {
    dadosAtualizados.dataResolucao = obterDataDeHojeComoString();
  }

  try {
    const resposta = await fetch(`${URL_BASE}/chamados/${chamadoParaAvancar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosAtualizados)
    });

    if (!resposta.ok) {
      throw new Error("Falha ao avançar status do chamado.");
    }

    fecharModalConfirmacao();
    await recarregarChamados();
    mostrarMensagem("sucesso", `Status do chamado avançado para "${proximoStatus}".`);
  } catch (erro) {
    console.error("Falha ao avançar status do chamado:", erro);
    fecharModalConfirmacao();
    mostrarMensagem("erro", "Não foi possível avançar o status do chamado. Tente novamente.");
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

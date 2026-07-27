const URL_BASE = "http://localhost:3000";

let moradoresCarregados = [];
let unidadesCarregadas = [];
let idMoradorEmEdicao = null;
let acaoConfirmacaoPendente = null;

const elementoCarregando = document.getElementById("estado-carregando");
const elementoErro = document.getElementById("estado-erro");
const elementoPainel = document.getElementById("painel");
const corpoTabela = document.getElementById("corpo-tabela-moradores");

const mensagemElemento = document.getElementById("mensagem");
const mensagemTexto = document.getElementById("mensagem-texto");
const botaoFecharMensagem = document.getElementById("botao-fechar-mensagem");

const botaoNovoMorador = document.getElementById("botao-novo-morador");

const overlayFormulario = document.getElementById("overlay-formulario");
const formulario = document.getElementById("formulario-morador");
const tituloModalFormulario = document.getElementById("titulo-modal-formulario");
const avisoSemUnidades = document.getElementById("aviso-sem-unidades");
const campoNome = document.getElementById("campo-nome");
const campoCpf = document.getElementById("campo-cpf");
const campoTelefone = document.getElementById("campo-telefone");
const campoUnidade = document.getElementById("campo-unidade");
const erroNome = document.getElementById("erro-nome");
const erroCpf = document.getElementById("erro-cpf");
const erroTelefone = document.getElementById("erro-telefone");
const erroUnidade = document.getElementById("erro-unidade");
const botaoFecharFormulario = document.getElementById("botao-fechar-formulario");
const botaoCancelarFormulario = document.getElementById("botao-cancelar-formulario");

const overlayConfirmacao = document.getElementById("overlay-confirmacao");
const tituloModalConfirmacao = document.getElementById("titulo-modal-confirmacao");
const textoConfirmacao = document.getElementById("texto-confirmacao");
const botaoCancelarConfirmacao = document.getElementById("botao-cancelar-confirmacao");
const botaoConfirmarAcao = document.getElementById("botao-confirmar-acao");

document.addEventListener("DOMContentLoaded", iniciarPagina);
document.getElementById("botao-tentar-novamente").addEventListener("click", iniciarPagina);

botaoNovoMorador.addEventListener("click", abrirModalNovoMorador);
botaoFecharFormulario.addEventListener("click", fecharModalFormulario);
botaoCancelarFormulario.addEventListener("click", fecharModalFormulario);
formulario.addEventListener("submit", aoSubmeterFormulario);

campoCpf.addEventListener("input", aplicarMascaraCpf);
campoTelefone.addEventListener("input", aplicarMascaraTelefone);

botaoCancelarConfirmacao.addEventListener("click", fecharModalConfirmacao);
botaoConfirmarAcao.addEventListener("click", executarAcaoConfirmada);

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
    moradoresCarregados = dados.moradores;
    unidadesCarregadas = dados.unidades;
  } catch (erro) {
    console.error("Falha ao carregar moradores:", erro);
    mostrarApenas(elementoErro);
    return;
  }

  renderizarTabela();
  mostrarApenas(elementoPainel);
}

async function buscarDados() {
  const respostaMoradores = await fetch(`${URL_BASE}/moradores`);
  const respostaUnidades = await fetch(`${URL_BASE}/unidades`);

  if (!respostaMoradores.ok || !respostaUnidades.ok) {
    throw new Error("Falha ao buscar dados do servidor.");
  }

  const moradores = await respostaMoradores.json();
  const unidades = await respostaUnidades.json();

  return { moradores, unidades };
}

// Recarrega os dados após criar/editar/inativar/reativar, sem exibir o spinner de tela cheia
async function recarregarMoradores() {
  const dados = await buscarDados();
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
// Tabela
// -----------------------------------------------------------

function renderizarTabela() {
  corpoTabela.innerHTML = "";

  if (moradoresCarregados.length === 0) {
    const linha = document.createElement("tr");
    linha.className = "tabela__vazio";
    linha.innerHTML = `<td colspan="6">Nenhum morador cadastrado.</td>`;
    corpoTabela.appendChild(linha);
    return;
  }

  for (const morador of moradoresCarregados) {
    corpoTabela.appendChild(criarLinhaMorador(morador));
  }
}

function encontrarUnidadeDoMorador(morador) {
  return unidadesCarregadas.find((unidade) => String(unidade.id) === String(morador.unidadeId));
}

function criarLinhaMorador(morador) {
  const linha = document.createElement("tr");

  const celulaNome = document.createElement("td");
  celulaNome.textContent = morador.nome;

  const celulaCpf = document.createElement("td");
  celulaCpf.textContent = morador.cpf;

  const celulaTelefone = document.createElement("td");
  celulaTelefone.textContent = morador.telefone;

  const celulaUnidade = document.createElement("td");
  const unidade = encontrarUnidadeDoMorador(morador);
  celulaUnidade.textContent = unidade ? `${unidade.numero}/${unidade.bloco}` : "—";

  const celulaSituacao = document.createElement("td");
  const classeBadge = morador.ativo ? "badge-situacao--ativo" : "badge-situacao--inativo";
  const rotuloBadge = morador.ativo ? "Ativo" : "Inativo";
  celulaSituacao.innerHTML = `<span class="badge-situacao ${classeBadge}">${rotuloBadge}</span>`;

  const celulaAcoes = document.createElement("td");
  celulaAcoes.className = "tabela__acoes";

  const botaoEditar = document.createElement("button");
  botaoEditar.type = "button";
  botaoEditar.className = "botao-pequeno";
  botaoEditar.textContent = "Editar";
  botaoEditar.addEventListener("click", () => abrirModalEditarMorador(morador));

  const botaoToggle = document.createElement("button");
  botaoToggle.type = "button";
  if (morador.ativo) {
    botaoToggle.className = "botao-pequeno botao-pequeno--perigo";
    botaoToggle.textContent = "Inativar";
    botaoToggle.addEventListener("click", () => prepararConfirmacaoToggle(morador, false));
  } else {
    botaoToggle.className = "botao-pequeno botao-pequeno--positivo";
    botaoToggle.textContent = "Reativar";
    botaoToggle.addEventListener("click", () => prepararConfirmacaoToggle(morador, true));
  }

  celulaAcoes.appendChild(botaoEditar);
  celulaAcoes.appendChild(botaoToggle);

  linha.appendChild(celulaNome);
  linha.appendChild(celulaCpf);
  linha.appendChild(celulaTelefone);
  linha.appendChild(celulaUnidade);
  linha.appendChild(celulaSituacao);
  linha.appendChild(celulaAcoes);

  return linha;
}

// -----------------------------------------------------------
// Modal de cadastro/edição
// -----------------------------------------------------------

function prepararSelectUnidades() {
  campoUnidade.innerHTML = "";

  // Placeholder não selecionável: obriga uma escolha explícita em vez de cair
  // silenciosamente na primeira unidade da lista
  const opcaoPlaceholder = document.createElement("option");
  opcaoPlaceholder.value = "";
  opcaoPlaceholder.textContent = "Selecione uma unidade";
  opcaoPlaceholder.disabled = true;
  opcaoPlaceholder.selected = true;
  campoUnidade.appendChild(opcaoPlaceholder);

  for (const unidade of unidadesCarregadas) {
    const opcao = document.createElement("option");
    opcao.value = String(unidade.id);
    opcao.textContent = `${unidade.numero}/${unidade.bloco}`;
    campoUnidade.appendChild(opcao);
  }
}

// Sem nenhuma unidade cadastrada, o formulário fica escondido e um aviso orienta o usuário
function atualizarVisibilidadeFormulario() {
  const semUnidades = unidadesCarregadas.length === 0;
  avisoSemUnidades.classList.toggle("oculto", !semUnidades);
  formulario.classList.toggle("oculto", semUnidades);
}

function abrirModalNovoMorador() {
  idMoradorEmEdicao = null;
  tituloModalFormulario.textContent = "Novo morador";
  formulario.reset();
  limparErrosFormulario();
  prepararSelectUnidades();
  atualizarVisibilidadeFormulario();
  overlayFormulario.classList.remove("oculto");

  if (unidadesCarregadas.length > 0) {
    campoNome.focus();
  }
}

function abrirModalEditarMorador(morador) {
  idMoradorEmEdicao = morador.id;
  tituloModalFormulario.textContent = "Editar morador";
  limparErrosFormulario();
  prepararSelectUnidades();

  campoNome.value = morador.nome;
  campoCpf.value = morador.cpf;
  campoTelefone.value = morador.telefone;
  campoUnidade.value = String(morador.unidadeId);

  atualizarVisibilidadeFormulario();
  overlayFormulario.classList.remove("oculto");

  if (unidadesCarregadas.length > 0) {
    campoNome.focus();
  }
}

function fecharModalFormulario() {
  overlayFormulario.classList.add("oculto");
}

function limparErrosFormulario() {
  erroNome.textContent = "";
  erroCpf.textContent = "";
  erroTelefone.textContent = "";
  erroUnidade.textContent = "";
}

// -----------------------------------------------------------
// Máscaras (CPF e telefone), aplicadas conforme o usuário digita
// -----------------------------------------------------------

function apenasDigitos(valor) {
  return valor.replace(/\D/g, "");
}

function aplicarMascaraCpf() {
  const digitos = apenasDigitos(campoCpf.value).slice(0, 11);
  let formatado = digitos;

  if (digitos.length > 9) {
    formatado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
  } else if (digitos.length > 6) {
    formatado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  } else if (digitos.length > 3) {
    formatado = `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  }

  campoCpf.value = formatado;
}

function aplicarMascaraTelefone() {
  const digitos = apenasDigitos(campoTelefone.value).slice(0, 11);
  let formatado = digitos;

  if (digitos.length > 10) {
    formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  } else if (digitos.length > 6) {
    formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  } else if (digitos.length > 2) {
    formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  } else if (digitos.length > 0) {
    formatado = `(${digitos}`;
  }

  campoTelefone.value = formatado;
}

// -----------------------------------------------------------
// Validação e envio do formulário
// -----------------------------------------------------------

function validarFormulario() {
  limparErrosFormulario();
  let valido = true;

  const nome = campoNome.value.trim();
  const cpfDigitos = apenasDigitos(campoCpf.value);
  const telefone = campoTelefone.value.trim();
  const unidadeId = campoUnidade.value;

  if (nome === "") {
    erroNome.textContent = "Informe o nome do morador.";
    valido = false;
  } else if (!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(nome)) {
    erroNome.textContent = "Nome deve ser um texto (não pode ser apenas números).";
    valido = false;
  }

  if (cpfDigitos.length === 0) {
    erroCpf.textContent = "Informe o CPF do morador.";
    valido = false;
  } else if (cpfDigitos.length !== 11) {
    erroCpf.textContent = "CPF incompleto. Preencha os 11 números.";
    valido = false;
  } else {
    for (const morador of moradoresCarregados) {
      const mesmoCpf = apenasDigitos(morador.cpf) === cpfDigitos;
      const mesmoRegistro = String(morador.id) === String(idMoradorEmEdicao);

      if (mesmoCpf && !mesmoRegistro) {
        erroCpf.textContent = "Já existe um morador com esse CPF.";
        valido = false;
        break;
      }
    }
  }

  if (telefone === "") {
    erroTelefone.textContent = "Informe o telefone do morador.";
    valido = false;
  }

  if (unidadeId === "") {
    erroUnidade.textContent = "Selecione uma unidade.";
    valido = false;
  }

  return valido;
}

async function aoSubmeterFormulario(evento) {
  evento.preventDefault();

  if (!validarFormulario()) {
    return;
  }

  const dadosMorador = {
    nome: campoNome.value.trim(),
    cpf: campoCpf.value.trim(),
    telefone: campoTelefone.value.trim(),
    unidadeId: campoUnidade.value
  };

  try {
    let resposta;

    if (idMoradorEmEdicao === null) {
      dadosMorador.ativo = true;

      resposta = await fetch(`${URL_BASE}/moradores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosMorador)
      });
    } else {
      const moradorAtual = moradoresCarregados.find((m) => String(m.id) === String(idMoradorEmEdicao));
      dadosMorador.ativo = moradorAtual ? moradorAtual.ativo : true;

      resposta = await fetch(`${URL_BASE}/moradores/${idMoradorEmEdicao}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosMorador)
      });
    }

    if (!resposta.ok) {
      throw new Error("Falha ao salvar morador.");
    }

    const mensagemSucesso = idMoradorEmEdicao === null
      ? "Morador cadastrado com sucesso."
      : "Morador atualizado com sucesso.";

    fecharModalFormulario();
    await recarregarMoradores();
    mostrarMensagem("sucesso", mensagemSucesso);
  } catch (erro) {
    console.error("Falha ao salvar morador:", erro);
    mostrarMensagem("erro", "Não foi possível salvar o morador. Tente novamente.");
  }
}

// -----------------------------------------------------------
// Inativar / reativar (com confirmação)
// -----------------------------------------------------------

function prepararConfirmacaoToggle(morador, novoValorAtivo) {
  acaoConfirmacaoPendente = { id: morador.id, novoValorAtivo };

  if (novoValorAtivo) {
    tituloModalConfirmacao.textContent = "Confirmar reativação";
    textoConfirmacao.textContent = `Tem certeza que deseja reativar o morador ${morador.nome}?`;
    botaoConfirmarAcao.textContent = "Reativar";
    botaoConfirmarAcao.className = "botao-primario";
  } else {
    tituloModalConfirmacao.textContent = "Confirmar inativação";
    textoConfirmacao.textContent =
      `Tem certeza que deseja inativar o morador ${morador.nome}? Ele deixará de poder ser selecionado em novas reservas e chamados.`;
    botaoConfirmarAcao.textContent = "Inativar";
    botaoConfirmarAcao.className = "botao-perigo";
  }

  overlayConfirmacao.classList.remove("oculto");
}

function fecharModalConfirmacao() {
  overlayConfirmacao.classList.add("oculto");
  acaoConfirmacaoPendente = null;
}

async function executarAcaoConfirmada() {
  if (acaoConfirmacaoPendente === null) {
    return;
  }

  const { id, novoValorAtivo } = acaoConfirmacaoPendente;

  try {
    const resposta = await fetch(`${URL_BASE}/moradores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: novoValorAtivo })
    });

    if (!resposta.ok) {
      throw new Error("Falha ao atualizar situação do morador.");
    }

    fecharModalConfirmacao();
    await recarregarMoradores();
    mostrarMensagem("sucesso", novoValorAtivo ? "Morador reativado com sucesso." : "Morador inativado com sucesso.");
  } catch (erro) {
    console.error("Falha ao atualizar situação do morador:", erro);
    fecharModalConfirmacao();
    mostrarMensagem("erro", "Não foi possível atualizar a situação do morador. Tente novamente.");
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

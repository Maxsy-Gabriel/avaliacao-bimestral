const URL_BASE = "http://localhost:3000";

let unidadesCarregadas = [];
let moradoresCarregados = [];
let idUnidadeEmEdicao = null;
let idUnidadeParaExcluir = null;

const GLIFOS_POR_TIPO = {
  "apartamento": "▤",
  "casa": "⌂"
};

const elementoCarregando = document.getElementById("estado-carregando");
const elementoErro = document.getElementById("estado-erro");
const elementoPainel = document.getElementById("painel");
const corpoTabela = document.getElementById("corpo-tabela-unidades");

const mensagemElemento = document.getElementById("mensagem");
const mensagemTexto = document.getElementById("mensagem-texto");
const botaoFecharMensagem = document.getElementById("botao-fechar-mensagem");

const botaoNovaUnidade = document.getElementById("botao-nova-unidade");

const overlayFormulario = document.getElementById("overlay-formulario");
const formulario = document.getElementById("formulario-unidade");
const tituloModalFormulario = document.getElementById("titulo-modal-formulario");
const campoNumero = document.getElementById("campo-numero");
const campoBloco = document.getElementById("campo-bloco");
const campoTipo = document.getElementById("campo-tipo");
const erroNumero = document.getElementById("erro-numero");
const erroBloco = document.getElementById("erro-bloco");
const botaoFecharFormulario = document.getElementById("botao-fechar-formulario");
const botaoCancelarFormulario = document.getElementById("botao-cancelar-formulario");

const overlayConfirmacao = document.getElementById("overlay-confirmacao");
const textoConfirmacao = document.getElementById("texto-confirmacao");
const botaoCancelarExclusao = document.getElementById("botao-cancelar-exclusao");
const botaoConfirmarExclusao = document.getElementById("botao-confirmar-exclusao");

document.addEventListener("DOMContentLoaded", iniciarPagina);
document.getElementById("botao-tentar-novamente").addEventListener("click", iniciarPagina);

botaoNovaUnidade.addEventListener("click", abrirModalNovaUnidade);
botaoFecharFormulario.addEventListener("click", fecharModalFormulario);
botaoCancelarFormulario.addEventListener("click", fecharModalFormulario);
formulario.addEventListener("submit", aoSubmeterFormulario);

botaoCancelarExclusao.addEventListener("click", fecharModalConfirmacao);
botaoConfirmarExclusao.addEventListener("click", confirmarExclusao);

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
    unidadesCarregadas = dados.unidades;
    moradoresCarregados = dados.moradores;
  } catch (erro) {
    console.error("Falha ao carregar unidades:", erro);
    mostrarApenas(elementoErro);
    return;
  }

  renderizarTabela();
  mostrarApenas(elementoPainel);
}

async function buscarDados() {
  const respostaUnidades = await fetch(`${URL_BASE}/unidades`);
  const respostaMoradores = await fetch(`${URL_BASE}/moradores`);

  if (!respostaUnidades.ok || !respostaMoradores.ok) {
    throw new Error("Falha ao buscar dados do servidor.");
  }

  const unidades = await respostaUnidades.json();
  const moradores = await respostaMoradores.json();

  return { unidades, moradores };
}

// Recarrega os dados após criar/editar/excluir, sem exibir o spinner de tela cheia.
// Não trata o próprio erro: quem chamar decide a mensagem de feedback exibida.
async function recarregarUnidades() {
  const dados = await buscarDados();
  unidadesCarregadas = dados.unidades;
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
// Tabela
// -----------------------------------------------------------

function renderizarTabela() {
  corpoTabela.innerHTML = "";

  if (unidadesCarregadas.length === 0) {
    const linha = document.createElement("tr");
    linha.className = "tabela__vazio";
    linha.innerHTML = `<td colspan="4">Nenhuma unidade cadastrada.</td>`;
    corpoTabela.appendChild(linha);
    return;
  }

  for (const unidade of unidadesCarregadas) {
    corpoTabela.appendChild(criarLinhaUnidade(unidade));
  }
}

function criarLinhaUnidade(unidade) {
  const linha = document.createElement("tr");

  const celulaNumero = document.createElement("td");
  celulaNumero.textContent = unidade.numero;

  const celulaBloco = document.createElement("td");
  celulaBloco.textContent = unidade.bloco;

  const celulaTipo = document.createElement("td");
  const rotuloTipo = unidade.tipo === "casa" ? "Casa" : "Apartamento";
  celulaTipo.innerHTML = `
    <span class="tabela__tipo">
      <span class="tabela__tipo-glifo" aria-hidden="true">${GLIFOS_POR_TIPO[unidade.tipo] || ""}</span>
      ${rotuloTipo}
    </span>
  `;

  const celulaAcoes = document.createElement("td");
  const areaAcoes = document.createElement("div");
  areaAcoes.className = "tabela__acoes";

  const botaoEditar = document.createElement("button");
  botaoEditar.type = "button";
  botaoEditar.className = "botao-pequeno";
  botaoEditar.textContent = "Editar";
  botaoEditar.addEventListener("click", () => abrirModalEditarUnidade(unidade));

  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "botao-pequeno botao-pequeno--perigo";
  botaoExcluir.textContent = "Excluir";
  botaoExcluir.addEventListener("click", () => prepararExclusao(unidade));

  areaAcoes.appendChild(botaoEditar);
  areaAcoes.appendChild(botaoExcluir);
  celulaAcoes.appendChild(areaAcoes);

  linha.appendChild(celulaNumero);
  linha.appendChild(celulaBloco);
  linha.appendChild(celulaTipo);
  linha.appendChild(celulaAcoes);

  return linha;
}

// -----------------------------------------------------------
// Modal de cadastro/edição
// -----------------------------------------------------------

function abrirModalNovaUnidade() {
  idUnidadeEmEdicao = null;
  tituloModalFormulario.textContent = "Nova unidade";
  formulario.reset();
  limparErrosFormulario();
  overlayFormulario.classList.remove("oculto");
  campoNumero.focus();
}

function abrirModalEditarUnidade(unidade) {
  idUnidadeEmEdicao = unidade.id;
  tituloModalFormulario.textContent = "Editar unidade";
  campoNumero.value = unidade.numero;
  campoBloco.value = unidade.bloco;
  campoTipo.value = unidade.tipo;
  limparErrosFormulario();
  overlayFormulario.classList.remove("oculto");
  campoNumero.focus();
}

function fecharModalFormulario() {
  overlayFormulario.classList.add("oculto");
}

function limparErrosFormulario() {
  erroNumero.textContent = "";
  erroBloco.textContent = "";
}

function validarFormulario() {
  limparErrosFormulario();
  let valido = true;

  const numero = campoNumero.value.trim();
  const bloco = campoBloco.value.trim();

  if (numero === "") {
    erroNumero.textContent = "Informe o número da unidade.";
    valido = false;
  }

  if (bloco === "") {
    erroBloco.textContent = "Informe o bloco da unidade.";
    valido = false;
  } else if (/^\d+$/.test(bloco)) {
    erroBloco.textContent = "Bloco deve ser um texto (ex.: A, B), não apenas números.";
    valido = false;
  }

  if (numero !== "" && bloco !== "") {
    for (const unidade of unidadesCarregadas) {
      const mesmoNumero = unidade.numero.toString().toLowerCase() === numero.toLowerCase();
      const mesmoBloco = unidade.bloco.toString().toLowerCase() === bloco.toLowerCase();
      const mesmoRegistro = String(unidade.id) === String(idUnidadeEmEdicao);

      if (mesmoNumero && mesmoBloco && !mesmoRegistro) {
        erroNumero.textContent = "Já existe uma unidade com esse número e bloco.";
        valido = false;
        break;
      }
    }
  }

  return valido;
}

async function aoSubmeterFormulario(evento) {
  evento.preventDefault();

  if (!validarFormulario()) {
    return;
  }

  const dadosUnidade = {
    numero: campoNumero.value.trim(),
    bloco: campoBloco.value.trim(),
    tipo: campoTipo.value
  };

  try {
    let resposta;

    if (idUnidadeEmEdicao === null) {
      resposta = await fetch(`${URL_BASE}/unidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosUnidade)
      });
    } else {
      resposta = await fetch(`${URL_BASE}/unidades/${idUnidadeEmEdicao}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosUnidade)
      });
    }

    if (!resposta.ok) {
      throw new Error("Falha ao salvar unidade.");
    }

    const mensagemSucesso = idUnidadeEmEdicao === null
      ? "Unidade cadastrada com sucesso."
      : "Unidade atualizada com sucesso.";

    fecharModalFormulario();
    await recarregarUnidades();
    mostrarMensagem("sucesso", mensagemSucesso);
  } catch (erro) {
    console.error("Falha ao salvar unidade:", erro);
    mostrarMensagem("erro", "Não foi possível salvar a unidade. Tente novamente.");
  }
}

// -----------------------------------------------------------
// Exclusão (com verificação de morador vinculado e confirmação)
// -----------------------------------------------------------

function prepararExclusao(unidade) {
  const moradorVinculado = moradoresCarregados.find(
    (morador) => String(morador.unidadeId) === String(unidade.id)
  );

  if (moradorVinculado) {
    mostrarMensagem(
      "erro",
      `Não é possível excluir a unidade ${unidade.numero}/${unidade.bloco}: há morador(es) vinculado(s) a ela.`
    );
    return;
  }

  idUnidadeParaExcluir = unidade.id;
  textoConfirmacao.textContent =
    `Tem certeza que deseja excluir a unidade ${unidade.numero}/${unidade.bloco}? Essa ação não pode ser desfeita.`;
  overlayConfirmacao.classList.remove("oculto");
}

function fecharModalConfirmacao() {
  overlayConfirmacao.classList.add("oculto");
  idUnidadeParaExcluir = null;
}

async function confirmarExclusao() {
  if (idUnidadeParaExcluir === null) {
    return;
  }

  try {
    const resposta = await fetch(`${URL_BASE}/unidades/${idUnidadeParaExcluir}`, { method: "DELETE" });

    if (!resposta.ok) {
      throw new Error("Falha ao excluir unidade.");
    }

    fecharModalConfirmacao();
    await recarregarUnidades();
    mostrarMensagem("sucesso", "Unidade excluída com sucesso.");
  } catch (erro) {
    console.error("Falha ao excluir unidade:", erro);
    fecharModalConfirmacao();
    mostrarMensagem("erro", "Não foi possível excluir a unidade. Tente novamente.");
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

  // Reinicia a animação mesmo se a mensagem já estava visível, para chamar atenção a cada ação
  mensagemElemento.style.animation = "none";
  void mensagemElemento.offsetWidth;
  mensagemElemento.style.animation = "";

  mensagemElemento.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fecharMensagem() {
  mensagemElemento.classList.add("oculto");
}

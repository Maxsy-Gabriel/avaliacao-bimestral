// Efeitos puramente visuais (reveal ao rolar + spotlight no hover).
// Arquivo isolado: não lê nem escreve nenhum dado da aplicação,
// só observa elementos já existentes na página pelas classes .reveal/.spotlight.
"use strict";

const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ligarRevelacao() {
  const alvos = document.querySelectorAll(".reveal");

  if (semMovimento || alvos.length === 0) {
    alvos.forEach((el) => el.classList.add("visivel"));
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visivel");
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

  alvos.forEach((el) => observador.observe(el));
}

function ligarSpotlight() {
  const cartoes = document.querySelectorAll(".spotlight");

  cartoes.forEach((cartao) => {
    cartao.addEventListener("mousemove", (evento) => {
      const area = cartao.getBoundingClientRect();
      cartao.style.setProperty("--mx", (evento.clientX - area.left) + "px");
      cartao.style.setProperty("--my", (evento.clientY - area.top) + "px");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ligarRevelacao();
  ligarSpotlight();
});

# 🏢 Sistema de Gestão de Condomínio

Aplicação web desenvolvida para a avaliação final de Frontend. O projeto consiste em uma plataforma de gestão condominial que permite o controle de **Unidades**, **Moradores**, **Reservas de Áreas Comuns** e **Chamados**, contando com um **Dashboard (Painel)** interativo com métricas e rankings em tempo real.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid) e JavaScript Vanilla (ES6+)
- **Comunicação com API:** Fetch API (com requisições assíncronas `async/await`)
- **Backend Simulado:** [JSON Server](https://github.com/typicode/json-server)
- **Servidor Local Frontend:** Live Server (VS Code Extension)

---

## 📌 Funcionalidades do Sistema

### 📊 1. Dashboard (Painel Principal)
- Cards com indicadores em tempo real de chamados por status (*Aberto*, *Em Andamento* e *Resolvido*).
- Contagem e ranking de reservas por área comum (*Salão de Festas*, *Churrasqueira*, *Quadra*).
- Tempo médio de resolução de chamados em dias.
- Ranking de moradores com mais chamados abertos.
- Gráfico/Distribuição percentual de chamados por categoria.
- Filtro por bloco para reescalonar os indicadores e rankings.

### 🏢 2. Unidades
- Listagem, cadastro e edição de unidades (*Apartamento* ou *Casa*).
- Validação de duplicidade para a combinação de **Número + Bloco**.
- Bloqueio de exclusão de unidades vinculadas a moradores existentes.

### 👥 3. Moradores
- Listagem com indicador visual (Badge) de situação (*Ativo/Inativo*).
- Máscaras dinâmicas e validação para formato de **CPF** e **Telefone**.
- Inativação e reativação de moradores sem exclusão física (preservando o histórico).
- Bloqueio de cadastro de novos moradores caso não existam unidades cadastradas.

### 📅 4. Reservas de Área Comum
- Agendamento de áreas comuns para moradores ativos.
- Validação de **conflito de agenda** (impede duas reservas confirmadas na mesma área e data).
- Validação de data (impede reservas retroativas).
- Opção de cancelamento de reservas.

### 🛠️ 5. Chamados
- Abertura de chamados vinculados a moradores ativos por categoria (*Manutenção*, *Barulho*, *Segurança*, *Outros*).
- Fluxo de avanço progressivo de status: **Aberto ➔ Em Andamento ➔ Resolvido**.
- Registro automático da data de abertura e data de resolução.
- Busca por nome do morador e filtro por categoria.
- Paginação fixa de 10 registros por página.

---

## ⚙️ Comportamentos Transversais e Regras

- **Tratamento de Erros:** Mensagens amigáveis e visuais exibidas ao usuário em caso de falha de conexão com a API.
- **Feedback Visual:** Indicadores de carregamento (*spinners*) e mensagens de sucesso/erro em todas as ações (*CRUD*).
- **Modais de Confirmação:** Confirmação prévia exigida do usuário antes de ações sensíveis ou irreversíveis (inativar morador, cancelar reserva, etc.).
- **Consistência de Dados:** Atualização imediata do estado da interface logo após qualquer alteração no banco de dados local.

---

## 📁 Estrutura de Pastas

```text
├── assets/         # Imagens, ícones e recursos estáticos
├── chamados/       # Módulo de Chamados (HTML, CSS, JS)
├── dashboard/      # Módulo do Painel / Métricas (HTML, CSS, JS)
├── moradores/      # Módulo de Moradores (HTML, CSS, JS)
├── reservas/       # Módulo de Reservas (HTML, CSS, JS)
├── unidades/       # Módulo de Unidades (HTML, CSS, JS)
├── bd.json         # Banco de dados local para o JSON Server
└── README.md       # Documentação do projeto
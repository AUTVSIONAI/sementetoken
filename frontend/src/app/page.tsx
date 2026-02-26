import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-20 space-y-16">
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="uppercase tracking-[0.25em] text-emerald-200 text-[11px] mb-4">
              ESG • Web3 • Inteligência Artificial
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Sua jornada para o <span className="text-emerald-300">impacto real</span> começa aqui.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-emerald-50/90 max-w-xl">
              SementeToken une tecnologia blockchain, IA e transparência para transformar investimentos em florestas vivas. Monitore, neutralize e valorize sua pegada ambiental.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-emerald-400 text-emerald-950 font-semibold hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/40"
              >
                Plantar minha primeira árvore
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-emerald-500/80 text-emerald-50 hover:bg-emerald-900/40 transition"
              >
                Acessar minha floresta digital
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 text-xs sm:text-sm">
              <div>
                <div className="text-3xl font-bold text-emerald-300">12.340</div>
                <div className="text-emerald-100/80">Árvores monitoradas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-sky-300">540 t</div>
                <div className="text-emerald-100/80">CO₂ compensado</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-300">85</div>
                <div className="text-emerald-100/80">Projetos ativos</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative bg-slate-900/70 border border-emerald-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
              <div className="absolute -top-24 -right-28 w-64 h-64 bg-emerald-500/25 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl" />
              <div className="relative space-y-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-200">
                  Dashboard em tempo real
                </p>
                <h2 className="text-2xl font-bold mb-2">
                  Veja a floresta nascer na tela.
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="bg-slate-950/70 border border-emerald-700/70 rounded-xl p-3">
                    <p className="text-emerald-200 text-[11px] mb-1">
                      Projeto em destaque
                    </p>
                    <p className="font-semibold">Mata Atlântica SP</p>
                    <p className="text-[11px] text-emerald-100 mt-1">
                      2.430 árvores • 98 t CO₂
                    </p>
                  </div>
                  <div className="bg-slate-950/70 border border-sky-700/70 rounded-xl p-3">
                    <p className="text-sky-200 text-[11px] mb-1">
                      Saúde da floresta
                    </p>
                    <p className="font-semibold text-emerald-300">
                      93% saudável
                    </p>
                    <p className="text-[11px] text-sky-100 mt-1">
                      Monitorado por IA da árvore
                    </p>
                  </div>
                </div>
                <div className="mt-4 bg-black/30 border border-emerald-700 rounded-xl p-3 text-xs">
                  <p className="text-emerald-200 mb-2">Exemplo de conversa</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-emerald-200">Você</p>
                      <p className="text-emerald-50">
                        Como está o clima aí hoje na floresta?
                      </p>
                    </div>
                    <div>
                      <p className="text-sky-200">Sua árvore</p>
                      <p className="text-emerald-50">
                        Hoje está úmido e fresco, perfeito para eu crescer mais
                        forte. Obrigada por cuidar de mim.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="bg-emerald-900/70 border border-emerald-700 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2">
              Marketplace de projetos
            </h3>
            <p className="text-sm text-emerald-50/90">
              Explore iniciativas em diferentes biomas do Brasil, com
              geolocalização precisa e métricas de impacto.
            </p>
            <Link
              href="/marketplace"
              className="inline-block mt-4 text-sm text-emerald-200 hover:text-emerald-100"
            >
              Ver mapa de projetos
            </Link>
          </div>
          <div className="bg-sky-900/70 border border-sky-700 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2">
              Tokens e NFTs verdes
            </h3>
            <p className="text-sm text-sky-100/90">
              Cada árvore pode virar um ativo digital único na blockchain,
              com metadados de espécie, localização e CO₂.
            </p>
          </div>
          <div className="bg-amber-900/70 border border-amber-700/80 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2">
              Módulo corporativo ESG
            </h3>
            <p className="text-sm text-amber-50/90">
              Empresas acompanham sua compensação em um painel dedicado,
              com relatórios e certificados para stakeholders.
            </p>
            <Link
              href="/calculadora-carbono"
              className="inline-block mt-4 text-sm text-amber-100 hover:text-amber-50"
            >
              Usar a calculadora de carbono
            </Link>
          </div>
        </section>

        <section className="bg-emerald-950/60 border border-emerald-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-3">
            Benefícios verdes para quem compensa CO₂
          </h2>
          <p className="text-sm text-emerald-50/90 max-w-3xl">
            Ao plantar árvores e comprar produtos com cashback verde,
            você acumula créditos verdes proporcionais ao CO₂ compensado.
            Esses créditos podem ser trocados por descontos com parceiros
            (impostos, luz, água, supermercado) dentro do ecossistema SementeToken.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="px-5 py-2 rounded-full bg-emerald-400 text-emerald-950 font-semibold text-sm hover:bg-emerald-300 transition"
            >
              Explorar projetos e produtos
            </Link>
            <Link
              href="/calculadora-carbono"
              className="px-5 py-2 rounded-full border border-emerald-600 text-sm text-emerald-50 hover:bg-emerald-900/40 transition"
            >
              Calcular minha pegada agora
            </Link>
          </div>
        </section>

        <section className="bg-slate-900/80 border border-emerald-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-4">Como funciona na prática</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-emerald-50/90">
            <div>
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-400 text-emerald-950 font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold mb-1">Escolha seu Impacto</h3>
              <p>
                Navegue pelo marketplace e selecione projetos de reflorestamento certificados em diversos biomas brasileiros.
              </p>
            </div>
            <div>
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-400 text-sky-950 font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold mb-1">Tokenize e Plante</h3>
              <p>
                Cada semente adquirida gera um token único que representa uma árvore real, garantindo rastreabilidade e propriedade digital.
              </p>
            </div>
            <div>
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-300 text-amber-950 font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold mb-1">Monitore via IA</h3>
              <p>
                Acompanhe o crescimento, a saúde e o sequestro de carbono da sua árvore em tempo real através do nosso painel inteligente.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-emerald-900 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold">
              Pronto para lançar seu MVP de impacto climático?
            </h3>
            <p className="text-sm text-emerald-50/90 mt-1">
              Comece como usuário, admin ou empresa piloto e evoluímos o produto
              junto com você.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-emerald-400 text-emerald-950 font-semibold text-sm hover:bg-emerald-300 transition"
            >
              Entrar no sistema
            </Link>
            <Link
              href="/admin"
              className="px-5 py-2 rounded-full border border-emerald-600 text-sm text-emerald-50 hover:bg-emerald-900/40 transition"
            >
              Acessar painel admin
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

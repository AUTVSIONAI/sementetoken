
import React from 'react';

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-emerald-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">Whitepaper SementeToken</h1>
        
        <div className="prose prose-invert prose-emerald max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-emerald-200 mb-4">1. Introdução</h2>
            <p className="text-emerald-100/80 leading-relaxed mb-4">
              O SementeToken é uma plataforma inovadora que une tecnologia blockchain e conservação ambiental.
              Nossa missão é democratizar o acesso ao mercado de créditos de carbono e incentivar o reflorestamento
              através de um ecossistema transparente e descentralizado.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-emerald-200 mb-4">2. O Problema</h2>
            <p className="text-emerald-100/80 leading-relaxed mb-4">
              O desmatamento na Amazônia e em outros biomas brasileiros continua sendo um desafio crítico.
              Além disso, o mercado de créditos de carbono tradicional é frequentemente inacessível para pequenos
              produtores e carece de transparência para os investidores.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-emerald-200 mb-4">3. A Solução</h2>
            <p className="text-emerald-100/80 leading-relaxed mb-4">
              Através da tokenização de árvores e áreas de preservação, permitimos que qualquer pessoa, em qualquer
              lugar do mundo, contribua diretamente para projetos de reflorestamento e seja recompensada por isso.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-emerald-100/80">
              <li>Rastreabilidade total via Blockchain</li>
              <li>Monitoramento via Satélite e IoT</li>
              <li>Marketplace de produtos sustentáveis</li>
              <li>Turismo Verde e experiências imersivas</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-emerald-200 mb-4">4. Tokenomics</h2>
            <p className="text-emerald-100/80 leading-relaxed mb-4">
              O ecossistema opera com dois tokens principais:
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-900/50 p-6 rounded-xl border border-emerald-900/50">
                <h3 className="text-xl font-semibold text-emerald-300 mb-2">SementeToken (SMT)</h3>
                <p className="text-sm text-emerald-200/70">
                  Token de governança e utilidade. Usado para staking, votação e acesso a recursos premium.
                </p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-xl border border-emerald-900/50">
                <h3 className="text-xl font-semibold text-emerald-300 mb-2">CarbonCredit (CCT)</h3>
                <p className="text-sm text-emerald-200/70">
                  Token lastreado em carbono sequestrado. Cada CCT equivale a 1 tonelada de CO2 compensada.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

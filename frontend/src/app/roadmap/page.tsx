
import React from 'react';

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-emerald-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-12 text-center">Roadmap</h1>
        
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-emerald-500 before:to-transparent">
          
          {/* Phase 1 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500 bg-emerald-900 group-[.is-active]:bg-emerald-500 text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold text-sm">Q1</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-emerald-900/50 bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <h3 className="font-bold text-emerald-300">Fase 1: Fundação</h3>
                <time className="font-mono text-xs text-emerald-500/60">2024</time>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-sm text-emerald-200/80">
                <li>Lançamento do Website e Whitepaper</li>
                <li>Desenvolvimento dos Smart Contracts (Beta)</li>
                <li>Parceria com primeiros projetos de reflorestamento</li>
                <li>Início da venda privada de SementeTokens</li>
              </ul>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500 bg-emerald-900 group-[.is-active]:bg-emerald-500 text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold text-sm">Q2</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-emerald-900/50 bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <h3 className="font-bold text-emerald-300">Fase 2: Expansão</h3>
                <time className="font-mono text-xs text-emerald-500/60">2024</time>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-sm text-emerald-200/80">
                <li>Lançamento do Marketplace de Árvores</li>
                <li>Integração com API de Espécies</li>
                <li>Implementação do Módulo ESG Corporativo</li>
                <li>Auditoria de Segurança dos Contratos</li>
              </ul>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500 bg-slate-900 group-[.is-active]:bg-emerald-500 text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold text-sm">Q3</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-emerald-900/50 bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <h3 className="font-bold text-emerald-300">Fase 3: Ecossistema</h3>
                <time className="font-mono text-xs text-emerald-500/60">2025</time>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-sm text-emerald-200/80">
                <li>Lançamento do Turismo Verde</li>
                <li>App Mobile (iOS e Android)</li>
                <li>Staking de SementeTokens</li>
                <li>Expansão para novos biomas</li>
              </ul>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500 bg-slate-900 group-[.is-active]:bg-emerald-500 text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold text-sm">Q4</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-emerald-900/50 bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <h3 className="font-bold text-emerald-300">Fase 4: Globalização</h3>
                <time className="font-mono text-xs text-emerald-500/60">2025+</time>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-sm text-emerald-200/80">
                <li>Parcerias Internacionais</li>
                <li>Integração com Mercados de Carbono Globais</li>
                <li>Governança DAO Completa</li>
                <li>SementeToken em Grandes Exchanges</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

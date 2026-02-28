# Documentação: Dataset de Estimativa de Árvores

## Objetivo
Fornecer estimativas de quantidade de árvores e potencial de tokenização (10% da estimativa) por município e estado brasileiro, utilizando dados do MapBiomas (referência 2024/2025) cruzados com o IBGE.

## Metodologia
1.  **Dados de Cobertura Florestal**: Utilização da classe "Formação Florestal" do MapBiomas.
2.  **Densidade de Árvores**:
    *   Amazônia: 600 árvores/ha
    *   Mata Atlântica: 400 árvores/ha
    *   Cerrado: 300 árvores/ha
    *   Caatinga: 200 árvores/ha
    *   Pampa: 100 árvores/ha
    *   Pantanal: 250 árvores/ha
3.  **Processamento**: Script `backend/scripts/compute_trees.ts` que processa os dados brutos e gera CSVs consolidados.

## Estrutura de Dados
### Artefatos Gerados
*   `backend/data/trees-by-municipality.csv`: Dados detalhados por município.
*   `backend/data/trees-by-state.csv`: Dados agregados por estado.
*   `backend/data/metadata.json`: Metadados da geração (data, fonte, versão).

### Banco de Dados
Tabela `tree_estimates` (PostgreSQL):
*   `id`: UUID
*   `municipalityIbgeId`: Código IBGE (string)
*   `municipalityName`: Nome do município
*   `uf`: Sigla do estado
*   `biome`: Bioma predominante
*   `areaHa`: Área florestal em hectares
*   `treesEstimate`: Estimativa total de árvores
*   `tokens10Pct`: Potencial de tokenização (10%)
*   `lat`: Latitude central
*   `lon`: Longitude central

## Endpoints da API
Os endpoints estão protegidos (requer token JWT de Admin):

*   `GET /esg/trees/municipalities`: Retorna lista completa de municípios com estimativas.
*   `GET /esg/trees/municipality/:ibge`: Retorna dados específicos de um município.
*   `GET /esg/trees/state/:uf`: Retorna dados agregados de um estado.

## Atualização de Dados
Para atualizar o dataset:
1.  Atualize os dados brutos ou mock em `backend/data/mapbiomas_mock.csv`.
2.  Execute o script de processamento:
    ```bash
    cd backend
    npx ts-node scripts/compute_trees.ts
    ```
3.  Reinicie o backend para que o serviço `EsgService` recarregue os dados no banco (via `onModuleInit`).

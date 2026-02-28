import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;

// --- Configuration ---
const DATA_DIR = path.join(__dirname, '../data');
const INPUT_FILE = path.join(DATA_DIR, 'mapbiomas_mock.csv');
const OUTPUT_MUNICIPALITY = path.join(DATA_DIR, 'trees-by-municipality.csv');
const OUTPUT_STATE = path.join(DATA_DIR, 'trees-by-state.csv');
const OUTPUT_METADATA = path.join(DATA_DIR, 'metadata.json');

// Densities (trees per hectare) - Based on user documentation
const DENSITIES: { [key: string]: number } = {
  'Amazônia': 600,
  'Mata Atlântica': 400,
  'Cerrado': 300,
  'Caatinga': 200,
  'Pantanal': 250,
  'Pampa': 100
};

// Default density for unknown biomes
const DEFAULT_DENSITY = 200;

// MapBiomas Class IDs considered as Forest
// Using a simplified approach: assuming the input CSV is already filtered or we accept all rows for now.
// In a real scenario, we would filter by class_id (e.g., 3=Forest, 4=Savanna)
const FOREST_CLASSES = ['3', '4', '11', '12']; 

interface InputRow {
  municipality_code: string;
  municipality_name: string;
  state_acronym: string;
  biome: string;
  class_id: string;
  year: string;
  area_ha: string;
  lat?: string;
  lon?: string;
}

interface MunicipalityData {
  municipio_id_ibge: string;
  municipio_nome: string;
  uf: string;
  biome: string;
  area_ha: number;
  trees_estimate: number;
  tokens_10pct: number;
  lat: number;
  lon: number;
}

interface StateData {
  uf: string;
  area_ha_total: number;
  trees_estimate_total: number;
  tokens_10pct_total: number;
}

async function main() {
  console.log('Starting Tree Estimation Processing...');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    // Create a mock file if it doesn't exist for testing
    console.log('Generating mock data...');
    const mockHeader = 'municipality_code,municipality_name,state_acronym,biome,class_id,year,area_ha,lat,lon\n';
    const mockRows = [
        '1100015,Alta Floresta D\'Oeste,RO,Amazônia,3,2024,1500.75,-11.93,-61.99',
        '1100023,Ariquemes,RO,Amazônia,3,2024,2000.00,-9.91,-63.04',
        '1200013,Acrelândia,AC,Amazônia,3,2024,1500.00,-9.82,-67.08',
        '1302603,Manaus,AM,Amazônia,3,2024,5000.00,-3.11,-60.02',
        '3550308,São Paulo,SP,Mata Atlântica,3,2024,300.50,-23.55,-46.63',
        '3304557,Rio de Janeiro,RJ,Mata Atlântica,3,2024,400.00,-22.90,-43.17',
        '5300108,Brasília,DF,Cerrado,4,2024,1200.00,-15.78,-47.92',
        '5002704,Campo Grande,MS,Cerrado,4,2024,1800.00,-20.44,-54.64',
        '2304400,Fortaleza,CE,Caatinga,3,2024,100.00,-3.71,-38.54',
        '4314902,Porto Alegre,RS,Pampa,3,2024,150.00,-30.03,-51.22',
        '5103403,Cuiabá,MT,Pantanal,3,2024,2000.00,-15.60,-56.09'
    ];
    fs.writeFileSync(INPUT_FILE, mockHeader + mockRows.join('\n'));
  }

  const municipalities = new Map<string, MunicipalityData>();

  fs.createReadStream(INPUT_FILE)
    .pipe(csv())
    .on('data', (row: any) => {
      // In a real scenario, filter by class_id if needed
      // if (row.class_id && !FOREST_CLASSES.includes(row.class_id)) return;

      const municipalityCode = row.municipality_code;
      const biome = row.biome;
      // Key for aggregation: municipality_code + biome (some municipalities have multiple biomes)
      // For simplicity in this dashboard, we might want one entry per municipality, picking the dominant biome or aggregating.
      // Let's aggregate per municipality, keeping the biome of the first entry or "Misto" if multiple.
      
      const key = municipalityCode; 
      
      const area = parseFloat(row.area_ha);
      if (isNaN(area)) return;

      const density = DENSITIES[biome] || DEFAULT_DENSITY;
      const trees = Math.floor(area * density);
      const tokens = Math.floor(trees * 0.10);

      if (municipalities.has(key)) {
        const existing = municipalities.get(key)!;
        existing.area_ha += area;
        existing.trees_estimate += trees;
        existing.tokens_10pct += tokens;
        // Keep original biome or mark as mixed if different? 
        // For simplicity, keep first encountered biome as dominant for now.
      } else {
        municipalities.set(key, {
          municipio_id_ibge: municipalityCode,
          municipio_nome: row.municipality_name,
          uf: row.state_acronym,
          biome: biome,
          area_ha: area,
          trees_estimate: trees,
          tokens_10pct: tokens,
          lat: parseFloat(row.lat || '0'),
          lon: parseFloat(row.lon || '0')
        });
      }
    })
    .on('end', async () => {
      console.log(`Processed ${municipalities.size} municipalities.`);

      // 1. Write Municipality CSV
      const municipalityWriter = createObjectCsvWriter({
        path: OUTPUT_MUNICIPALITY,
        header: [
          { id: 'municipio_id_ibge', title: 'municipio_id_ibge' },
          { id: 'municipio_nome', title: 'municipio_nome' },
          { id: 'uf', title: 'uf' },
          { id: 'biome', title: 'biome' },
          { id: 'area_ha', title: 'area_ha' },
          { id: 'trees_estimate', title: 'trees_estimate' },
          { id: 'tokens_10pct', title: 'tokens_10pct' },
          { id: 'lat', title: 'lat' },
          { id: 'lon', title: 'lon' }
        ]
      });

      const municipalityData = Array.from(municipalities.values());
      await municipalityWriter.writeRecords(municipalityData);
      console.log(`Written ${OUTPUT_MUNICIPALITY}`);

      // 2. Aggregate by State
      const states = new Map<string, StateData>();
      municipalityData.forEach(m => {
        if (states.has(m.uf)) {
          const s = states.get(m.uf)!;
          s.area_ha_total += m.area_ha;
          s.trees_estimate_total += m.trees_estimate;
          s.tokens_10pct_total += m.tokens_10pct;
        } else {
          states.set(m.uf, {
            uf: m.uf,
            area_ha_total: m.area_ha,
            trees_estimate_total: m.trees_estimate,
            tokens_10pct_total: m.tokens_10pct
          });
        }
      });

      const stateWriter = createObjectCsvWriter({
        path: OUTPUT_STATE,
        header: [
          { id: 'uf', title: 'uf' },
          { id: 'area_ha_total', title: 'area_ha_total' },
          { id: 'trees_estimate_total', title: 'trees_estimate_total' },
          { id: 'tokens_10pct_total', title: 'tokens_10pct_total' }
        ]
      });

      await stateWriter.writeRecords(Array.from(states.values()));
      console.log(`Written ${OUTPUT_STATE}`);

      // 3. Write Metadata
      const metadata = {
        generated_at: new Date().toISOString(),
        source: 'MapBiomas (Mock)',
        version: '1.0',
        total_municipalities: municipalityData.length,
        total_trees_estimate: municipalityData.reduce((sum, m) => sum + m.trees_estimate, 0)
      };
      fs.writeFileSync(OUTPUT_METADATA, JSON.stringify(metadata, null, 2));
      console.log(`Written ${OUTPUT_METADATA}`);

      // 4. Generate Audit Sample (50 random municipalities)
      const sampleSize = 50;
      const shuffled = [...municipalityData].sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, sampleSize);
      const auditPath = path.join(DATA_DIR, 'audit_sample_municipalities.json');
      fs.writeFileSync(auditPath, JSON.stringify(sample, null, 2));
      console.log(`Written ${auditPath}`);

      console.log('Done.');
    });
}

main().catch(console.error);

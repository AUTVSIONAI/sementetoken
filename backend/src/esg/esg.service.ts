import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { TreesService } from '../trees/trees.service';
import PDFDocument from 'pdfkit';
import { TreeEstimate } from './tree-estimate.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

@Injectable()
export class EsgService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private treesService: TreesService,
    @InjectRepository(TreeEstimate)
    private treeEstimateRepository: Repository<TreeEstimate>,
  ) {}

  async onModuleInit() {
    const count = await this.treeEstimateRepository.count();
    const hasNullLat = await this.treeEstimateRepository.findOne({ where: { lat: IsNull() } });
    
    if (count === 0 || hasNullLat) {
      if (hasNullLat) {
        console.log('Found records with missing lat/lon. Clearing and re-seeding...');
        await this.treeEstimateRepository.clear();
      }
      
      const csvPath = path.join(process.cwd(), 'data', 'trees-by-municipality.csv');
      if (fs.existsSync(csvPath)) {
        console.log('Seeding TreeEstimates from CSV...');
        const results: any[] = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
        });

        const entities = results.map(r => this.treeEstimateRepository.create({
          municipalityIbgeId: r.municipio_id_ibge,
          municipalityName: r.municipio_nome,
          uf: r.uf,
          biome: r.biome,
          areaHa: parseFloat(r.area_ha),
          treesEstimate: parseFloat(r.trees_estimate),
          tokens10Pct: parseFloat(r.tokens_10pct),
          lat: r.lat ? parseFloat(r.lat) : null,
          lon: r.lon ? parseFloat(r.lon) : null
        }));

        // Insert in chunks of 500
        const chunkSize = 500;
        for (let i = 0; i < entities.length; i += chunkSize) {
          await this.treeEstimateRepository.save(entities.slice(i, i + chunkSize));
        }
        console.log(`Seeded ${entities.length} TreeEstimates.`);
      }
    }
  }

  async getAllMunicipalities() {
    return this.treeEstimateRepository.find({
      select: ['municipalityIbgeId', 'municipalityName', 'uf', 'treesEstimate', 'tokens10Pct', 'lat', 'lon', 'biome']
    });
  }

  async getMunicipalityData(ibgeId: string) {
    const data = await this.treeEstimateRepository.find({ where: { municipalityIbgeId: ibgeId } });
    if (!data || data.length === 0) return null;
    
    // Aggregate if multiple biomes per municipality
    const totalArea = data.reduce((sum, d) => sum + Number(d.areaHa), 0);
    const totalTrees = data.reduce((sum, d) => sum + Number(d.treesEstimate), 0);
    const totalTokens = data.reduce((sum, d) => sum + Number(d.tokens10Pct), 0);
    
    return {
      municipality_ibge_id: ibgeId,
      municipality_name: data[0].municipalityName,
      uf: data[0].uf,
      total_area_ha: totalArea,
      total_trees_estimate: totalTrees,
      total_tokens_10pct: totalTokens,
      biomes: data.map(d => ({
        biome: d.biome,
        area_ha: Number(d.areaHa),
        trees_estimate: Number(d.treesEstimate)
      })),
      bbox: null // Placeholder as we don't have bbox in CSV yet
    };
  }

  async getStateData(uf: string) {
    const data = await this.treeEstimateRepository.find({ where: { uf } });
    
    const totalArea = data.reduce((sum, d) => sum + Number(d.areaHa), 0);
    const totalTrees = data.reduce((sum, d) => sum + Number(d.treesEstimate), 0);
    const totalTokens = data.reduce((sum, d) => sum + Number(d.tokens10Pct), 0);
    
    // Group by municipality for details
    const municipalitiesMap = new Map<string, any>();
    data.forEach(d => {
      if (!municipalitiesMap.has(d.municipalityIbgeId)) {
        municipalitiesMap.set(d.municipalityIbgeId, {
          id: d.municipalityIbgeId,
          name: d.municipalityName,
          trees: 0
        });
      }
      municipalitiesMap.get(d.municipalityIbgeId).trees += Number(d.treesEstimate);
    });

    return {
      uf,
      total_area_ha: totalArea,
      total_trees_estimate: totalTrees,
      total_tokens_10pct: totalTokens,
      municipalities_count: municipalitiesMap.size,
      top_municipalities: Array.from(municipalitiesMap.values())
        .sort((a, b) => b.trees - a.trees)
        .slice(0, 10) // Top 10
    };
  }

  async generateReport(companyId: string): Promise<Buffer> {
    const company = await this.userRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const stats = await this.treesService.getStatsForUser(companyId);
    const trees = await this.treesService.getTreesForUser(companyId);
    
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    
    // Header
    doc.fontSize(25).text('Relatório ESG - SementeToken', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Empresa: ${company.name}`);
    doc.text(`Email: ${company.email}`);
    doc.text(`Data: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Stats
    doc.fontSize(20).text('Resumo de Impacto', { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Total de Árvores Plantadas: ${stats.count}`);
    doc.text(`Compensação de CO2 Estimada: ${stats.co2.toFixed(2)} kg`);
    doc.moveDown();

    // Details
    doc.fontSize(20).fillColor('black').text('Detalhamento de Ativos (NFTs)', { underline: true });
    doc.moveDown();
    
    if (trees.length > 0) {
      trees.forEach((tree, index) => {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(10).fillColor('black').text(`${index + 1}. ${tree.common_name || 'Árvore'} - ${tree.biome || 'N/A'} (${tree.state || 'N/A'})`);
        doc.fontSize(8).fillColor('grey').text(`   TxHash: ${tree.tx_hash || 'Pendente'}`);
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(12).fillColor('black').text('Nenhuma árvore encontrada para esta empresa.');
    }
    
    // Footer
    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}

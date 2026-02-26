require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const { broadcast, issue, nodeInteraction } = require('@waves/waves-transactions');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const NODE_URL = process.env.WAVES_NODE_URL || 'https://nodes-testnet.wavesnodes.com';
const SEED = process.env.WAVES_SEED || 'example seed phrase';
const CHAIN_ID = 'T'; // Testnet

app.get('/', (req, res) => {
  res.send('Waves Service is running 🌊');
});

// Endpoint para Mintar Token (NFT da Árvore)
app.post('/mint-nft', async (req, res) => {
  const { treeId, species, plantedAt, metadata } = req.body;

  try {
    // Simulação de transação Waves
    // Em produção:
    // const signedIssueTx = issue({
    //   name: `Tree-${treeId.substring(0,8)}`,
    //   description: JSON.stringify({ species, plantedAt, ...metadata }),
    //   quantity: 1,
    //   decimals: 0,
    //   reissuable: false,
    //   chainId: CHAIN_ID,
    // }, SEED);
    // await broadcast(signedIssueTx, NODE_URL);

    const mockTxId = 'Tx_' + Math.random().toString(36).substr(2, 9) + '_' + treeId;
    
    console.log(`[Waves] Minting NFT for Tree ${treeId}: ${mockTxId}`);

    res.json({
      success: true,
      txId: mockTxId,
      assetId: 'Asset_' + Math.random().toString(36).substr(2, 9),
      status: 'broadcasted'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para transferir token
app.post('/transfer', async (req, res) => {
    // Lógica de transferência
    res.json({ success: true, message: 'Transferencia simulada com sucesso' });
});

app.listen(port, () => {
  console.log(`Waves Service listening at http://localhost:${port}`);
});

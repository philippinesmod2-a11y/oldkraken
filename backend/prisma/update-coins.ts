import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPOSIT_ADDRESSES: Record<string, string> = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf3a',
  ETH: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  USDT: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
  USDC: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  BNB: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
  SOL: 'HN7cABqLq46Es1jh92dQQisAi18gHEQeGRYbUSdgLnhR',
  XRP: 'r3AdtRHNHFMQ7fNnKAbLAFYHtnW9s1AuUi',
  ADA: 'addr1qy2jt0qpqz2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z',
  DOGE: 'D8vFz4p1L37zp98j8nnMKjfJr5Z9S9xSP7',
  DOT: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MkbjX18n6Nas',
  AVAX: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  MATIC: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  LINK: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  LTC: 'LTdsVS8VDw6syvfQADdhf2PHAm3rMGJvPX',
  TRX: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
};

async function main() {
  console.log('Updating coin deposit addresses...');
  
  for (const [symbol, address] of Object.entries(DEPOSIT_ADDRESSES)) {
    const updated = await prisma.coin.updateMany({
      where: { symbol },
      data: { depositAddress: address },
    });
    if (updated.count > 0) {
      console.log(`✅ ${symbol}: ${address}`);
    }
  }
  
  console.log('Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🐙 Seeding OldKraken database...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'OldKraken@Admin2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@oldkraken.com' },
    update: {},
    create: {
      email: 'admin@oldkraken.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'OldKraken',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      kycStatus: 'APPROVED',
      referralCode: 'ADMIN001',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create coins
  const coins = [
    { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', decimals: 8, sortOrder: 1 },
    { symbol: 'ETH', name: 'Ethereum', network: 'ERC-20', decimals: 18, sortOrder: 2 },
    { symbol: 'USDT', name: 'Tether', network: 'TRC-20', decimals: 6, sortOrder: 3 },
    { symbol: 'USDC', name: 'USD Coin', network: 'ERC-20', decimals: 6, sortOrder: 4 },
    { symbol: 'BNB', name: 'BNB', network: 'BEP-20', decimals: 18, sortOrder: 5 },
    { symbol: 'SOL', name: 'Solana', network: 'Solana', decimals: 9, sortOrder: 6 },
    { symbol: 'XRP', name: 'Ripple', network: 'XRP Ledger', decimals: 6, sortOrder: 7 },
    { symbol: 'ADA', name: 'Cardano', network: 'Cardano', decimals: 6, sortOrder: 8 },
    { symbol: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', decimals: 8, sortOrder: 9 },
    { symbol: 'DOT', name: 'Polkadot', network: 'Polkadot', decimals: 10, sortOrder: 10 },
    { symbol: 'AVAX', name: 'Avalanche', network: 'C-Chain', decimals: 18, sortOrder: 11 },
    { symbol: 'MATIC', name: 'Polygon', network: 'Polygon', decimals: 18, sortOrder: 12 },
    { symbol: 'LINK', name: 'Chainlink', network: 'ERC-20', decimals: 18, sortOrder: 13 },
    { symbol: 'LTC', name: 'Litecoin', network: 'Litecoin', decimals: 8, sortOrder: 14 },
    { symbol: 'TRX', name: 'TRON', network: 'TRC-20', decimals: 6, sortOrder: 15 },
  ];

  for (const coin of coins) {
    await prisma.coin.upsert({
      where: { symbol: coin.symbol },
      update: {},
      create: {
        ...coin,
        depositEnabled: true,
        withdrawEnabled: true,
        depositInstructions: `Send ${coin.symbol} to the address below. Make sure to use the ${coin.network} network.`,
        confirmationNotes: `Please allow up to 30 minutes for ${coin.symbol} deposits to be credited after confirmation.`,
        depositMinimum: coin.symbol === 'BTC' ? 0.0001 : coin.symbol === 'ETH' ? 0.01 : 1,
        withdrawalFee: coin.symbol === 'BTC' ? 0.0005 : coin.symbol === 'ETH' ? 0.005 : 1,
        withdrawalMinimum: coin.symbol === 'BTC' ? 0.001 : coin.symbol === 'ETH' ? 0.01 : 10,
      },
    });
  }
  console.log(`✅ ${coins.length} coins created`);

  // Create system settings
  const settings = [
    { key: 'platform_name', value: 'OldKraken', category: 'branding' },
    { key: 'platform_tagline', value: 'Trade Securely with OldKraken', category: 'branding' },
    { key: 'maintenance_mode', value: 'false', category: 'system' },
    { key: 'registration_enabled', value: 'true', category: 'system' },
    { key: 'platform_enabled', value: 'true', category: 'system' },
    { key: 'withdraw_global_enabled', value: 'true', category: 'system' },
    { key: 'deposit_global_enabled', value: 'true', category: 'system' },
    { key: 'withdraw_message', value: 'Withdrawals are reviewed manually for security. Please allow up to 24 hours for processing. Contact support if urgent.', category: 'content' },
    { key: 'support_email', value: 'support@oldkraken.com', category: 'public' },
    { key: 'support_message', value: 'Our team is available 24/7. Email us or use the in-app support.', category: 'content' },
    { key: 'hero_title', value: 'Trade Securely with OldKraken', category: 'content' },
    { key: 'trust_section_text', value: 'Enterprise-grade security meets intuitive design', category: 'content' },
    { key: 'company_name', value: 'OldKraken Exchange Ltd.', category: 'public' },
    { key: 'company_address', value: '123 Financial District, Suite 100, Zurich, Switzerland', category: 'public' },
    { key: 'company_registration_id', value: 'CHE-000.000.000', category: 'public' },
    { key: 'company_phone', value: '+41 44 000 0000', category: 'public' },
    { key: 'footer_text', value: '© 2024 OldKraken Exchange. All rights reserved.', category: 'content' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ ${settings.length} system settings created`);

  // Create welcome announcement
  await prisma.announcement.create({
    data: {
      title: 'Welcome to OldKraken Exchange',
      content: 'We are excited to launch OldKraken — your trusted partner in digital asset trading. Enjoy secure deposits, fast withdrawals, and institutional-grade security.',
      type: 'info',
      isActive: true,
      priority: 10,
      createdBy: admin.id,
    },
  });
  console.log('✅ Welcome announcement created');

  console.log('🐙 Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

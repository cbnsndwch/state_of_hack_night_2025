/**
 * Setup script for PostgreSQL monitoring
 * Run this once to enable pg_stat_statements extension
 *
 * Usage: pnpm tsx scripts/setup-postgres-monitoring.ts
 */

import { postgresMonitoring } from '../app/utils/postgres-monitoring.server';

async function main() {
    console.log('🔧 Setting up PostgreSQL monitoring...\n');

    try {
        // Enable pg_stat_statements extension
        console.log('1. Enabling pg_stat_statements extension...');
        await postgresMonitoring.enableQueryStats();
        console.log('   ✅ Extension enabled\n');

        // Get initial stats
        console.log('2. Testing monitoring functionality...');
        const report = await postgresMonitoring.getPerformanceReport();
        console.log(`   ✅ Successfully retrieved performance report`);
        console.log(`   - Cache hit ratio: ${report.cacheHitRatio}%`);
        console.log(
            `   - Active connections: ${report.connections.activeConnections}/${report.connections.maxConnections}`
        );
        console.log(`   - Transaction rate: ${report.transactionRate}/s\n`);

        // Check for alerts
        const alerts = postgresMonitoring.checkPostgresAlerts(report);
        if (alerts.length > 0) {
            console.log('⚠️  Performance alerts detected:');
            alerts.forEach(alert => console.log(`   - ${alert}`));
            console.log('');
        } else {
            console.log('✅ No performance alerts\n');
        }

        console.log('🎉 PostgreSQL monitoring setup complete!\n');
        console.log('📊 Access the monitoring dashboard at:');
        console.log('   http://localhost:5173/admin/monitoring\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure PostgreSQL is running');
        console.error('2. Check DATABASE_URL in .env');
        console.error(
            '3. Ensure your PostgreSQL user has CREATE EXTENSION privileges'
        );
        console.error(
            '   Run: ALTER USER your_user WITH SUPERUSER; (for dev only)\n'
        );
        process.exit(1);
    }
}

main();

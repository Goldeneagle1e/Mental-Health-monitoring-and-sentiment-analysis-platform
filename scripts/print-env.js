// Temporary diagnostic script to verify env loading behavior.
// Run with: node scripts/print-env.js
console.log('cwd=', process.cwd())
console.log('DATABASE_URL=', process.env.DATABASE_URL)
console.log('POSTGRES_URL=', process.env.POSTGRES_URL)


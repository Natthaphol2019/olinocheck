// Test script to verify .env loading
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('Current directory:', __dirname)
console.log('Looking for .env at:', path.resolve(__dirname, '.env'))

dotenv.config({ path: path.resolve(__dirname, '.env') })

console.log('\n=== Environment Variables ===')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓ Loaded' : '✗ NOT LOADED')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓ Loaded' : '✗ NOT LOADED')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Loaded' : '✗ NOT LOADED')

console.log('\n=== Values (masked) ===')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...')

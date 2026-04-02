#!/usr/bin/env node

/**
 * Admin User Creation Script
 * 
 * This script helps create the first admin user for OlinoCheck.
 * 
 * Prerequisites:
 * 1. Set environment variables in .env file:
 *    VITE_SUPABASE_URL=your_supabase_url
 *    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * 
 * 2. Run: npm run create-admin
 * 
 * Note: The service_role key has elevated privileges - keep it secret!
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import readline from 'readline'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env file manually
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Admin configuration - can also be set via environment
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || 'admin@yourcompany.com',
  name: process.env.ADMIN_NAME || 'System Administrator',
  pin: process.env.ADMIN_PIN || '123456',  // 4-6 digit PIN
  role: 'admin',
  department: process.env.ADMIN_DEPARTMENT || 'Human Resources',
}

// ============================================
// SCRIPT IMPLEMENTATION
// ============================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🔧 OlinoCheck - Admin User Creation Tool\n')

  // Check if configuration is provided
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Error: Missing Supabase credentials')
    console.log('\nPlease set these environment variables:')
    console.log('  VITE_SUPABASE_URL=your_supabase_url')
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
    console.log('\nOr create a .env file with these values.')
    console.log('\nYou can find these values in Supabase Dashboard → Settings → API')
    process.exit(1)
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Test connection
    console.log('📡 Testing connection to Supabase...')
    const { error: testError } = await supabase.from('departments').select('id').limit(1)
    if (testError) {
      throw new Error(`Connection failed: ${testError.message}`)
    }
    console.log('✅ Connected to Supabase\n')

    // Generate PIN hash
    console.log('🔐 Generating PIN hash...')
    const pinHash = await bcrypt.hash(ADMIN_CONFIG.pin, 10)
    console.log(`   PIN Hash: ${pinHash.substring(0, 20)}...`)
    console.log(`   PIN: ${ADMIN_CONFIG.pin} (keep this secret!)\n`)

    // Get department
    console.log(`📂 Looking up department: ${ADMIN_CONFIG.department}...`)
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('name', ADMIN_CONFIG.department)
      .single()

    if (deptError || !department) {
      console.log('❌ Department not found! Available departments:')
      const { data: allDepts } = await supabase.from('departments').select('name')
      if (allDepts) {
        allDepts.forEach(d => console.log(`   - ${d.name}`))
      }
      console.log('\nYou can add departments in Supabase Dashboard → Table Editor → departments')
      process.exit(1)
    }
    console.log(`✅ Found department: ${department.id}\n`)

    // Check if user already exists
    console.log(`🔍 Checking if user exists: ${ADMIN_CONFIG.email}...`)
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === ADMIN_CONFIG.email)

    if (existingUser) {
      console.log('⚠️  User already exists!')
      const confirm = await question('   Do you want to delete and recreate? (y/n): ')
      if (confirm.toLowerCase() === 'y') {
        console.log('   Deleting existing user...')
        await supabase.auth.admin.deleteUser(existingUser.id)
        console.log('   ✅ User deleted')
      } else {
        console.log('   Cancelled.')
        process.exit(0)
      }
    }

    // Create auth user
    console.log('\n👤 Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_CONFIG.email,
      password: pinHash,  // Use PIN hash as password
      email_confirm: true,
      user_metadata: {
        name: ADMIN_CONFIG.name,
        role: ADMIN_CONFIG.role,
      },
    })

    if (authError) throw authError
    console.log(`✅ Auth user created: ${authData.user.id}\n`)

    // Create employee record
    console.log('📋 Creating employee record...')
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .insert({
        name: ADMIN_CONFIG.name,
        pin_hash: pinHash,
        role: ADMIN_CONFIG.role,
        department_id: department.id,
        auth_user_id: authData.user.id,
        is_active: true,
      })
      .select()
      .single()

    if (empError) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw empError
    }

    console.log('✅ Employee record created\n')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎉 SUCCESS! Admin user created!')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('\n📝 Login Credentials:')
    console.log(`   Email: ${ADMIN_CONFIG.email}`)
    console.log(`   PIN:   ${ADMIN_CONFIG.pin}`)
    console.log('\n⚠️  IMPORTANT:')
    console.log('   - Change the PIN after first login!')
    console.log('   - Store these credentials securely')
    console.log('   - Delete or secure this script after use')
    console.log('\n═══════════════════════════════════════════════════════════\n')

  } catch (error) {
    console.log('\n❌ Error:', error.message)
    if (error.message.includes('JWT')) {
      console.log('\n💡 Tip: Make sure you are using the service_role key, not the anon key')
      console.log('   Find it in: Supabase Dashboard → Settings → API → service_role key')
    }
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()

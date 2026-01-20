const prisma = require('../lib/prisma')
const bcrypt = require('bcryptjs')

async function main() {
  const username = process.argv[2]
  const password = process.argv[3]
  
  if (!username || !password) {
    console.error('Usage: node scripts/set-admin.js <username> <password>')
    process.exit(1)
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.upsert({
      where: { username },
      update: { 
        role: 'ADMIN',
        password: hashedPassword 
      },
      create: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Super Admin'
      }
    })
    console.log(`Admin user '${user.username}' created/updated successfully.`)
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

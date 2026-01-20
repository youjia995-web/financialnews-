const prisma = require('../lib/prisma')
const bcrypt = require('bcryptjs')

async function main() {
  const username = 'admin'
  const password = 'admin123' // Default password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Use BigInt for timestamp as per schema
  const now = BigInt(Date.now())

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password: hashedPassword,
      role: 'ADMIN',
      created_at: now
    }
  })
  
  // Convert BigInt to string for logging
  const safeUser = {
    ...user,
    created_at: user.created_at.toString()
  }
  
  console.log('Admin user created/verified:', safeUser)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

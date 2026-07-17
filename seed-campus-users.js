import { connectToDatabase } from './lib/mongo.js'
import { User, ServiceRequest } from './models.js'
import bcrypt from 'bcryptjs'

const campusUsers = [
  {
    name: 'Campus Admin',
    email: 'admin@msec.edu.in',
    password: '123',
    role: 'admin',
    department: 'ADMIN',
    phoneNumber: '+91-9876543201'
  },
  {
    name: 'Service Manager John',
    email: 'manager@msec.edu.in',
    password: '123',
    role: 'manager',
    department: 'MAINTENANCE',
    phoneNumber: '+91-9876543202'
  },
  {
    name: 'Technician Dave',
    email: 'tech@msec.edu.in',
    password: '123',
    role: 'technician',
    department: 'ELECTRICAL',
    phoneNumber: '+91-9876543203'
  },
  {
    name: 'Accounts Officer Sarah',
    email: 'accounts@msec.edu.in',
    password: '123',
    role: 'accounts',
    department: 'ACCOUNTS',
    phoneNumber: '+91-9876543204'
  },
  {
    name: 'Dr. Helen (Faculty Requester)',
    email: 'faculty@msec.edu.in',
    password: '123',
    role: 'requester',
    department: 'CSE',
    phoneNumber: '+91-9876543205'
  },
  {
    name: 'Super Admin',
    email: 'super@msec.edu.in',
    password: '123',
    role: 'super_admin',
    department: 'SYSTEM',
    phoneNumber: '+91-9876543200'
  }
]

async function seedCampusUsers() {
  try {
    console.log('🔄 Connecting to database...')
    await connectToDatabase()
    
    console.log('🧹 Clearing existing campus users and requests...')
    await User.deleteMany({ role: { $in: ['admin', 'manager', 'technician', 'accounts', 'requester', 'super_admin'] } })
    await ServiceRequest.deleteMany({})
    
    console.log('🌱 Seeding CampusServe users...')
    for (const userData of campusUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      const user = new User({
        ...userData,
        password: hashedPassword
      })
      await user.save()
      console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.email})`)
    }
    
    console.log('\n🎉 Successfully seeded CampusServe users!')
    console.log('\n📧 Login Credentials (Password: 123):')
    campusUsers.forEach(user => {
      console.log(`  Role: [${user.role.toUpperCase()}] Email: ${user.email}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    process.exit(1)
  }
}

seedCampusUsers()

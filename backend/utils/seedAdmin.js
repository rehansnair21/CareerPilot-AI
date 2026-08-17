import Admin from '../models/Admin.js';

export const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('⚡ [Admin Seed]: No admin account found in "admins" collection. Creating default admin...');
      
      const defaultAdmin = await Admin.create({
        username: 'admin',
        email: 'admin@careerpilot.ai',
        fullName: 'System Administrator',
        password: 'admin123',
        role: 'admin',
        permissions: ['all']
      });

      console.log('✅ [Admin Seed Success]: Created default admin user:');
      console.log(`   - Username: ${defaultAdmin.username}`);
      console.log(`   - Email: ${defaultAdmin.email}`);
      console.log(`   - Role: ${defaultAdmin.role}`);
      console.log(`   - Collection: admins`);
    } else {
      console.log(`ℹ️ [Admin Seed Check]: Database contains ${adminCount} admin user(s) in "admins" collection.`);
    }
  } catch (error) {
    console.error('❌ [Admin Seed Error]:', error.message);
  }
};

export default seedAdmin;

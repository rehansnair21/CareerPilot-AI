import Admin from '../models/Admin.js';

/**
 * Seeds the initial admin account ONLY if no admin documents exist.
 *
 * Required environment variables:
 *   ADMIN_EMAIL     — e-mail address for the admin account
 *   ADMIN_PASSWORD  — initial password (must be set before first deploy)
 *   ADMIN_USERNAME  — (optional) defaults to "admin"
 *
 * If ADMIN_EMAIL or ADMIN_PASSWORD are not set, seeding is skipped and a
 * warning is printed so the developer knows they need to set these values.
 */
export const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      console.log(`ℹ️  [Admin Seed]: ${adminCount} admin account(s) already exist — skipping seed.`);
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    if (!adminEmail || !adminPassword) {
      console.warn(
        '⚠️  [Admin Seed]: ADMIN_EMAIL and/or ADMIN_PASSWORD environment variables are not set. ' +
        'No admin account will be created automatically. Set these variables and restart the server to seed the first admin.'
      );
      return;
    }

    const defaultAdmin = await Admin.create({
      username: adminUsername,
      email: adminEmail,
      fullName: 'System Administrator',
      password: adminPassword,
      role: 'admin',
      permissions: ['all'],
    });

    console.log('✅ [Admin Seed]: Created initial admin account:');
    console.log(`   Username : ${defaultAdmin.username}`);
    console.log(`   Email    : ${defaultAdmin.email}`);
  } catch (error) {
    console.error('❌ [Admin Seed Error]:', error.message);
  }
};

export default seedAdmin;

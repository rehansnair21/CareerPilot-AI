import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const viewUsers = async () => {
  const localUri = 'mongodb://127.0.0.1:27017/careerpilot_ai';
  const targetUri = process.env.MONGODB_URI || localUri;

  console.log(`\n🔍 Attempting connection to MongoDB database...`);
  let conn;
  try {
    const options = { serverSelectionTimeoutMS: 4000 };
    if (targetUri.includes('mongodb+srv://') || targetUri.includes('ssl=true') || targetUri.includes('tls=true')) {
      options.tls = true;
      options.tlsAllowInvalidCertificates = true;
    }
    conn = await mongoose.connect(targetUri, options);
    console.log(`[Connected]: Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (err) {
    console.warn(`[Notice]: Could not connect to primary database (${err.message}). Trying local DB fallback...`);
    try {
      conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[Fallback Connected]: Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    } catch (localErr) {
      console.warn(`[Notice]: Could not connect to local DB (${localErr.message}). Fetching from running backend API server...`);
      try {
        const res = await fetch('http://localhost:5000/api/auth/users');
        const data = await res.json();
        if (data.success) {
          console.log(`\n======================================================`);
          console.log(`   CAREER PILOT AI - REGISTERED USERS IN MONGODB (${data.count})`);
          console.log(`======================================================\n`);
          console.table(
            data.users.map((u) => ({
              ID: u._id,
              Name: u.fullName || u.name || 'N/A',
              Email: u.email,
              Role: u.role ? u.role.toUpperCase() : 'N/A',
              RegisteredAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
            }))
          );
          process.exit(0);
        }
      } catch (apiErr) {
        console.error('Error fetching users:', apiErr.message);
        process.exit(1);
      }
    }
  }

  try {
    const User = (await import('./models/User.js')).default;
    const Recruiter = (await import('./models/Recruiter.js')).default;
    const Admin = (await import('./models/Admin.js')).default;

    const users = await User.find({}).select('-password');
    const recruiters = await Recruiter.find({});
    const admins = await Admin.find({}).select('-password');

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - ADMINS COLLECTION (${admins.length})`);
    console.log(`======================================================\n`);

    if (admins.length === 0) {
      console.log('No admin records found in admins collection yet.');
    } else {
      console.table(
        admins.map((a) => ({
          ID: a._id.toString(),
          Username: a.username,
          Name: a.fullName || a.name || 'N/A',
          Email: a.email,
          Role: a.role ? a.role.toUpperCase() : 'ADMIN',
          LastLogin: a.lastLogin ? new Date(a.lastLogin).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - REGISTERED USERS TABLE (${users.length})`);
    console.log(`======================================================\n`);

    if (users.length === 0) {
      console.log('No users found in database yet.');
    } else {
      console.table(
        users.map((u) => ({
          ID: u._id.toString(),
          Name: u.fullName || u.name || 'N/A',
          Email: u.email,
          Role: u.role ? u.role.toUpperCase() : 'N/A',
          RegisteredAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
        }))
      );
    }

    console.log(`\n======================================================`);
    console.log(`   CAREER PILOT AI - RECRUITERS TABLE (${recruiters.length})`);
    console.log(`======================================================\n`);

    if (recruiters.length === 0) {
      console.log('No recruiter records found in recruiters table yet.');
    } else {
      console.table(
        recruiters.map((r) => ({
          ID: r._id.toString(),
          UserID: r.user ? r.user.toString() : 'N/A',
          Name: r.fullName || 'N/A',
          Email: r.email || 'N/A',
          Company: r.companyName || 'N/A',
          Designation: r.designation || 'N/A',
          Phone: r.phone || 'N/A',
          Status: r.verifiedStatus || 'verified',
        }))
      );
    }
    process.exit(0);
  } catch (error) {
    console.error('Error reading database tables:', error.message);
    process.exit(1);
  }
};

viewUsers();

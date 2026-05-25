import { createClient } from '@supabase/supabase-js';

// Load environment variables (ensure you have SUPABASE_URL and SERVICE_ROLE_KEY set)
const supabaseUrl = process.env.NEXT_PUBLIC_DATABASE_URL || '';
const serviceKey = process.env.DATABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceKey) {
  console.error('Supabase URL or service role key not configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Email of the user you want to promote to admin (set in .env.local as ADMIN_USER_EMAIL)
const adminEmail = process.env.ADMIN_USER_EMAIL;
if (!adminEmail) {
  console.error('Please set ADMIN_USER_EMAIL in your .env.local');
  process.exit(1);
}

// Optional: password for the admin user (set as ADMIN_USER_PASSWORD). If not set, the script will only promote an existing user.
const adminPassword = process.env.ADMIN_USER_PASSWORD;

(async () => {
  // Ensure the "role" column exists – you can run this once.
  // Supabase allows executing raw SQL via the `rpc` function if you have a Postgres function named `sql`.
  // If you don't have such a function, create the column manually in the Supabase UI.
  try {
    await supabase.rpc('sql', { query: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;' });
    console.log('Ensured role column exists (or already present).');
  } catch (e) {
    console.warn('Could not run ALTER TABLE via RPC – you may need to add the column manually in Supabase UI.');
  }

  // Try to find the user by email first.
  const { data: existingUser, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', adminEmail)
    .single();

  let userId: string | undefined;

  if (existingUser && !findError) {
    userId = existingUser.id;
    console.log(`Found existing user with email ${adminEmail}, id=${userId}`);
  } else {
    // User not found – create it using the admin auth API (requires service role key).
    if (!adminPassword) {
      console.error('User not found and ADMIN_USER_PASSWORD is not set. Cannot create admin user.');
      process.exit(1);
    }
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });
    if (createError || !createdUser.user) {
      console.error('Failed to create admin user:', createError);
      process.exit(1);
    }
    userId = createdUser.user.id;
    console.log(`Created new user with email ${adminEmail}, id=${userId}`);
  }

  // Update the role to admin
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to set admin role:', updateError);
    process.exit(1);
  }

  console.log(`User with email ${adminEmail} is now an admin (role set to 'admin').`);
})();

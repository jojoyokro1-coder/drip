import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
const envPath = path.resolve(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_DATABASE_URL || '';
const serviceKey = process.env.DATABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_DATABASE_URL and DATABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const users = [
  { username: 'streetking', email: 'streetking@test.com', password: 'test123456', name: 'streetking' },
  { username: 'parisianvibe', email: 'parisianvibe@test.com', password: 'test123456', name: 'parisianvibe' },
  { username: 'urbanflex', email: 'urbanflex@test.com', password: 'test123456', name: 'urbanflex' },
  { username: 'minimalwave', email: 'minimalwave@test.com', password: 'test123456', name: 'minimalwave' },
  { username: 'vintagelens', email: 'vintagelens@test.com', password: 'test123456', name: 'vintagelens' },
  { username: 'techwearpro', email: 'techwearpro@test.com', password: 'test123456', name: 'techwearpro' },
];

const looksData = [
  { username: 'streetking', description: 'Oversized hoodie avec un baggy cargo #streetwear #baggy', imageSeed: 1 },
  { username: 'streetking', description: 'Fresh sneakers fit pour le daily #sneakers #ootd', imageSeed: 2 },
  { username: 'streetking', description: 'Layered look automne/hiver #layering #fall', imageSeed: 3 },
  { username: 'parisianvibe', description: 'Soirée parisienne avec un blazer oversize #paris #soiree', imageSeed: 4 },
  { username: 'parisianvibe', description: 'Casual chic en terrasse #paris #casualchic', imageSeed: 5 },
  { username: 'urbanflex', description: 'Nouveau pickup, trop clean #pickup #sneakers', imageSeed: 6 },
  { username: 'urbanflex', description: 'Gym fit avant la session #gym #fitness', imageSeed: 7 },
  { username: 'minimalwave', description: 'Less is more. Monochrome today #minimal #monochrome', imageSeed: 8 },
  { username: 'minimalwave', description: 'Neutral tones pour ce dimanche #minimal #neutral', imageSeed: 9 },
  { username: 'vintagelens', description: 'Thrift find de la semaine #vintage #thrift', imageSeed: 10 },
  { username: 'vintagelens', description: 'Denim on denim #denim #vintage', imageSeed: 11 },
  { username: 'techwearpro', description: 'Techwear cargo avec des straps #techwear #cargo', imageSeed: 12 },
  { username: 'techwearpro', description: 'All black, toujours #techwear #black', imageSeed: 13 },
];

const commentsData = [
  { from: 'streetking', toLookIdx: 0, content: 'Propre ! 🔥' },
  { from: 'parisianvibe', toLookIdx: 0, content: 'Trop stylé' },
  { from: 'urbanflex', toLookIdx: 1, content: 'Les sneakers sont folles' },
  { from: 'minimalwave', toLookIdx: 3, content: 'Très parisien comme vibe' },
  { from: 'vintagelens', toLookIdx: 2, content: 'J adore le layering' },
  { from: 'techwearpro', toLookIdx: 11, content: 'Clean le techwear' },
  { from: 'streetking', toLookIdx: 4, content: 'Paris toujours' },
  { from: 'parisianvibe', toLookIdx: 7, content: 'Le monochrome est parfait' },
];

function getPlaceholderImage(seed: number): string {
  return `https://picsum.photos/seed/look${seed}/600/800`;
}

async function main() {
  console.log('🚀 Starting seed...\n');

  // 1. Create users
  const createdUsers: { id: string; username: string }[] = [];

  for (const u of users) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', u.username)
      .maybeSingle();

    if (existing) {
      console.log(`👤 User "${u.username}" already exists (id: ${existing.id})`);
      createdUsers.push({ id: existing.id, username: u.username });
      continue;
    }

    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { username: u.username },
    });

    if (createError || !authUser.user) {
      console.error(`❌ Failed to create user "${u.username}":`, createError?.message);
      continue;
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authUser.user.id,
      username: u.username,
      bio: getBio(u.username),
      avatar_url: null,
    });

    if (profileError) {
      console.error(`❌ Failed to create profile for "${u.username}":`, profileError.message);
      continue;
    }

    console.log(`✅ Created user "${u.username}" (id: ${authUser.user.id})`);
    createdUsers.push({ id: authUser.user.id, username: u.username });
  }

  if (createdUsers.length === 0) {
    console.log('\n⚠️  No users created. Checking existing looks...');
  }

  console.log(`\n📸 Creating ${looksData.length} looks...\n`);

  // 2. Create looks
  const createdLooks: { id: string; user_id: string }[] = [];

  for (let i = 0; i < looksData.length; i++) {
    const look = looksData[i];
    const user = createdUsers.find((u) => u.username === look.username);
    if (!user) {
      console.warn(`⚠️  User "${look.username}" not found, skipping look`);
      continue;
    }

    const imageUrl = getPlaceholderImage(look.imageSeed);

    const { data: existingLook } = await supabase
      .from('looks')
      .select('id')
      .eq('image_url', imageUrl)
      .maybeSingle();

    if (existingLook) {
      console.log(`  📷 Look ${i + 1}/${looksData.length} already exists (id: ${existingLook.id})`);
      createdLooks.push({ id: existingLook.id, user_id: user.id });
      continue;
    }

    const { data: newLook, error } = await supabase
      .from('looks')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        description: look.description,
        likes_count: 0,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error(`❌ Failed to create look ${i + 1}:`, error.message);
      continue;
    }

    console.log(`  ✅ Look ${i + 1}/${looksData.length} by "${look.username}" (id: ${newLook.id})`);
    createdLooks.push({ id: newLook.id, user_id: user.id });
  }

  if (createdLooks.length < 2) {
    console.log('\n⚠️  Not enough looks to create interactions. Skipping likes/follows/comments.\n');
    return;
  }

  console.log(`\n❤️ Creating likes...\n`);

  // 3. Create likes (each user likes some looks from others)
  let likesCount = 0;
  for (const user of createdUsers) {
    for (const look of createdLooks) {
      if (look.user_id === user.id) continue;

      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('look_id', look.id)
        .maybeSingle();

      if (existing) continue;

      const { error } = await supabase.from('likes').insert({
        user_id: user.id,
        look_id: look.id,
      });

      if (!error) {
        likesCount++;
      }
    }
  }
  console.log(`  ✅ Created ${likesCount} likes`);

  // Update likes_count on looks
  for (const look of createdLooks) {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('look_id', look.id);

    if (count !== null) {
      await supabase.from('looks').update({ likes_count: count }).eq('id', look.id);
    }
  }

  console.log(`\n👥 Creating follows...\n`);

  // 4. Create follows
  let followsCount = 0;
  for (const follower of createdUsers) {
    for (const following of createdUsers) {
      if (follower.id === following.id) continue;

      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', follower.id)
        .eq('following_id', following.id)
        .maybeSingle();

      if (existing) continue;

      const { error } = await supabase.from('follows').insert({
        follower_id: follower.id,
        following_id: following.id,
      });

      if (!error) {
        followsCount++;
      }
    }
  }
  console.log(`  ✅ Created ${followsCount} follows`);

  console.log(`\n💬 Creating comments...\n`);

  // 5. Create comments
  let commentsCount = 0;
  for (const c of commentsData) {
    const fromUser = createdUsers.find((u) => u.username === c.from);
    if (!fromUser) continue;

    const look = createdLooks[c.toLookIdx];
    if (!look) continue;

    const { error } = await supabase.from('comments').insert({
      user_id: fromUser.id,
      look_id: look.id,
      content: c.content,
    });

    if (!error) {
      commentsCount++;
    }
  }
  console.log(`  ✅ Created ${commentsCount} comments`);

  console.log(`\n🎉 Seed complete!`);
  console.log(`\n📋 Comptes de test :`);
  for (const u of users) {
    console.log(`   ${u.email} / ${u.password}`);
  }
}

function getBio(username: string): string {
  const bios: Record<string, string> = {
    streetking: 'Streetwear addict. Sneakerhead. 🔥',
    parisianvibe: 'Parisian style. Fashion week every day. 🇫🇷',
    urbanflex: 'Fitness & streetwear. Gym to street. 💪',
    minimalwave: 'Minimalist. Neutral tones. Quality over quantity.',
    vintagelens: 'Vintage hunter. Thrift is life. 🕶️',
    techwearpro: 'Techwear enthusiast. Function meets fashion.',
  };
  return bios[username] || 'DRIP user.';
}

main().catch(console.error);

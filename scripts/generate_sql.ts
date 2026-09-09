import fs from 'fs';
import { INITIAL_MEMBERS, INITIAL_BRANCHES, CLAN_INFO } from '../src/data/sampleData';

let sql = `-- =========================================================================
-- SCRIPT NHẬP DỮ LIỆU GIA PHẢ TỘC VĂN VÀO SUPABASE (CHẠY 0 ĐỒNG)
-- Số lượng thành viên: ${INITIAL_MEMBERS.length} (Đời 1 đến Đời 9)
-- Nguồn: Bản thảo Gia Phả Tộc Văn cập nhật 20/7/2023
-- =========================================================================

-- 1. Bảng cấu hình Clan Info
CREATE TABLE IF NOT EXISTS clan_info (
  id TEXT PRIMARY KEY DEFAULT 'clan-main',
  clan_name TEXT NOT NULL,
  origin_province TEXT,
  ancestor_temple_address TEXT,
  description TEXT,
  total_generations INT DEFAULT 9,
  establishment_year TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng Nhánh Phái (branches)
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  color TEXT,
  leader_name TEXT,
  location TEXT,
  member_count INT DEFAULT 0
);

-- 3. Bảng Thành viên Gia phả (members)
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  courtesy_name TEXT,
  posthumous_name TEXT,
  gender TEXT NOT NULL,
  generation INT NOT NULL,
  branch_id TEXT,
  phai_name TEXT,
  chi_name TEXT,
  nhanh_name TEXT,
  order_in_family INT DEFAULT 1,
  order_title TEXT,
  birth_place TEXT,
  birth_date TEXT,
  birth_date_lunar TEXT,
  is_alive BOOLEAN DEFAULT FALSE,
  death_date TEXT,
  death_date_lunar TEXT,
  burial_location TEXT,
  bio TEXT,
  father_id TEXT,
  mother_id TEXT,
  spouse_ids JSONB DEFAULT '[]'::jsonb,
  is_root_ancestor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dữ liệu cấu hình Dòng tộc
INSERT INTO clan_info (id, clan_name, origin_province, ancestor_temple_address, description, total_generations, establishment_year, contact_person, contact_email) VALUES (
  'clan-main',
  '${CLAN_INFO.name.replace(/'/g, "''")}',
  'Quảng Nam',
  '${CLAN_INFO.address.replace(/'/g, "''")}',
  '${CLAN_INFO.branchSubtitle.replace(/'/g, "''")}',
  9,
  '${CLAN_INFO.foundingYear}',
  'Ban Trị Sự Đại Tộc Văn',
  'sanhangdoc.shop@gmail.com'
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

`;

// Insert branches
for (const b of INITIAL_BRANCHES) {
  sql += `INSERT INTO branches (id, name, code, description, color, leader_name, location) VALUES (
  '${b.id}', '${b.name.replace(/'/g, "''")}', '${b.code}', '${(b.description || '').replace(/'/g, "''")}', '${b.colorAccent || '#b45309'}', '${b.leaderId || ''}', 'Quảng Nam'
) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Insert members
for (const m of INITIAL_MEMBERS) {
  const spousesJson = JSON.stringify(m.spouseIds || []).replace(/'/g, "''");
  sql += `INSERT INTO members (id, full_name, courtesy_name, gender, generation, branch_id, phai_name, chi_name, nhanh_name, order_in_family, order_title, birth_place, is_alive, death_date_lunar, burial_location, bio, father_id, mother_id, spouse_ids, is_root_ancestor) VALUES (
  '${m.id}',
  '${m.fullName.replace(/'/g, "''")}',
  ${m.courtesyName ? `'${m.courtesyName.replace(/'/g, "''")}'` : 'NULL'},
  '${m.gender}',
  ${m.generation},
  '${m.branchId}',
  ${m.phaiName ? `'${m.phaiName.replace(/'/g, "''")}'` : 'NULL'},
  ${m.chiName ? `'${m.chiName.replace(/'/g, "''")}'` : 'NULL'},
  ${m.nhanhName ? `'${m.nhanhName.replace(/'/g, "''")}'` : 'NULL'},
  ${m.orderInFamily || 1},
  ${m.orderTitle ? `'${m.orderTitle.replace(/'/g, "''")}'` : 'NULL'},
  ${m.birthPlace ? `'${m.birthPlace.replace(/'/g, "''")}'` : 'NULL'},
  ${m.isAlive ? 'TRUE' : 'FALSE'},
  ${m.deathDateLunar ? `'${m.deathDateLunar.replace(/'/g, "''")}'` : 'NULL'},
  ${m.burialLocation ? `'${m.burialLocation.replace(/'/g, "''")}'` : 'NULL'},
  ${m.bio ? `'${m.bio.replace(/'/g, "''")}'` : 'NULL'},
  ${m.fatherId ? `'${m.fatherId}'` : 'NULL'},
  ${m.motherId ? `'${m.motherId}'` : 'NULL'},
  '${spousesJson}'::jsonb,
  ${m.isRootAncestor ? 'TRUE' : 'FALSE'}
) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, bio = EXCLUDED.bio, burial_location = EXCLUDED.burial_location;\n\n`;
}

fs.writeFileSync('public/supabase_import.sql', sql, 'utf8');
console.log('Successfully wrote public/supabase_import.sql with', INITIAL_MEMBERS.length, 'members');

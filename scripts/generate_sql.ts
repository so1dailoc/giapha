import fs from 'node:fs';
import { INITIAL_MEMBERS, INITIAL_BRANCHES, CLAN_INFO, INITIAL_EVENTS, INITIAL_DOCUMENTS, INITIAL_POSTS, INITIAL_FUNDS } from '../src/data/sampleData';

const q = (value: unknown) =>
  value === undefined || value === null || value === ''
    ? 'NULL'
    : `'${String(value).replace(/'/g, "''")}'`;

const j = (value: unknown) => `'${JSON.stringify(value ?? []).replace(/'/g, "''")}'::jsonb`;

let sql = `-- DATA SEED — Gia Phả Đại Tộc
-- Chạy SAU khi đã chạy supabase/schema.sql
-- Số lượng thành viên: ${INITIAL_MEMBERS.length}

BEGIN;

INSERT INTO public.clan_info
(id,name,branch_subtitle,ancestral_hall,address,founding_year,motto,motto_meaning)
VALUES ('main_clan',${q(CLAN_INFO.name)},${q(CLAN_INFO.branchSubtitle)},${q(CLAN_INFO.ancestralHall)},${q(CLAN_INFO.address)},${CLAN_INFO.foundingYear},${q(CLAN_INFO.motto)},${q(CLAN_INFO.mottoMeaning)})
ON CONFLICT (id) DO UPDATE SET
name=EXCLUDED.name, branch_subtitle=EXCLUDED.branch_subtitle,
ancestral_hall=EXCLUDED.ancestral_hall, address=EXCLUDED.address,
founding_year=EXCLUDED.founding_year, motto=EXCLUDED.motto,
motto_meaning=EXCLUDED.motto_meaning, updated_at=NOW();

`;

for (const b of INITIAL_BRANCHES) {
  sql += `INSERT INTO public.branches (id,name,code,leader_id,description,ancestor_id,color_accent)
VALUES (${q(b.id)},${q(b.name)},${q(b.code)},${q(b.leaderId)},${q(b.description)},${q(b.ancestorId)},${q(b.colorAccent)})
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,code=EXCLUDED.code,leader_id=EXCLUDED.leader_id,description=EXCLUDED.description,ancestor_id=EXCLUDED.ancestor_id,color_accent=EXCLUDED.color_accent;
`;
}

for (const m of INITIAL_MEMBERS) {
  sql += `INSERT INTO public.members
(id,full_name,courtesy_name,posthumous_name,gender,generation,branch_id,phai_name,chi_name,nhanh_name,order_in_family,order_title,birth_place,birth_date,birth_date_lunar,is_alive,death_date,death_date_lunar,burial_location,burial_coordinates,avatar_url,phone,email,current_address,occupation,bio,achievements,father_id,mother_id,spouse_ids,is_root_ancestor)
VALUES (${q(m.id)},${q(m.fullName)},${q(m.courtesyName)},${q(m.posthumousName)},${q(m.gender)},${m.generation},${q(m.branchId)},${q(m.phaiName)},${q(m.chiName)},${q(m.nhanhName)},${m.orderInFamily || 1},${q(m.orderTitle)},${q(m.birthPlace)},${q(m.birthDate)},${q(m.birthDateLunar)},${m.isAlive ? 'TRUE' : 'FALSE'},${q(m.deathDate)},${q(m.deathDateLunar)},${q(m.burialLocation)},${m.burialCoordinates ? j(m.burialCoordinates) : 'NULL'},${q(m.avatarUrl)},${q(m.phone)},${q(m.email)},${q(m.currentAddress)},${q(m.occupation)},${q(m.bio)},${j(m.achievements)},${q(m.fatherId)},${q(m.motherId)},${j(m.spouseIds)},${m.isRootAncestor ? 'TRUE' : 'FALSE'})
ON CONFLICT (id) DO UPDATE SET
full_name=EXCLUDED.full_name, courtesy_name=EXCLUDED.courtesy_name, posthumous_name=EXCLUDED.posthumous_name,
gender=EXCLUDED.gender, generation=EXCLUDED.generation, branch_id=EXCLUDED.branch_id,
phai_name=EXCLUDED.phai_name, chi_name=EXCLUDED.chi_name, nhanh_name=EXCLUDED.nhanh_name,
order_in_family=EXCLUDED.order_in_family, order_title=EXCLUDED.order_title, birth_place=EXCLUDED.birth_place,
birth_date=EXCLUDED.birth_date, birth_date_lunar=EXCLUDED.birth_date_lunar, is_alive=EXCLUDED.is_alive,
death_date=EXCLUDED.death_date, death_date_lunar=EXCLUDED.death_date_lunar,
burial_location=EXCLUDED.burial_location, burial_coordinates=EXCLUDED.burial_coordinates,
avatar_url=EXCLUDED.avatar_url, phone=EXCLUDED.phone, email=EXCLUDED.email,
current_address=EXCLUDED.current_address, occupation=EXCLUDED.occupation, bio=EXCLUDED.bio,
achievements=EXCLUDED.achievements, father_id=EXCLUDED.father_id, mother_id=EXCLUDED.mother_id,
spouse_ids=EXCLUDED.spouse_ids, is_root_ancestor=EXCLUDED.is_root_ancestor, updated_at=NOW();
`;
}

for (const e of INITIAL_EVENTS) {
  sql += `INSERT INTO public.events (id,title,type,member_id,lunar_day,lunar_month,lunar_year,description,location,responsible_branch_id)
VALUES (${q(e.id)},${q(e.title)},${q(e.type)},${q(e.memberId)},${e.lunarDay},${e.lunarMonth},${e.lunarYear ?? 'NULL'},${q(e.description)},${q(e.location)},${q(e.responsibleBranchId)})
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,type=EXCLUDED.type,member_id=EXCLUDED.member_id,lunar_day=EXCLUDED.lunar_day,lunar_month=EXCLUDED.lunar_month,lunar_year=EXCLUDED.lunar_year,description=EXCLUDED.description,location=EXCLUDED.location,responsible_branch_id=EXCLUDED.responsible_branch_id;
`;
}

for (const d of INITIAL_DOCUMENTS) {
  sql += `INSERT INTO public.documents (id,title,category,category_label,file_url,file_type,description,recorded_date,dynasty_era,author_or_preserver,tags,images)
VALUES (${q(d.id)},${q(d.title)},${q(d.category)},${q(d.categoryLabel)},${q(d.fileUrl)},${q(d.fileType)},${q(d.description)},${q(d.recordedDate)},${q(d.dynastyEra)},${q(d.authorOrPreserver)},${j(d.tags)},${j(d.images)})
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,category_label=EXCLUDED.category_label,file_url=EXCLUDED.file_url,file_type=EXCLUDED.file_type,description=EXCLUDED.description,recorded_date=EXCLUDED.recorded_date,dynasty_era=EXCLUDED.dynasty_era,author_or_preserver=EXCLUDED.author_or_preserver,tags=EXCLUDED.tags,images=EXCLUDED.images;
`;
}

for (const f of INITIAL_FUNDS) {
  sql += `INSERT INTO public.funds (id,title,type,amount,contributor_or_receiver,date,purpose,branch_name,receipt_number)
VALUES (${q(f.id)},${q(f.title)},${q(f.type)},${Number(f.amount) || 0},${q(f.contributorOrReceiver)},${q(f.date)},${q(f.purpose)},${q(f.branchName)},${q(f.receiptNumber)})
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,type=EXCLUDED.type,amount=EXCLUDED.amount,contributor_or_receiver=EXCLUDED.contributor_or_receiver,date=EXCLUDED.date,purpose=EXCLUDED.purpose,branch_name=EXCLUDED.branch_name,receipt_number=EXCLUDED.receipt_number;
`;
}

for (const post of INITIAL_POSTS) {
  sql += `INSERT INTO public.posts (id,title,author_name,author_role,avatar_url,created_at,category,content,images,likes_count,comments_count)
VALUES (${q(post.id)},${q(post.title)},${q(post.authorName)},${q(post.authorRole)},${q(post.avatarUrl)},${q(post.createdAt)},${q(post.category)},${q(post.content)},${j(post.images)},${Number(post.likesCount) || 0},${Number(post.commentsCount) || 0})
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,author_name=EXCLUDED.author_name,author_role=EXCLUDED.author_role,avatar_url=EXCLUDED.avatar_url,category=EXCLUDED.category,content=EXCLUDED.content,images=EXCLUDED.images,likes_count=EXCLUDED.likes_count,comments_count=EXCLUDED.comments_count;
`;
}

sql += '\nCOMMIT;\n';
fs.writeFileSync('public/supabase_import.sql', sql, 'utf8');
console.log(`Generated ${INITIAL_MEMBERS.length} members and all seed tables.`);

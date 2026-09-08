import { supabase } from './supabase';
import type { Branch, DocumentItem, EventItem, FundRecord, Member, PostItem } from '../types';

const requireDb = () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình. Hãy kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  return supabase;
};

const memberToRow = (m: Member) => ({
  id: m.id, full_name: m.fullName, courtesy_name: m.courtesyName ?? null,
  posthumous_name: m.posthumousName ?? null, gender: m.gender, generation: m.generation,
  branch_id: m.branchId || null, phai_name: m.phaiName ?? null, chi_name: m.chiName ?? null,
  nhanh_name: m.nhanhName ?? null, order_in_family: m.orderInFamily, order_title: m.orderTitle ?? null,
  birth_place: m.birthPlace ?? null, birth_date: m.birthDate ?? null, birth_date_lunar: m.birthDateLunar ?? null,
  is_alive: m.isAlive, death_date: m.deathDate ?? null, death_date_lunar: m.deathDateLunar ?? null,
  burial_location: m.burialLocation ?? null, burial_coordinates: m.burialCoordinates ?? null,
  avatar_url: m.avatarUrl ?? null, phone: m.phone ?? null, email: m.email ?? null,
  current_address: m.currentAddress ?? null, occupation: m.occupation ?? null, bio: m.bio ?? null,
  achievements: m.achievements ?? [], father_id: m.fatherId ?? null, mother_id: m.motherId ?? null,
  spouse_ids: m.spouseIds ?? [], is_root_ancestor: m.isRootAncestor ?? false,
  created_at: m.createdAt ?? undefined, updated_at: new Date().toISOString(),
});

const rowToMember = (r: any): Member => ({
  id: r.id, fullName: r.full_name, courtesyName: r.courtesy_name ?? undefined,
  posthumousName: r.posthumous_name ?? undefined, gender: r.gender, generation: r.generation,
  branchId: r.branch_id ?? '', phaiName: r.phai_name ?? undefined, chiName: r.chi_name ?? undefined,
  nhanhName: r.nhanh_name ?? undefined, orderInFamily: r.order_in_family ?? 1, orderTitle: r.order_title ?? undefined,
  birthPlace: r.birth_place ?? undefined, birthDate: r.birth_date ?? undefined, birthDateLunar: r.birth_date_lunar ?? undefined,
  isAlive: r.is_alive ?? true, deathDate: r.death_date ?? undefined, deathDateLunar: r.death_date_lunar ?? undefined,
  burialLocation: r.burial_location ?? undefined, burialCoordinates: r.burial_coordinates ?? undefined,
  avatarUrl: r.avatar_url ?? undefined, phone: r.phone ?? undefined, email: r.email ?? undefined,
  currentAddress: r.current_address ?? undefined, occupation: r.occupation ?? undefined, bio: r.bio ?? undefined,
  achievements: Array.isArray(r.achievements) ? r.achievements : [], fatherId: r.father_id ?? null,
  motherId: r.mother_id ?? null, spouseIds: Array.isArray(r.spouse_ids) ? r.spouse_ids : [],
  isRootAncestor: r.is_root_ancestor ?? false, createdAt: r.created_at, updatedAt: r.updated_at,
});

const branchToRow = (b: Branch) => ({ id:b.id, name:b.name, code:b.code, leader_id:b.leaderId ?? null, description:b.description ?? null, ancestor_id:b.ancestorId ?? null, color_accent:b.colorAccent ?? null });
const rowToBranch = (r:any): Branch => ({ id:r.id,name:r.name,code:r.code,leaderId:r.leader_id ?? undefined,description:r.description ?? undefined,ancestorId:r.ancestor_id ?? undefined,colorAccent:r.color_accent ?? undefined });

const eventToRow = (e: EventItem) => ({ id:e.id,title:e.title,type:e.type,member_id:e.memberId ?? null,lunar_day:e.lunarDay,lunar_month:e.lunarMonth,lunar_year:e.lunarYear ?? null,description:e.description,location:e.location,responsible_branch_id:e.responsibleBranchId ?? null });
const rowToEvent = (r:any): EventItem => ({ id:r.id,title:r.title,type:r.type,memberId:r.member_id ?? undefined,lunarDay:r.lunar_day,lunarMonth:r.lunar_month,lunarYear:r.lunar_year ?? undefined,description:r.description ?? '',location:r.location ?? '',responsibleBranchId:r.responsible_branch_id ?? undefined });

const documentToRow = (d: DocumentItem) => ({ id:d.id,title:d.title,category:d.category,category_label:d.categoryLabel,file_url:d.fileUrl,file_type:d.fileType,description:d.description,dynasty_era:d.dynastyEra ?? null,author_or_preserver:d.authorOrPreserver ?? null,recorded_date:d.recordedDate ?? null,tags:d.tags ?? [] });
const rowToDocument = (r:any): DocumentItem => ({ id:r.id,title:r.title,category:r.category,categoryLabel:r.category_label,fileUrl:r.file_url,fileType:r.file_type ?? 'image',description:r.description ?? '',dynastyEra:r.dynasty_era ?? undefined,authorOrPreserver:r.author_or_preserver ?? undefined,recordedDate:r.recorded_date ?? undefined,tags:Array.isArray(r.tags)?r.tags:[] });

const postToRow = (p: PostItem) => ({ id:p.id,title:p.title,author_name:p.authorName,author_role:p.authorRole,avatar_url:p.avatarUrl ?? null,category:p.category,content:p.content,images:p.images ?? [],likes_count:p.likesCount ?? 0,comments_count:p.commentsCount ?? 0,created_at: new Date(p.createdAt === 'Hôm nay' ? Date.now() : p.createdAt).toISOString() });
const rowToPost = (r:any): PostItem => ({ id:r.id,title:r.title,authorName:r.author_name,authorRole:r.author_role,avatarUrl:r.avatar_url ?? undefined,createdAt:r.created_at,category:r.category,content:r.content,images:Array.isArray(r.images)?r.images:[],likesCount:r.likes_count ?? 0,commentsCount:r.comments_count ?? 0 });

const fundToRow = (f: FundRecord) => ({ id:f.id,title:f.title,type:f.type,amount:f.amount,contributor_or_receiver:f.contributorOrReceiver,date:f.date,purpose:f.purpose,branch_name:f.branchName ?? null,receipt_number:f.receiptNumber ?? null });
const rowToFund = (r:any): FundRecord => ({ id:r.id,title:r.title,type:r.type,amount:Number(r.amount),contributorOrReceiver:r.contributor_or_receiver,date:r.date,purpose:r.purpose,branchName:r.branch_name ?? undefined,receiptNumber:r.receipt_number ?? undefined });

export async function loadAllData() {
  const db = requireDb();
  const [ci,b,m,e,d,p,f] = await Promise.all([
    db.from('clan_info').select('*').eq('id','main_clan').maybeSingle(),
    db.from('branches').select('*').order('created_at'),
    db.from('members').select('*').order('generation').order('order_in_family'),
    db.from('events').select('*').order('lunar_month').order('lunar_day'),
    db.from('documents').select('*').order('created_at',{ascending:false}),
    db.from('posts').select('*').order('created_at',{ascending:false}),
    db.from('funds').select('*').order('created_at',{ascending:false}),
  ]);
  for (const x of [ci,b,m,e,d,p,f]) if (x.error) throw x.error;
  return {
    clanInfo: ci.data ? { name:ci.data.name, branchSubtitle:ci.data.branch_subtitle ?? '', ancestralHall:ci.data.ancestral_hall ?? '', address:ci.data.address ?? '', foundingYear:ci.data.founding_year ?? 0, motto:ci.data.motto ?? '', mottoMeaning:ci.data.motto_meaning ?? '' } : null,
    branches:(b.data ?? []).map(rowToBranch), members:(m.data ?? []).map(rowToMember), events:(e.data ?? []).map(rowToEvent), documents:(d.data ?? []).map(rowToDocument), posts:(p.data ?? []).map(rowToPost), funds:(f.data ?? []).map(rowToFund),
  };
}

export async function saveMember(m:Member){ const {error}=await requireDb().from('members').upsert(memberToRow(m)); if(error) throw error; }
export async function deleteMember(id:string){ const {error}=await requireDb().from('members').delete().eq('id',id); if(error) throw error; }
export async function saveBranch(b:Branch){ const {error}=await requireDb().from('branches').upsert(branchToRow(b)); if(error) throw error; }
export async function saveEvent(e:EventItem){ const {error}=await requireDb().from('events').upsert(eventToRow(e)); if(error) throw error; }
export async function deleteEvent(id:string){ const {error}=await requireDb().from('events').delete().eq('id',id); if(error) throw error; }
export async function saveDocument(d:DocumentItem){ const {error}=await requireDb().from('documents').upsert(documentToRow(d)); if(error) throw error; }
export async function deleteDocument(id:string){ const {error}=await requireDb().from('documents').delete().eq('id',id); if(error) throw error; }
export async function savePost(p:PostItem){ const {error}=await requireDb().from('posts').upsert(postToRow(p)); if(error) throw error; }
export async function saveFund(f:FundRecord){ const {error}=await requireDb().from('funds').upsert(fundToRow(f)); if(error) throw error; }
export async function saveClanInfo(info:any){ const {error}=await requireDb().from('clan_info').upsert({id:'main_clan',name:info.name,branch_subtitle:info.branchSubtitle,ancestral_hall:info.ancestralHall,address:info.address,founding_year:info.foundingYear,motto:info.motto,motto_meaning:info.mottoMeaning,updated_at:new Date().toISOString()}); if(error) throw error; }
export async function loadClanUsers(){ const {data,error}=await requireDb().from('clan_users').select('*').order('created_at'); if(error) throw error; return (data ?? []).map((d:any)=>({id:d.id,email:d.email,name:d.name,avatarUrl:d.avatar_url ?? undefined,role:d.role,memberId:d.member_id ?? undefined,branchId:d.branch_id ?? undefined,createdAt:d.created_at,lastLogin:d.last_login,status:d.status,notes:d.notes ?? undefined})); }
export async function loadClanUserByEmail(email:string){ const db=requireDb(); const {data,error}=await db.from('clan_users').select('*').eq('email',email.toLowerCase()).maybeSingle(); if(error) throw error; return data ? {id:data.id,email:data.email,name:data.name,avatarUrl:data.avatar_url ?? undefined,role:data.role,memberId:data.member_id ?? undefined,branchId:data.branch_id ?? undefined,createdAt:data.created_at,lastLogin:data.last_login,status:data.status,notes:data.notes ?? undefined} : null; }
export async function saveClanUser(u:any){ const {error}=await requireDb().from('clan_users').upsert({id:u.id,email:u.email.toLowerCase(),name:u.name,avatar_url:u.avatarUrl ?? null,role:u.role,member_id:u.memberId ?? null,branch_id:u.branchId ?? null,status:u.status,notes:u.notes ?? null,last_login:new Date().toISOString()}); if(error) throw error; }
export async function deleteClanUser(id:string){ const {error}=await requireDb().from('clan_users').delete().eq('id',id); if(error) throw error; }

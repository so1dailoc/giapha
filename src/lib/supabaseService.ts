import { supabase, isSupabaseConfigured } from './supabase';
import type { User } from '@supabase/supabase-js';
import { Member, Branch, EventItem, DocumentItem, ClanUser, ClanInfo, FundRecord, PostItem, BurialLocationSubmission } from '../types';

/**
 * Chuyển đổi từ Member (TypeScript frontend) sang Record database (snake_case PostgreSQL)
 */
export function memberToDbRow(member: Member): Record<string, any> {
  const row: Record<string, any> = {
    id: member.id,
    full_name: member.fullName,
    courtesy_name: member.courtesyName || null,
    posthumous_name: member.posthumousName || null,
    gender: member.gender,
    generation: member.generation,
    branch_id: member.branchId || null,
    phai_name: member.phaiName || null,
    chi_name: member.chiName || null,
    nhanh_name: member.nhanhName || null,
    order_in_family: member.orderInFamily || 1,
    order_title: member.orderTitle || null,
    birth_place: member.birthPlace || null,
    birth_date: member.birthDate || null,
    birth_date_lunar: member.birthDateLunar || null,
    is_alive: member.isAlive ?? true,
    death_date: member.deathDate || null,
    death_date_lunar: member.deathDateLunar || null,
    burial_location: member.burialLocation || null,
    avatar_url: member.avatarUrl || null,
    phone: member.phone || null,
    email: member.email || null,
    current_address: member.currentAddress || null,
    occupation: member.occupation || null,
    bio: member.bio || null,
    achievements: member.achievements || [],
    father_id: member.fatherId || null,
    mother_id: member.motherId || null,
    spouse_ids: member.spouseIds || [],
    is_root_ancestor: member.isRootAncestor || false,
    updated_at: new Date().toISOString(),
  };

  // Nếu có tọa độ mộ phần, lưu dạng JSONB { lat, lng }
  if (member.burialCoordinates && typeof member.burialCoordinates.lat === 'number') {
    row.burial_coordinates = {
      lat: member.burialCoordinates.lat,
      lng: member.burialCoordinates.lng,
    };
  } else {
    row.burial_coordinates = null;
  }

  return row;
}

/**
 * Chuyển đổi từ Record database (snake_case) sang Member (frontend)
 */
export function dbRowToMember(row: Record<string, any>): Member {
  return {
    id: row.id,
    fullName: row.full_name,
    courtesyName: row.courtesy_name || undefined,
    posthumousName: row.posthumous_name || undefined,
    gender: row.gender,
    generation: row.generation,
    branchId: row.branch_id || 'branch-root',
    phaiName: row.phai_name || undefined,
    chiName: row.chi_name || undefined,
    nhanhName: row.nhanh_name || undefined,
    orderInFamily: row.order_in_family || 1,
    orderTitle: row.order_title || undefined,
    birthPlace: row.birth_place || undefined,
    birthDate: row.birth_date || undefined,
    birthDateLunar: row.birth_date_lunar || undefined,
    isAlive: row.is_alive ?? true,
    deathDate: row.death_date || undefined,
    deathDateLunar: row.death_date_lunar || undefined,
    burialLocation: row.burial_location || undefined,
    burialCoordinates:
      row.burial_coordinates && typeof row.burial_coordinates === 'object'
        ? {
            lat: Number(row.burial_coordinates.lat) || 0,
            lng: Number(row.burial_coordinates.lng) || 0,
          }
        : undefined,
    avatarUrl: row.avatar_url || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    currentAddress: row.current_address || undefined,
    occupation: row.occupation || undefined,
    bio: row.bio || undefined,
    achievements: Array.isArray(row.achievements) ? row.achievements : undefined,
    fatherId: row.father_id || null,
    motherId: row.mother_id || null,
    spouseIds: Array.isArray(row.spouse_ids) ? row.spouse_ids : [],
    isRootAncestor: row.is_root_ancestor ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}



export async function fetchClanUsersFromSupabase(): Promise<ClanUser[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('clan_users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url || undefined,
    role: row.role as ClanUser['role'],
    memberId: row.member_id || undefined,
    branchId: row.branch_id || undefined,
    createdAt: row.created_at,
    lastLogin: row.last_login || undefined,
    status: row.status as ClanUser['status'],
    notes: row.notes || undefined,
  }));
}

export async function saveClanUserToSupabase(user: ClanUser): Promise<{ success: boolean; user?: ClanUser; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)
    ? user.id
    : crypto.randomUUID();

  const row = {
    id: uuid,
    email: user.email.trim().toLowerCase(),
    name: user.name.trim(),
    avatar_url: user.avatarUrl || null,
    role: user.role,
    member_id: user.memberId || null,
    branch_id: user.branchId || null,
    status: user.status,
    notes: user.notes || null,
    last_login: user.lastLogin || null,
  };

  const { data, error } = await supabase.from('clan_users').upsert(row, { onConflict: 'id' }).select('*').single();
  if (error || !data) return { success: false, error: error?.message || 'Không thể lưu tài khoản.' };

  return {
    success: true,
    user: {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url || undefined,
      role: data.role as ClanUser['role'],
      memberId: data.member_id || undefined,
      branchId: data.branch_id || undefined,
      createdAt: data.created_at,
      lastLogin: data.last_login || undefined,
      status: data.status as ClanUser['status'],
      notes: data.notes || undefined,
    },
  };
}

export async function deleteClanUserFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('clan_users').delete().eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function fetchCurrentClanUser(authUser: User): Promise<ClanUser | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  const email = authUser.email?.trim().toLowerCase();
  if (!email) return null;

  const { data, error } = await supabase
    .from('clan_users')
    .select('*')
    .eq('email', email)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name || authUser.user_metadata?.full_name || email.split('@')[0],
    avatarUrl: data.avatar_url || authUser.user_metadata?.avatar_url,
    role: data.role as ClanUser['role'],
    memberId: data.member_id || undefined,
    branchId: data.branch_id || undefined,
    createdAt: data.created_at,
    lastLogin: data.last_login,
    status: data.status,
    notes: data.notes || undefined,
  };
}

export interface SaveMemberResult {
  success: boolean;
  error?: string | null;
  missingBurialCoordinatesColumn?: boolean;
}

/**
 * Lưu hoặc cập nhật một thành viên vào Supabase Database
 * CÓ CƠ CHẾ TỰ ĐỘNG PHỤC HỒI NẾU THIẾU CỘT burial_coordinates TRÊN SUPABASE
 */
export async function saveMemberToSupabase(member: Member): Promise<SaveMemberResult> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: true };
  }

  const row = memberToDbRow(member);

  try {
    const { error } = await supabase.from('members').upsert(row, { onConflict: 'id' });

    if (error) {
      // Bắt lỗi cụ thể "Could not find the 'burial_coordinates' column of 'members' in the schema cache"
      if (error.message && error.message.toLowerCase().includes('burial_coordinates')) {
        console.warn(
          'Supabase bảng members đang thiếu cột burial_coordinates. Đang tự động lưu dự phòng không có cột này:',
          error.message
        );
        // Loại bỏ trường burial_coordinates và thử lại ngay lập tức để người dùng KHÔNG BỊ LỖI
        const { burial_coordinates, ...fallbackRow } = row;
        const retry = await supabase.from('members').upsert(fallbackRow, { onConflict: 'id' });

        if (!retry.error) {
          return {
            success: true,
            missingBurialCoordinatesColumn: true,
          };
        }
        return { success: false, error: retry.error.message };
      }

      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi không xác định khi lưu Supabase' };
  }
}

/**
 * Xóa thành viên khỏi Supabase
 */
export async function deleteMemberFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi xóa thành viên trên Supabase' };
  }
}

/**
 * Tải danh sách thành viên từ Supabase
 */


export async function upsertClanInfoToSupabase(info: ClanInfo) {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('clan_info').upsert({
    id: 'main_clan', name: info.name, branch_subtitle: info.branchSubtitle,
    ancestral_hall: info.ancestralHall, address: info.address, founding_year: info.foundingYear,
    motto: info.motto, motto_meaning: info.mottoMeaning,
    default_tree_settings: info.defaultTreeSettings || {},
    allow_user_view_customization: info.allowUserViewCustomization ?? true,
    contact_notice: info.contactNotice || null,
    contact_phone: info.contactPhone || null,
    contact_email: info.contactEmail || null,
    updated_at: new Date().toISOString(),
  });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function upsertEventToSupabase(e: EventItem) {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('events').upsert({
    id: e.id, title: e.title, type: e.type, member_id: e.memberId || null,
    lunar_day: e.lunarDay, lunar_month: e.lunarMonth, lunar_year: e.lunarYear || null,
    description: e.description, location: e.location, responsible_branch_id: e.responsibleBranchId || null,
  }, { onConflict: 'id' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function deleteEventFromSupabase(id: string) {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('events').delete().eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function upsertDocumentToSupabase(d: DocumentItem) {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('documents').upsert({
    id: d.id, title: d.title, category: d.category, category_label: d.categoryLabel,
    file_url: d.fileUrl, file_type: d.fileType, description: d.description,
    recorded_date: d.recordedDate || null, dynasty_era: d.dynastyEra || null,
    author_or_preserver: d.authorOrPreserver || null, tags: d.tags || [], images: d.images || [],
  }, { onConflict: 'id' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function deleteDocumentFromSupabase(id: string) {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('documents').delete().eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function upsertFundToSupabase(f: FundRecord) {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('funds').upsert({
    id: f.id, title: f.title, type: f.type, amount: f.amount,
    contributor_or_receiver: f.contributorOrReceiver, date: f.date, purpose: f.purpose,
    branch_name: f.branchName || null, receipt_number: f.receiptNumber || null,
  }, { onConflict: 'id' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function upsertPostToSupabase(post: PostItem) {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const { error } = await supabase.from('posts').upsert({
    id: post.id, title: post.title, author_name: post.authorName, author_role: post.authorRole,
    avatar_url: post.avatarUrl || null, created_at: post.createdAt, category: post.category,
    content: post.content, images: post.images || [], likes_count: post.likesCount, comments_count: post.commentsCount,
  }, { onConflict: 'id' });
  return error ? { success: false, error: error.message } : { success: true };
}

export interface ClanDataSnapshot {
  clanInfo?: ClanInfo;
  branches?: Branch[];
  events?: EventItem[];
  documents?: DocumentItem[];
  funds?: FundRecord[];
  posts?: PostItem[];
}

const MEMBER_SELECT = `
  id, full_name, courtesy_name, posthumous_name, gender, generation,
  branch_id, phai_name, chi_name, nhanh_name, order_in_family, order_title,
  birth_place, birth_date, birth_date_lunar, is_alive, death_date, death_date_lunar,
  burial_location, burial_coordinates, avatar_url, phone, email, current_address,
  occupation, bio, achievements, father_id, mother_id, spouse_ids, is_root_ancestor,
  created_at, updated_at
`;

/**
 * Tải thành viên theo trang. Supabase thường giới hạn số dòng trả về mặc định;
 * phân trang giúp cây gia phả không bị cắt khi có trên 1.000 thành viên.
 */
export async function fetchMembersFromSupabase(): Promise<{ members: Member[] | null; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { members: null };

  try {
    const pageSize = 1000;
    const allRows: Record<string, any>[] = [];

    const fetchPage = async (page: number) => {
      const from = page * pageSize;
      return supabase
        .from('members')
        .select(MEMBER_SELECT)
        .order('generation', { ascending: true })
        .order('full_name', { ascending: true })
        .range(from, from + pageSize - 1);
    };

    // Fetch the first page immediately, then prefetch the next batch in parallel.
    // This keeps the safe 1,000-row/page limit while avoiding 5+ sequential round trips
    // for a 5,000-member clan.
    let page = 0;
    while (true) {
      const first = await fetchPage(page);
      if (first.error) return { members: null, error: first.error.message };
      const firstData = first.data || [];
      if (!firstData.length) break;
      allRows.push(...firstData);
      if (firstData.length < pageSize) break;

      const batchPages = [page + 1, page + 2, page + 3, page + 4];
      const batch = await Promise.all(batchPages.map(fetchPage));
      let reachedEnd = false;
      for (const result of batch) {
        if (result.error) return { members: null, error: result.error.message };
        const rows = result.data || [];
        if (rows.length) allRows.push(...rows);
        if (rows.length < pageSize) {
          reachedEnd = true;
          break;
        }
      }
      if (reachedEnd) break;
      page += 5;
    }

    return { members: allRows.map(dbRowToMember) };
  } catch (err: any) {
    return { members: null, error: err?.message };
  }
}

async function fetchEventsOnly(): Promise<EventItem[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  const { data } = await supabase.from('events').select('*').order('lunar_month').order('lunar_day');
  return data?.map((e) => ({
    id: e.id, title: e.title, type: e.type, memberId: e.member_id || undefined,
    memberName: undefined, lunarDay: e.lunar_day, lunarMonth: e.lunar_month,
    lunarYear: e.lunar_year || undefined, description: e.description || '',
    location: e.location || '', responsibleBranchId: e.responsible_branch_id || undefined,
  })) || [];
}

async function fetchDocumentsOnly(): Promise<DocumentItem[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  return data?.map((d) => ({
    id: d.id, title: d.title, category: d.category, categoryLabel: d.category_label,
    fileUrl: d.file_url, fileType: d.file_type, description: d.description || '',
    recordedDate: d.recorded_date || undefined, dynastyEra: d.dynasty_era || undefined,
    authorOrPreserver: d.author_or_preserver || undefined,
    tags: Array.isArray(d.tags) ? d.tags : [], images: Array.isArray(d.images) ? d.images : [],
  })) || [];
}

async function fetchPostsOnly(): Promise<PostItem[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
  return data?.map((post) => ({
    id: post.id, title: post.title, authorName: post.author_name, authorRole: post.author_role,
    avatarUrl: post.avatar_url || undefined, createdAt: post.created_at, category: post.category,
    content: post.content, images: Array.isArray(post.images) ? post.images : [],
    likesCount: post.likes_count || 0, commentsCount: post.comments_count || 0,
  })) || [];
}

/** Chỉ tải dữ liệu cần cho màn hình khởi động: thông tin dòng họ + phái/chi. */
export async function fetchCoreClanDataFromSupabase(): Promise<ClanDataSnapshot> {
  if (!supabase || !isSupabaseConfigured) return {};
  const [clanInfo, branches] = await Promise.all([
    supabase.from('clan_info').select('*').eq('id', 'main_clan').maybeSingle(),
    supabase.from('branches').select('id,name,code,leader_id,description,ancestor_id,color_accent').order('name'),
  ]);
  return {
    clanInfo: clanInfo.data ? {
      name: clanInfo.data.name,
      branchSubtitle: clanInfo.data.branch_subtitle || '',
      ancestralHall: clanInfo.data.ancestral_hall || '',
      address: clanInfo.data.address || '',
      foundingYear: clanInfo.data.founding_year || 0,
      motto: clanInfo.data.motto || '',
      mottoMeaning: clanInfo.data.motto_meaning || '',
      defaultTreeSettings: clanInfo.data.default_tree_settings || {},
      allowUserViewCustomization: clanInfo.data.allow_user_view_customization ?? true,
      contactNotice: clanInfo.data.contact_notice || '',
      contactPhone: clanInfo.data.contact_phone || '',
      contactEmail: clanInfo.data.contact_email || '',
    } : undefined,
    branches: branches.data?.map((b) => ({
      id: b.id, name: b.name, code: b.code, leaderId: b.leader_id || undefined,
      description: b.description || undefined, ancestorId: b.ancestor_id || undefined,
      colorAccent: b.color_accent || undefined,
    })),
  };
}

/** Lazy-load dữ liệu phụ trợ khi người dùng thực sự mở từng menu. */
export async function fetchEventsFromSupabase() { return fetchEventsOnly(); }
export async function fetchDocumentsFromSupabase() { return fetchDocumentsOnly(); }
export async function fetchPostsFromSupabase() { return fetchPostsOnly(); }
export async function fetchFundsFromSupabase(): Promise<FundRecord[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  const { data } = await supabase.from('funds').select('*').order('date', { ascending: false });
  return data?.map((f) => ({
    id: f.id, title: f.title, type: f.type, amount: Number(f.amount) || 0,
    contributorOrReceiver: f.contributor_or_receiver, date: f.date, purpose: f.purpose,
    branchName: f.branch_name || undefined, receiptNumber: f.receipt_number || undefined,
  })) || [];
}

export async function fetchClanDataFromSupabase(): Promise<ClanDataSnapshot> {
  const core = await fetchCoreClanDataFromSupabase();
  const [events, documents, funds, posts] = await Promise.all([
    fetchEventsOnly(), fetchDocumentsOnly(), fetchFundsFromSupabase(), fetchPostsOnly(),
  ]);
  return { ...core, events, documents, funds, posts };
}

/**
 * Đẩy toàn bộ dữ liệu mẫu lên Supabase (Seed Initial Clan Data)
 */
export async function seedAllClanDataToSupabase(params: {
  members: Member[];
  branches: Branch[];
  clanInfo: ClanInfo;
  events: EventItem[];
  documents: DocumentItem[];
  funds: FundRecord[];
  posts: PostItem[];
  clanUsers: ClanUser[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, count: 0, error: 'Chưa cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY' };
  }

  try {
    // 1. Lưu clan_info
    await supabase.from('clan_info').upsert({
      id: 'main_clan',
      name: params.clanInfo.name,
      branch_subtitle: params.clanInfo.branchSubtitle,
      ancestral_hall: params.clanInfo.ancestralHall,
      address: params.clanInfo.address,
      founding_year: params.clanInfo.foundingYear,
      motto: params.clanInfo.motto,
      motto_meaning: params.clanInfo.mottoMeaning,
    });

    // 2. Lưu branches
    const branchRows = params.branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      leader_id: b.leaderId || null,
      description: b.description || null,
      ancestor_id: b.ancestorId || null,
      color_accent: b.colorAccent || '#d97706',
    }));
    await supabase.from('branches').upsert(branchRows, { onConflict: 'id' });

    // 3. Lưu members (với cơ chế an toàn bỏ qua burial_coordinates nếu thiếu cột)
    const memberRows = params.members.map(memberToDbRow);
    let memberError = (await supabase.from('members').upsert(memberRows, { onConflict: 'id' })).error;

    if (memberError && memberError.message.toLowerCase().includes('burial_coordinates')) {
      const fallbackMemberRows = memberRows.map(({ burial_coordinates, ...rest }) => rest);
      memberError = (await supabase.from('members').upsert(fallbackMemberRows, { onConflict: 'id' })).error;
    }
    if (memberError) throw memberError;

    // 4. Lưu sự kiện
    if (params.events.length) {
      const { error } = await supabase.from('events').upsert(params.events.map((e) => ({
        id: e.id, title: e.title, type: e.type, member_id: e.memberId || null,
        lunar_day: e.lunarDay, lunar_month: e.lunarMonth, lunar_year: e.lunarYear || null,
        description: e.description, location: e.location,
      })), { onConflict: 'id' });
      if (error) throw error;
    }

    // 5. Lưu tư liệu
    if (params.documents.length) {
      const { error } = await supabase.from('documents').upsert(params.documents.map((d) => ({
        id: d.id, title: d.title, category: d.category, category_label: d.categoryLabel,
        file_url: d.fileUrl, file_type: d.fileType, description: d.description,
        dynasty_era: d.dynastyEra || null, author_or_preserver: d.authorOrPreserver || null,
        tags: d.tags || [], created_at: d.recordedDate || undefined,
      })), { onConflict: 'id' });
      if (error) throw error;
    }

    // 6. Lưu quỹ
    if (params.funds.length) {
      const { error } = await supabase.from('funds').upsert(params.funds.map((f) => ({
        id: f.id, title: f.title, type: f.type, amount: f.amount,
        contributor_or_receiver: f.contributorOrReceiver, date: f.date,
        purpose: f.purpose, branch_name: f.branchName || null, receipt_number: f.receiptNumber || null,
      })), { onConflict: 'id' });
      if (error) throw error;
    }

    // 7. Lưu bài viết
    if (params.posts.length) {
      const { error } = await supabase.from('posts').upsert(params.posts.map((p) => ({
        id: p.id, title: p.title, author_name: p.authorName, author_role: p.authorRole,
        avatar_url: p.avatarUrl || null, created_at: p.createdAt, category: p.category,
        content: p.content, images: p.images || [], likes_count: p.likesCount, comments_count: p.commentsCount,
      })), { onConflict: 'id' });
      if (error) throw error;
    }

    return {
      success: true,
      count: params.members.length + params.branches.length + params.events.length +
        params.documents.length + params.funds.length + params.posts.length,
    };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Lỗi khi đồng bộ lên Supabase' };
  }
}


export async function submitBurialLocationSuggestion(input: {
  memberId: string;
  mapsUrl: string;
  latitude: number;
  longitude: number;
  note?: string;
  submittedByName?: string;
  submittedByContact?: string;
}): Promise<{ success: boolean; error?: string; submission?: BurialLocationSubmission }> {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const row = {
    member_id: input.memberId, maps_url: input.mapsUrl.trim(), latitude: input.latitude, longitude: input.longitude,
    note: input.note?.trim() || null, submitted_by_name: input.submittedByName?.trim() || null,
    submitted_by_contact: input.submittedByContact?.trim() || null, status: 'pending'
  };
  const { data, error } = await supabase.from('burial_location_submissions').insert(row).select('*, members:member_id(full_name)').single();
  if (error || !data) return { success: false, error: error?.message || 'Không thể gửi đề xuất vị trí mộ.' };
  return { success: true, submission: {
    id: data.id, memberId: data.member_id, memberName: data.members?.full_name, mapsUrl: data.maps_url,
    latitude: Number(data.latitude), longitude: Number(data.longitude), note: data.note || undefined,
    submittedByName: data.submitted_by_name || undefined, submittedByContact: data.submitted_by_contact || undefined,
    status: data.status, adminNote: data.admin_note || undefined, reviewedBy: data.reviewed_by || undefined,
    reviewedAt: data.reviewed_at || undefined, createdAt: data.created_at
  }};
}

export async function fetchBurialLocationSubmissions(): Promise<BurialLocationSubmission[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('burial_location_submissions')
    .select('*, members:member_id(full_name)').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id, memberId: row.member_id, memberName: row.members?.full_name, mapsUrl: row.maps_url,
    latitude: Number(row.latitude), longitude: Number(row.longitude), note: row.note || undefined,
    submittedByName: row.submitted_by_name || undefined, submittedByContact: row.submitted_by_contact || undefined,
    status: row.status, adminNote: row.admin_note || undefined, reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined, createdAt: row.created_at
  }));
}

export async function reviewBurialLocationSubmission(input: {
  submission: BurialLocationSubmission; approved: boolean; adminNote?: string; reviewerName?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase chưa được cấu hình.' };
  const status = input.approved ? 'approved' : 'rejected';
  const { error } = await supabase.from('burial_location_submissions').update({
    status, admin_note: input.adminNote?.trim() || null, reviewed_by: input.reviewerName || null, reviewed_at: new Date().toISOString()
  }).eq('id', input.submission.id);
  if (error) return { success: false, error: error.message };
  if (input.approved) {
    const { error: memberError } = await supabase.from('members').update({
      burial_coordinates: { lat: input.submission.latitude, lng: input.submission.longitude },
      updated_at: new Date().toISOString()
    }).eq('id', input.submission.memberId);
    if (memberError) return { success: false, error: memberError.message };
  }
  return { success: true };
}

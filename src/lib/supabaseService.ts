import { supabase, isSupabaseConfigured } from './supabase';
import { Member, Branch, EventItem, DocumentItem, ClanUser, ClanInfo, FundRecord, PostItem } from '../types';

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
export async function fetchMembersFromSupabase(): Promise<{ members: Member[] | null; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { members: null };
  }

  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('generation', { ascending: true });

    if (error) {
      return { members: null, error: error.message };
    }

    if (data && data.length > 0) {
      return { members: data.map(dbRowToMember) };
    }

    return { members: [] };
  } catch (err: any) {
    return { members: null, error: err?.message };
  }
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

    if (memberError && memberError.message.includes('burial_coordinates')) {
      // Fallback không có burial_coordinates
      const fallbackMemberRows = memberRows.map(({ burial_coordinates, ...rest }) => rest);
      memberError = (await supabase.from('members').upsert(fallbackMemberRows, { onConflict: 'id' })).error;
    }

    if (memberError) {
      throw memberError;
    }

    return { success: true, count: params.members.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Lỗi khi đồng bộ lên Supabase' };
  }
}

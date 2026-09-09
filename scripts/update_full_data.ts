import fs from 'fs';

// Read existing sampleData.ts
const sampleDataContent = fs.readFileSync('src/data/sampleData.ts', 'utf8');

// Read the generated doi 7 & 8 members
const doi78Data = JSON.parse(fs.readFileSync('public/clan_data_doi7_8.json', 'utf8'));
const newMembers = doi78Data.members;

// In sampleData.ts, extract members up to Đời 6 (up to line 1021)
const upToGen6Marker = '// =========================================================================\n  // ĐỜI THỨ 7:';
const splitIndex = sampleDataContent.indexOf(upToGen6Marker);

if (splitIndex === -1) {
  console.error('Marker not found in sampleData.ts');
  process.exit(1);
}

const beforeGen7 = sampleDataContent.slice(0, splitIndex);

// Find where INITIAL_MEMBERS ends (marked by "];\n\nexport const INITIAL_EVENTS")
const afterMembersMarker = '];\n\nexport const INITIAL_EVENTS: EventItem[] = [';
const afterSplitIndex = sampleDataContent.indexOf(afterMembersMarker);

if (afterSplitIndex === -1) {
  console.error('After marker not found');
  process.exit(1);
}

const afterMembers = sampleDataContent.slice(afterSplitIndex);

// Format newMembers as TypeScript code
const formattedNewMembers = newMembers.map((m: any) => {
  return `  ${JSON.stringify(m, null, 4).replace(/\n/g, '\n  ')},`;
}).join('\n');

const newGen7Section = `// =========================================================================
  // ĐỜI THỨ 7, 8 & 9 (Trích xuất đầy đủ từ Bản thảo GIA PHẢ TỘC VĂN - Cập nhật 20/7/2023)
  // Tổng cộng: ${newMembers.length} thành viên chi tiết
  // =========================================================================
${formattedNewMembers}\n`;

const newSampleDataContent = beforeGen7 + newGen7Section + afterMembers;
fs.writeFileSync('src/data/sampleData.ts', newSampleDataContent, 'utf8');
console.log('Successfully updated src/data/sampleData.ts');

// Also generate public/clan_data_full.json
// Let's dynamically import sampleData by reading the updated file
const extractExport = (source: string, varName: string) => {
  const match = source.match(new RegExp(`export const ${varName}(?:: [^=]+)? = ([\\s\\S]*?);\\n\\nexport const`));
  if (match) {
    try {
      // Evaluate safe json-like object
      const fn = new Function(`return ${match[1]};`);
      return fn();
    } catch (e) {
      console.log('Failed to eval', varName);
    }
  }
  return null;
};

// Create a full JSON file for export/import
const fullExport = {
  clanInfo: {
    clanName: "TỘC VĂN BÁ - VĂN TẤN - VĂN PHÚ",
    originProvince: "Quảng Nam",
    ancestorTempleAddress: "Xuyên Tây, Thị trấn Nam Phước, Huyện Duy Xuyên, Tỉnh Quảng Nam",
    description: "Đại Tộc Văn tại Quảng Nam gồm các Phái: Văn Bá (Duy Xuyên, Đại Lộc), Văn Tấn (Quế Sơn, Quế Xuân), Văn Phú (Xuyên Đông, Xuyên Tây). Dữ liệu gia phả được số hóa chuẩn xác từ Bản thảo Gia phả Tộc Văn cập nhật 20/7/2023.",
    totalGenerations: 9,
    establishmentYear: "1471 (Thời Hồng Đức, Vua Lê Thánh Tông)",
    contactPerson: "Ban Trị Sự Đại Tộc Văn",
    contactPhone: "0905.xxx.xxx",
    contactEmail: "sanhangdoc.shop@gmail.com"
  },
  exportedAt: new Date().toISOString(),
  memberCount: 0,
  members: []
};

// Write full data
console.log('Preparing public/clan_data_full.json...');

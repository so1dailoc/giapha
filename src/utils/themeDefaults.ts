import { FamilyTreeSettings } from '../types';

export const DEFAULT_TREE_CARD_SETTINGS: Partial<FamilyTreeSettings> = {
  horizontalCardWidth: 260,
  horizontalCardHeight: 210,
  horizontalCardFontSize: 14,
  horizontalCardNameColor: '#fef3c7',
  horizontalCardNameBackgroundColor: '#350207',
  horizontalCardBackgroundColor: '#5c0612',
  horizontalCardBorderColor: '#d4a72c',
  verticalCardWidth: 78,
  verticalCardHeight: 180,
  verticalCardFontSize: 13,
  verticalCardNameColor: '#fef3c7',
  verticalCardNameBackgroundColor: '#350207',
  verticalCardBackgroundColor: '#5c0612',
  verticalCardBorderColor: '#d4a72c',
  cardHorizontalGap: 30,
  cardVerticalGap: 150,
  interFamilyGap: 110,
};

export const DEFAULT_INTERFACE_THEME = {
  interfaceThemePreset: 'traditional' as const,
  interfacePrimaryColor: '#5c0612',
  interfaceAccentColor: '#d4a72c',
  interfacePageBackground: '#180204',
  interfaceSurfaceColor: '#fffaf0',
  interfaceTextColor: '#2f1a14',
  interfaceFontFamily: 'be-vietnam' as const,
  interfaceRadius: 'soft' as const,
  interfaceHeaderColor: '#5c0612',
  interfaceNavColor: '#280205',
  interfaceButtonColor: '#d4a72c',
  interfaceButtonTextColor: '#3b0207',
  interfaceMutedTextColor: '#f3c969',
};

export function getInterfaceThemePreset(name: string): Partial<FamilyTreeSettings> {
  const presets = {
    traditional: { ...DEFAULT_INTERFACE_THEME, interfaceThemePreset: 'traditional', interfacePrimaryColor: '#5c0612', interfaceAccentColor: '#d4a72c', interfacePageBackground: '#180204', interfaceSurfaceColor: '#fffaf0', interfaceTextColor: '#2f1a14', interfaceHeaderColor: '#5c0612', interfaceNavColor: '#280205', interfaceButtonColor: '#d4a72c', interfaceButtonTextColor: '#3b0207', interfaceMutedTextColor: '#f3c969' },
    paper: { ...DEFAULT_INTERFACE_THEME, interfaceThemePreset: 'paper', interfacePrimaryColor: '#6b4f2a', interfaceAccentColor: '#b88746', interfacePageBackground: '#efe4cc', interfaceSurfaceColor: '#fffaf0', interfaceTextColor: '#3f3022', interfaceHeaderColor: '#6b4f2a', interfaceNavColor: '#5a4125', interfaceButtonColor: '#b88746', interfaceButtonTextColor: '#fffaf0', interfaceMutedTextColor: '#765b3b' },
    modern: { ...DEFAULT_INTERFACE_THEME, interfaceThemePreset: 'modern', interfacePrimaryColor: '#334155', interfaceAccentColor: '#0ea5e9', interfacePageBackground: '#f1f5f9', interfaceSurfaceColor: '#ffffff', interfaceTextColor: '#0f172a', interfaceHeaderColor: '#334155', interfaceNavColor: '#1e293b', interfaceButtonColor: '#0ea5e9', interfaceButtonTextColor: '#ffffff', interfaceMutedTextColor: '#64748b' },
    forest: { ...DEFAULT_INTERFACE_THEME, interfaceThemePreset: 'forest', interfacePrimaryColor: '#14532d', interfaceAccentColor: '#65a30d', interfacePageBackground: '#071c12', interfaceSurfaceColor: '#f0fdf4', interfaceTextColor: '#123524', interfaceHeaderColor: '#14532d', interfaceNavColor: '#064e3b', interfaceButtonColor: '#65a30d', interfaceButtonTextColor: '#ffffff', interfaceMutedTextColor: '#4d7c0f' },
    midnight: { ...DEFAULT_INTERFACE_THEME, interfaceThemePreset: 'midnight', interfacePrimaryColor: '#0f172a', interfaceAccentColor: '#818cf8', interfacePageBackground: '#020617', interfaceSurfaceColor: '#111827', interfaceTextColor: '#e5e7eb', interfaceHeaderColor: '#0f172a', interfaceNavColor: '#020617', interfaceButtonColor: '#818cf8', interfaceButtonTextColor: '#ffffff', interfaceMutedTextColor: '#a5b4fc' },
  } as const;
  return presets[name as keyof typeof presets] || presets.traditional;
}

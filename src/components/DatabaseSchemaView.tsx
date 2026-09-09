import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, FolderTree, ShieldCheck, Server, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';

const viteStructure = `gia-pha-dai-toc/
├─ src/
│  ├─ components/
│  ├─ data/
│  ├─ lib/
│  │  ├─ supabase.ts
│  │  └─ supabaseService.ts
│  ├─ utils/
│  ├─ App.tsx
│  ├─ types.ts
│  └─ main.tsx
├─ public/
│  ├─ clan_data_full.json
│  └─ supabase_import.sql
├─ supabase/
│  └─ schema.sql
├─ .env.example
├─ package.json
├─ vite.config.ts
└─ vercel.json`;

export const DatabaseSchemaView: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'structure' | 'deploy'>('sql');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    confetti({ particleCount: 25, spread: 60 });
    window.setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] p-5 sm:p-6 rounded-2xl border-2 border-amber-500/40 shadow-xl text-amber-50">
        <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-semibold mb-1">
          <Server className="w-4 h-4" />
          Backend Supabase
        </div>
        <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-200">
          Database & Hướng Dẫn Triển Khai
        </h2>
        <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
          Schema hiện tại của ứng dụng dùng PostgreSQL + RLS + Supabase Auth, đồng bộ với frontend Vite/React.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ['sql', 'SQL Supabase', Database],
          ['structure', 'Cấu trúc Vite', FolderTree],
          ['deploy', 'Quy trình Deploy', Zap],
        ].map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setActiveTab(id as typeof activeTab)}
            className={`shrink-0 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 ${
              activeTab === id ? 'bg-amber-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'sql' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Terminal className="w-4 h-4 text-emerald-400" /> supabase/schema.sql
            </div>
            <button type="button" onClick={handleCopy} className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 text-xs">
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? 'Đã sao chép' : 'Sao chép SQL'}
            </button>
          </div>
          <pre className="p-4 text-emerald-300 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-auto max-h-[560px] whitespace-pre-wrap">
            <code>{SUPABASE_SQL_SCHEMA}</code>
          </pre>
        </div>
      )}

      {activeTab === 'structure' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <FolderTree className="w-4 h-4" /> Cấu trúc dự án production
          </div>
          <pre className="text-amber-100 font-mono text-xs leading-relaxed overflow-auto p-4 bg-slate-950 rounded-xl">
            <code>{viteStructure}</code>
          </pre>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 text-xs text-slate-700">
          <h3 className="text-base font-bold text-slate-900 font-serif">Deploy Vercel + Supabase</h3>
          <ol className="list-decimal pl-5 space-y-3 leading-relaxed">
            <li>Chạy <code>supabase/schema.sql</code> trong Supabase SQL Editor.</li>
            <li>Chạy <code>public/supabase_import.sql</code> để nhập 332 thành viên và dữ liệu mẫu.</li>
            <li>Bật Google Provider trong Supabase Authentication và cấu hình OAuth redirect theo domain Vercel.</li>
            <li>Trên Vercel, thêm <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code>.</li>
            <li>Deploy với Build Command <code>npm run build</code>, Output Directory <code>dist</code>.</li>
          </ol>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Không bao giờ đưa Supabase service-role key hoặc Google Client Secret vào frontend/GitHub.</span>
          </div>
        </div>
      )}
    </div>
  );
};

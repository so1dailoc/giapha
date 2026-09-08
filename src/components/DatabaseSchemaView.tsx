import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, FolderTree, ShieldCheck, Sparkles, Server, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';

export const DatabaseSchemaView: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'nextjs' | 'deploy'>('sql');

  const supabaseSqlScript = SUPABASE_SQL_SCHEMA;

  const handleCopy = () => {
    navigator.clipboard.writeText(supabaseSqlScript);
    setCopiedSql(true);
    confetti({ particleCount: 25, spread: 60 });
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] p-6 rounded-2xl border-2 border-amber-500/40 shadow-xl text-amber-50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <Server className="w-4 h-4" />
            Kiến Trúc Backend & Database Supabase 0đ
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-200">
            Database Schema & Hướng Dẫn Triển Khai Miễn Phí
          </h2>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            Thiết kế hoàn chỉnh theo tiêu chuẩn cơ sở dữ liệu quan hệ PostgreSQL trên Supabase: Phân quyền RLS chặt chẽ, tối ưu unaccent tiếng Việt và sẵn sàng chạy trên Next.js / GitHub Pages / Vercel với chi phí 0đ trọn đời.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'sql'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          Mã Nguồn SQL Supabase (1-Click Copy)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nextjs')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'nextjs'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Cấu Trúc Thư Mục Next.js (App Router)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deploy')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'deploy'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Quy Trình Triển Khai 0đ (Vercel + Supabase)
        </button>
      </div>

      {activeTab === 'sql' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-slate-200">supabase_schema_family_tree.sql</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 transition-colors text-xs"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  Đã Copy Toàn Bộ SQL!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Sao Chép Mã SQL (1-Click)
                </>
              )}
            </button>
          </div>

          <pre className="p-5 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px]">
            <code>{supabaseSqlScript}</code>
          </pre>
        </div>
      )}

      {activeTab === 'nextjs' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <FolderTree className="w-4 h-4" />
            Cấu trúc dự án chuẩn Next.js 15 App Router & Clean Architecture
          </div>
          <pre className="text-amber-100 font-mono text-xs leading-relaxed overflow-x-auto p-4 bg-slate-950 rounded-xl border border-slate-800">
            <code>{nextJsStructure}</code>
          </pre>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs text-slate-700">
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Hướng Dẫn Tối Ưu Chi Phí 0đ (Zero-Cost Deployment)
          </h3>
          <ol className="list-decimal pl-5 space-y-2.5 leading-relaxed">
            <li>
              <b>Bước 1: Tạo dự án Supabase miễn phí (0đ):</b> Đăng ký tài khoản tại <code>supabase.com</code>, tạo một Project mới. Vào mục <b>SQL Editor</b>, dán mã nguồn SQL ở Tab trên và nhấn <b>Run</b> để tạo bảng, indexes và RLS policies.
            </li>
            <li>
              <b>Bước 2: Tạo Storage Bucket:</b> Vào mục <b>Storage</b> trong Supabase Dashboard, tạo 2 buckets: <code>family-avatars</code> (Public) và <code>family-archives</code> (Private, cấp quyền xem cho authenticated users).
            </li>
            <li>
              <b>Bước 3: Tích hợp Frontend Next.js:</b> Đẩy mã nguồn lên GitHub. Cung cấp 2 biến môi trường: <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </li>
            <li>
              <b>Bước 4: Deploy lên Vercel hoặc GitHub Pages:</b> Kết nối Repo GitHub với Vercel (Hobby plan miễn phí 100%). Website sẽ tự động build và có chứng chỉ SSL HTTPS miễn phí trọn đời.
            </li>
            <li>
              <b>Bước 5: Sao lưu dữ liệu tự động (Edge Function):</b> Kích hoạt Cron Trigger trên Supabase hàng tuần xuất file JSON dump dữ liệu và gửi vào bucket lưu trữ phòng ngừa rủi ro.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

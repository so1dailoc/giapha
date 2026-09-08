import React, { useState, useMemo } from 'react';
import { EventItem, Member, Branch } from '../types';
import { estimateSolarDateFromLunar } from '../utils/lunarCalendar';
import { Calendar, Clock, MapPin, Bell, CheckCircle, Flame, Plus, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LunarAnniversariesProps {
  events: EventItem[];
  members: Member[];
  branches: Branch[];
  onSelectMember?: (member: Member) => void;
}

export const LunarAnniversaries: React.FC<LunarAnniversariesProps> = ({
  events,
  members,
  branches,
  onSelectMember,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());

  // Calculate dynamic days left and solar dates for all events
  const enrichedEvents = useMemo(() => {
    return events.map((evt) => {
      const { solarDateString, daysLeft, formattedDate } = estimateSolarDateFromLunar(
        evt.lunarDay,
        evt.lunarMonth,
        2026
      );
      return {
        ...evt,
        solarDateThisYear: solarDateString,
        daysLeft,
        formattedSolarDate: formattedDate,
      };
    }).sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'upcoming') {
      return enrichedEvents.filter((e) => (e.daysLeft ?? 999) <= 45);
    }
    if (filterType === 'death_anniversary') {
      return enrichedEvents.filter((e) => e.type === 'death_anniversary');
    }
    return enrichedEvents;
  }, [enrichedEvents, filterType]);

  const handleRegisterRSVP = (evtId: string, title: string) => {
    setNotifiedEvents((prev) => new Set(prev).add(evtId));
    confetti({
      particleCount: 30,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] p-6 rounded-2xl border-2 border-amber-500/40 shadow-xl text-amber-50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <Calendar className="w-4 h-4" />
            Lịch Âm Lịch & Tế Tự Gia Tộc
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-200">
            Lịch Ngày Giỗ & Sự Kiện Trọng Đại Dòng Họ
          </h2>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            Hệ thống tự động chuyển đổi ngày mất Âm lịch sang ngày Dương lịch năm 2026/2027, đếm ngược ngày giỗ sắp tới và phân công chi nhánh đăng cai tế lễ chu toàn.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả sự kiện ({enrichedEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'upcoming'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sắp diễn ra (Dưới 45 ngày)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('death_anniversary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'death_anniversary'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Chỉ ngày Giỗ Tiên Tổ
          </button>
        </div>

        <div className="text-xs text-slate-500 italic">
          Năm Bính Thìn (2026) • Tế tự trang nghiêm
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((evt) => {
          const isUrgent = (evt.daysLeft ?? 999) <= 15;
          const isRegistered = notifiedEvents.has(evt.id);
          const branch = evt.responsibleBranchId ? branchMap.get(evt.responsibleBranchId) : null;

          return (
            <div
              key={evt.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isUrgent ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Top Badge & Countdown */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                      evt.type === 'death_anniversary'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-red-500" />
                    {evt.type === 'death_anniversary' ? 'Ngày Giỗ Tổ' : 'Họp Mặt & Lễ Hội'}
                  </span>

                  <div
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                      isUrgent
                        ? 'bg-red-100 text-red-800 animate-pulse'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Còn {evt.daysLeft} ngày</span>
                  </div>
                </div>

                {/* Event Title */}
                <h3 className="text-base font-bold text-slate-900 font-serif leading-snug">
                  {evt.title}
                </h3>

                {/* Dates (Lunar & Solar) */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ngày Âm lịch cố định:</span>
                    <span className="font-bold text-amber-800">
                      Ngày {evt.lunarDay} tháng {evt.lunarMonth} Âm
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dương lịch năm 2026:</span>
                    <span className="font-bold text-slate-800">
                      {evt.formattedSolarDate || evt.solarDateThisYear}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Địa điểm:
                    </span>
                    <span className="font-medium text-slate-700">{evt.location}</span>
                  </div>

                  {branch && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        Đơn vị chủ trì:
                      </span>
                      <span className="font-semibold text-amber-800">{branch.name}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {evt.description}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleRegisterRSVP(evt.id, evt.title)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    isRegistered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Đã đăng ký tham dự
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      Đăng ký tham dự & Đóng lễ
                    </>
                  )}
                </button>

                {evt.memberId && onSelectMember && (
                  <button
                    type="button"
                    onClick={() => {
                      const m = members.find((item) => item.id === evt.memberId);
                      if (m) onSelectMember(m);
                    }}
                    className="text-xs text-slate-600 hover:text-amber-700 hover:underline font-medium"
                  >
                    Xem tiểu sử người mất →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

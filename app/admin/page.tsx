"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';
import { User, RealtimeChannel } from '@supabase/supabase-js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { LogOut, Phone, MessageSquare, ShieldCheck, Search, Bell, X, Send, Users, Activity, FileText, Calendar as CalendarIcon, List, Paperclip, Star, ChevronRight, Briefcase, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../ThemeToggle';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null); // user_id klien yang sedang di-chat
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [filterService, setFilterService] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const router = useRouter();
  const adminChannelRef = useRef<RealtimeChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<string | null>(null);

  // Sinkronkan activeChatRef dengan state activeChat
  useEffect(() => {
    activeChatRef.current = activeChat;
    // Segera periksa status mengetik saat berpindah chat klien
    updateTypingStatus();
  }, [activeChat]);

  const updateTypingStatus = () => {
    if (!adminChannelRef.current || !activeChatRef.current) {
      setIsClientTyping(false);
      return;
    }
    const state = adminChannelRef.current.presenceState();
    const clientPresence = Object.values(state).flat() as any[];
    const isTyping = clientPresence.some((p: any) => 
      p.isTyping && p.user_id === activeChatRef.current
    );
    setIsClientTyping(isTyping);
  };

  // Auto-scroll ke bawah saat ada pesan baru, klien mengetik, atau ganti chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, activeChat, isClientTyping]);
  
  // Ganti ini dengan email asli klien pengacara Anda
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    let isMounted = true;
    let channel: RealtimeChannel | null = null;

    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = ADMIN_EMAIL?.toLowerCase().trim();
      const userEmail = user?.email?.toLowerCase().trim();
      
      if (!user || userEmail !== adminEmail) {
        alert("Akses ditolak. Halaman ini hanya untuk Admin.");
        router.push('/'); 
        return;
      }

      if (!isMounted) return;

      fetchAllBookings();
      fetchMessages();
      
      // Setup Realtime Subscription
      channel = supabase
        .channel('law-chat-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bookings' },
          (payload) => {
            const newBooking = payload.new;
            toast.success(`Booking Baru dari ${newBooking.name}!`, {
              duration: 5000,
              icon: <Bell className="text-blue-900" />,
            });
            setBookings((prev) => [newBooking, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'bookings' },
          (payload) => {
            const updatedBooking = payload.new;
            setBookings((prev) =>
              prev.map((b) =>
                b.id === updatedBooking.id ? { ...b, status: updatedBooking.status } : b
              )
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            if (payload.new.sender_id !== user.id) {
              toast(`Pesan baru dari klien!`, { icon: '💬' });
            }
          }
        )
        .on('presence', { event: 'sync' }, () => {
          updateTypingStatus();
        })
        .subscribe((status) => {
          if (!isMounted) return;
          if (status === 'CLOSED') return; // Abaikan jika memang sengaja ditutup
          if (status !== 'SUBSCRIBED') {
            console.error("Gagal terhubung ke Realtime:", status);
          }
        });

      adminChannelRef.current = channel;
    };

    checkAdmin();

    return () => {
      isMounted = false;
      // Hapus channel berdasarkan referensi jika sudah terisi
      if (channel) supabase.removeChannel(channel);
      if (adminChannelRef.current) supabase.removeChannel(adminChannelRef.current);
    };
  }, [router]);

  const handleAdminTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setReply(e.target.value);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && adminChannelRef.current) {
      await adminChannelRef.current.track({
        user_id: user.id,
        isTyping: e.target.value.length > 0,
        role: 'admin'
      });
    }
  };

  const markAsRead = async (clientId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', clientId)
      .eq('is_read', false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!reply.trim() || !user || !activeChat) return;

    await supabase.from('messages').insert([{ 
      content: reply, 
      sender_id: user.id,
      receiver_id: activeChat 
    }]);
    
    if (adminChannelRef.current) {
      await adminChannelRef.current.track({ user_id: user.id, isTyping: false, role: 'admin' });
    }

    setReply("");
  };

  const fetchAllBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
    setLoading(false);
  };

  const updateAmount = async (bookingId: string, amount: number | null) => {
    // Validasi input: pastikan amount adalah angka yang valid atau null
    if (amount !== null && isNaN(amount)) {
      toast.error("Nominal biaya tidak valid.");
      return;
    }

    const { error } = await supabase.from('bookings').update({ amount }).eq('id', bookingId);
    if (!error) {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, amount } : b));
      toast.success("Biaya berhasil diperbarui.");
    } else {
      toast.error("Gagal memperbarui biaya: " + error.message);
      console.error("Supabase error updating amount:", error);
    }
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      alert("Gagal memperbarui status: " + error.message);
    } else {
      // Update state lokal agar tampilan langsung berubah
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === "Semua" || (booking.status || 'Pending') === filterStatus;
    const matchesService = filterService === "Semua" || booking.service === filterService;
    const matchesSearch = (booking.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesService && matchesSearch;
  });

  // Mengolah data booking untuk grafik mingguan (7 hari terakhir)
  const chartData = React.useMemo(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        fullDate: date.toISOString().split('T')[0],
        dayName: days[date.getDay()],
        count: 0
      };
    }).reverse();

    bookings.forEach(booking => {
      const bDate = new Date(booking.created_at).toISOString().split('T')[0];
      const found = last7Days.find(d => d.fullDate === bDate);
      if (found) found.count++;
    });
    return last7Days;
  }, [bookings]);

  if (loading) return <div className="min-h-screen flex items-center justify-center italic text-slate-500 text-lg">Memverifikasi Admin...</div>;

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending' || !b.status).length,
    active: bookings.filter(b => b.status === 'Disetujui').length
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-900 rounded-xl text-white"><ShieldCheck size={28} /></div>
              Admin Command Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Kelola konsultasi hukum LawOffice secara efisien.</p>
          </div>
          
          {/* Summary Bar */}
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
            <div className="px-5 py-2 flex items-center gap-3">
              <div className="text-blue-600"><Users size={18} /></div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 leading-none">Total Klien</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{stats.total}</p>
              </div>
            </div>
            <div className="px-5 py-2 flex items-center gap-3">
              <div className="text-amber-500"><Activity size={18} /></div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 leading-none">Menunggu</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Statistik Grafik */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Aktivitas Booking Mingguan</h2>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                <XAxis 
                  dataKey="dayName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="flex justify-end mb-6">
          <ThemeToggle />
          <button 
            onClick={handleLogout}
            className="ml-3 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <LogOut size={18} /> Keluar
          </button>
        </div>
        
        {/* View Switcher */}
        <div className="mb-6 flex gap-2">
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'table' ? 'bg-blue-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <List size={18} /> Tabel
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'calendar' ? 'bg-blue-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <CalendarIcon size={18} /> Kalender
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Filter Layanan */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Layanan:</span>
              <select 
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="Semua">Semua Layanan</option>
                <option value="Hukum Perdata">Hukum Perdata</option>
                <option value="Hukum Pidana">Hukum Pidana</option>
                <option value="Hukum Korporasi">Hukum Korporasi</option>
                <option value="Hukum Keluarga">Hukum Keluarga</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status:</span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Nama Klien</th>
                  <th className="px-8 py-5">Kontak</th>
                  <th className="px-8 py-5">Dokumen</th>
                  <th className="px-8 py-5">Jadwal</th>
                  <th className="px-8 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-slate-500 text-xs border dark:border-slate-700">
                          {booking.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight mb-1">{booking.name}</p>
                          <button
                            onClick={() => { setActiveChat(booking.user_id); markAsRead(booking.user_id); }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-black uppercase tracking-widest"
                          >
                            <MessageSquare size={10} /> Chat {messages.some(m => m.sender_id === booking.user_id && !m.is_read) && "•"}
                          </button>
                          {booking.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star size={10} className="text-yellow-400 fill-current" />
                              <span className="text-[10px] font-bold text-slate-500">{booking.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <a href={`https://wa.me/${booking.phone}`} target="_blank" className="text-[11px] flex items-center gap-2 text-green-600 dark:text-green-400 font-black bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl w-fit hover:scale-105 transition-transform">
                        <Phone size={14} /> {booking.phone}
                      </a>
                    </td>
                    <td className="px-8 py-6">
                      {booking.document_url ? (
                        <a 
                          href={booking.document_url} 
                          target="_blank" 
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 font-black text-[10px] uppercase tracking-widest"
                        >
                          <Paperclip size={14} /> File
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1">{new Date(booking.appointment_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(booking.appointment_date).getFullYear()}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => { setSelectedBooking(booking); setIsMessageModalOpen(true); }}
                        className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all w-32 ${
                          booking.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 
                          booking.status === 'Disetujui' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {booking.status || 'Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 admin-calendar-container"
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              locale="id"
              events={filteredBookings.map(booking => ({
                id: booking.id,
                title: `${booking.name} (${booking.service})`,
                start: booking.appointment_date,
                backgroundColor: booking.status === 'Disetujui' ? '#2563eb' : (booking.status === 'Selesai' ? '#10b981' : '#f59e0b'),
                borderColor: 'transparent',
                extendedProps: { ...booking }
              }))}
              eventClick={(info) => {
                setSelectedBooking(info.event.extendedProps);
                setIsMessageModalOpen(true);
              }}
              height="700px"
            />
          </motion.div>
        )}

        {/* Modal Detail Masalah Lengkap */}
        <AnimatePresence>
          {isMessageModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-lg w-full p-10 relative shadow-2xl border dark:border-slate-800"
              >
              <button 
                onClick={() => setIsMessageModalOpen(false)} 
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
                <h2 className="text-2xl font-black mb-8 text-slate-900 dark:text-white flex items-center gap-3 tracking-tight uppercase">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl">
                    <FileText size={24} />
                  </div>
                  Detail Konsultasi
              </h2>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Nama Klien</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">{selectedBooking?.name}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">WhatsApp</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">{selectedBooking?.phone}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Layanan</p>
                    <p className="text-sm font-black text-blue-900 dark:text-blue-400 uppercase tracking-tight">{selectedBooking?.service}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Tanggal Jadwal</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      {selectedBooking?.appointment_date ? new Date(selectedBooking.appointment_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border dark:border-slate-800">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-2">Deskripsi Masalah</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm italic">
                    {selectedBooking?.message || "Tidak ada deskripsi yang diberikan."}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border dark:border-slate-800">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-3 ml-1">Update Status & Biaya</p>
                  <div className="flex flex-col gap-4">
                    <select 
                      value={selectedBooking?.status || 'Pending'}
                      onChange={(e) => updateStatus(selectedBooking.id, e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border-none rounded-2xl text-sm font-black uppercase outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all shadow-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Dibatalkan">Dibatalkan</option>
                    </select>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <input 
                          type="number" 
                          className="w-full p-3 bg-white dark:bg-slate-900 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all shadow-sm pl-10"
                          placeholder="Nominal biaya..."
                          defaultValue={selectedBooking?.amount ?? ''}
                          onBlur={(e) => {
                            if (selectedBooking) {
                              const value = e.target.value.trim();
                              const parsedAmount = value === '' ? null : parseInt(value, 10);
                              updateAmount(selectedBooking.id, parsedAmount);
                            }
                          }}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                      </div>
                      <div className="bg-blue-600 px-5 py-3 rounded-2xl text-xs font-black text-white flex items-center shadow-lg shadow-blue-200 dark:shadow-none">IDR</div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsMessageModalOpen(false)}
                className="mt-8 w-full bg-slate-900 dark:bg-blue-700 text-white py-4 rounded-2xl font-black hover:bg-slate-800 dark:hover:bg-blue-600 transition shadow-xl active:scale-95"
              >
                Selesai & Simpan
              </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* UI Floating Chat Admin */}
        <AnimatePresence>
          {activeChat && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-8 right-8 w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border dark:border-slate-800 overflow-hidden z-[70] flex flex-col h-[600px]"
            >
              <div className="p-6 bg-blue-900 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-tight">{bookings.find(b => b.user_id === activeChat)?.name || 'Klien'}</h2>
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Konsultasi Aktif</p>
                  </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="hover:bg-blue-800 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/30 scroll-smooth">
              {messages
                .filter(msg => msg.sender_id === activeChat || msg.receiver_id === activeChat)
                .map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id !== activeChat ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm transition-transform ${
                      msg.sender_id !== activeChat 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              {isClientTyping && (
                <div className="flex justify-start">
                  <div className="text-xs text-slate-400 italic animate-pulse">
                    Klien sedang mengetik...
                  </div>
                </div>
              )}
            </div>

              <form onSubmit={sendReply} className="p-6 border-t dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900">
              <input 
                type="text" 
                value={reply}
                onChange={handleAdminTyping}
                placeholder="Ketik balasan..."
                className="flex-1 px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all"
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white p-3.5 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-90"
              >
                <Send size={20} />
              </button>
            </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

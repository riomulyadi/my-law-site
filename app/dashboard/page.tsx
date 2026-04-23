"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Pastikan path ini benar
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Send, MessageSquare, Layout, Briefcase, CheckCircle, Clock, Calendar, LogOut, User as UserIcon, Plus, X, Upload, CreditCard, Star, ChevronRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../ThemeToggle';

interface Booking {
  id: string;
  service: string;
  appointment_date: string;
  message: string | null;
  status: 'Pending' | 'Disetujui' | 'Selesai' | 'Dibatalkan';
  payment_status?: 'Paid' | 'Unpaid';
  document_url?: string;
  amount?: number | null; // Izinkan null untuk amount
  rating?: number;
  created_at: string;
  user_id: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  receiver_id?: string;
  is_read: boolean;
}

// --- KOMPONEN MODAL BOOKING ---
const BookingModal = ({ isOpen, onClose, userId, onSuccess }: { isOpen: boolean, onClose: () => void, userId: string | undefined, onSuccess: () => void }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Hukum Perdata");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let document_url = null;

    // 1. Upload File ke Supabase Storage jika ada
    if (file && userId) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('booking-docs')
        .upload(filePath, file);

      if (uploadError) {
        alert("Gagal upload dokumen: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('booking-docs').getPublicUrl(filePath);
      document_url = urlData.publicUrl;
    }

    // 2. Simpan Data Booking
    const { error } = await supabase
      .from('bookings')
      .insert([{ 
        user_id: userId,
        name, 
        phone,
        service, 
        appointment_date: date, 
        message,
        document_url,
        status: 'Pending',
        payment_status: 'Unpaid'
      }]);

    setLoading(false);

    if (error) {
      alert("Gagal menyimpan data: " + error.message);
    } else {
      alert("Booking Berhasil!");
      setName("");
      setPhone("");
      setDate("");
      setMessage("");
      setFile(null);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 relative shadow-2xl border dark:border-slate-800"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black mb-6 text-slate-900 dark:text-white tracking-tight">Konsultasi Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Nama Lengkap</label>
            <input required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">WhatsApp</label>
            <input required type="tel" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Layanan</label>
            <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white" value={service} onChange={(e) => setService(e.target.value)}>
              <option>Hukum Perdata</option>
              <option>Hukum Pidana</option>
              <option>Hukum Korporasi</option>
              <option>Hukum Keluarga</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Tanggal</label>
            <input required type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Dokumen (Opsional)</label>
            <div className="flex items-center gap-2 p-3 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <Upload size={18} className="text-slate-400" />
              <input 
                type="file" 
                className="text-xs file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Pesan</label>
            <textarea required rows={3} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-600 resize-none dark:text-white" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition disabled:bg-slate-400 active:scale-95"
          >
            {loading ? "Mengirim..." : "Konfirmasi Jadwal"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<{isOpen: boolean, bookingId: string | null}>({ isOpen: false, bookingId: null });
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chatChannelRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat ada pesan baru atau admin mengetik
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isAdminTyping]);

  useEffect(() => {
    let isMounted = true;
    let updateChannel: RealtimeChannel | null = null;
    let typingTimeout: NodeJS.Timeout;

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); // Redirect jika belum login
      } else {
        if (!isMounted) return;
        setUser(user);
        fetchBookings(user.id);
        fetchMessages();

        // Setup Realtime Subscription untuk update status
        updateChannel = supabase
          .channel(`user-updates-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'bookings',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              setBookings((prev) => 
                prev.map((b) => b.id === payload.new.id ? (payload.new as Booking) : b)
              );
            }
          )
          .subscribe();

        // Setup Realtime untuk Chat
        chatChannelRef.current = supabase
          .channel('law-chat-channel', { config: { presence: { key: user.id } } })
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages' 
          }, (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          })
          .on('presence', { event: 'sync' }, () => {
            const state = chatChannelRef.current.presenceState();
            // Cek apakah admin (menggunakan email/ID khusus) sedang mengetik
            const adminPresence = Object.values(state).flat() as any[];
            const isTyping = adminPresence.some(p => p.isTyping && p.role === 'admin');
            setIsAdminTyping(isTyping);
          })
          .subscribe();

      }
    };
    getUser();

    return () => {
      isMounted = false;
      if (updateChannel) supabase.removeChannel(updateChannel);
      if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);
    };
  }, [router]);

  // Fungsi untuk mengirim status mengetik
  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (user && chatChannelRef.current) {
      await chatChannelRef.current.track({
        user_id: user.id,
        isTyping: e.target.value.length > 0,
        role: 'user'
      });
    }
  };

  // Menandai pesan sebagai terbaca saat user melihat chat
  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  };

  const fetchBookings = async (userId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log("Data booking yang ditemukan:", data);

    if (error) {
      console.error("Error fetching bookings:", error.message);
      // Jika error 400, kemungkinan kolom 'user_id' tidak ada di tabel 'bookings'
    } else if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      markAsRead();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert([{ 
        content: newMessage, 
        sender_id: user.id 
      }]);

    // Berhenti mengetik setelah kirim
    if (chatChannelRef.current) {
      await chatChannelRef.current.track({ user_id: user.id, isTyping: false, role: 'user' });
    }

    if (!error) setNewMessage("");
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
    setLoading(false);
  };

  const handlePayment = async (booking: Booking) => {
    if (!booking.amount) {
      toast.error("Biaya belum ditentukan oleh admin.");
      return;
    }

    const loadingToast = toast.loading("Membuka gerbang pembayaran...");

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.amount,
          customerName: user?.email?.split('@')[0],
          customerEmail: user?.email,
        }),
      });

      const data = await response.json();
      toast.dismiss();

      if (data.token) {
        (window as any).snap.pay(data.token, {
          onSuccess: () => {
            toast.success("Pembayaran Berhasil!");
            fetchBookings(user!.id);
          },
          onPending: () => toast.success("Menunggu pembayaran Anda..."),
          onError: () => toast.error("Pembayaran gagal."),
        });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Gagal menghubungkan ke sistem pembayaran.");
    }
  };

  const submitRating = async (bookingId: string, stars: number) => {
    const { error } = await supabase.from('bookings').update({ rating: stars }).eq('id', bookingId);
    if (!error) {
      toast.success("Terima kasih atas penilaian Anda!");
      setRatingModal({ isOpen: false, bookingId: null });
      fetchBookings(user!.id);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const stats = {
    total: bookings.length,
    approved: bookings.filter(b => b.status === 'Disetujui').length,
    pending: bookings.filter(b => b.status === 'Pending' || !b.status).length
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 transition-colors duration-300">
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userId={user?.id}
        onSuccess={() => fetchBookings(user!.id)}
      />

      {/* Modal Rating */}
      {ratingModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl border dark:border-slate-800">
            <h3 className="text-xl font-black mb-4 text-slate-900 dark:text-white">Beri Penilaian</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Bagaimana kualitas layanan konsultasi kami?</p>
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => submitRating(ratingModal.bookingId!, star)} className="hover:scale-110 transition">
                  <Star size={32} className="text-yellow-400 fill-current" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => setRatingModal({ isOpen: false, bookingId: null })}
              className="w-full py-2 text-slate-500 font-medium"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <motion.div 
            initial={{ x: -20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4 mb-1"
          >
            <div className="p-3 bg-blue-900 rounded-2xl text-white shadow-lg">
              <Shield size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Dashboard <span className="text-blue-700 dark:text-blue-400">Klien</span>
            </h1>
          </motion.div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Selamat datang kembali, <span className="text-slate-900 dark:text-white font-bold">{user?.email?.split('@')[0]}</span></p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ThemeToggle />
          <button 
            onClick={handleLogout} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-red-600 px-5 py-3 rounded-2xl font-bold shadow-sm border border-red-50 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
          >
            <LogOut size={18} /> <span className="md:hidden lg:inline">Logout</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} /> Booking Baru
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10"
      >
        {[
          { label: 'Total Booking', val: stats.total, icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Disetujui', val: stats.approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Menunggu', val: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}><stat.icon size={24} /></div>
            <div>
              <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.val}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Section */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden self-start"
        >
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <Briefcase className="text-blue-700" size={20} />
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Riwayat Konsultasi</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-4">Layanan</th>
                  <th className="px-8 py-4">Jadwal</th>
                  <th className="px-8 py-4">Status & Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight mb-1">{booking.service}</p>
                        <p className="text-xs text-slate-400 italic max-w-[200px] truncate">{booking.message || "No description"}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Calendar size={14} className="text-blue-600" />
                          <span className="text-sm font-bold">{new Date(booking.appointment_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              booking.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 
                              booking.status === 'Disetujui' ? 'bg-blue-100 text-blue-700' : 
                              booking.status === 'Dibatalkan' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {booking.status || 'Pending'}
                            </span>
                            
                            {booking.payment_status === 'Paid' && (
                              <span className="bg-green-500 text-white p-1 rounded-full"><CheckCircle size={10} /></span>
                            )}
                          </div>
                          
                          {/* Tombol Aksi */}
                          <div className="flex gap-2">
                            {booking.status === 'Disetujui' && booking.payment_status !== 'Paid' && (
                              <button 
                                onClick={() => handlePayment(booking)}
                                className="flex items-center gap-2 text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none"
                              >
                                <CreditCard size={12} /> 
                                {booking.amount ? `BAYAR Rp ${booking.amount.toLocaleString()}` : "MENUNGGU BIAYA"}
                              </button>
                            )}

                            {booking.status === 'Selesai' && !booking.rating && (
                              <button 
                                onClick={() => setRatingModal({ isOpen: true, bookingId: booking.id })}
                                className="flex items-center gap-2 text-[10px] bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-xl font-black hover:bg-yellow-500 transition shadow-lg shadow-yellow-100 dark:shadow-none"
                              >
                                <Star size={12} /> BERI RATING
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic">
                      Belum ada riwayat konsultasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Chat Section */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-[600px] overflow-hidden"
        >
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                <UserIcon size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Asisten Hukum</h2>
                <p className="text-[11px] text-green-500 font-medium mt-1">Online</p>
              </div>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/30 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                  msg.sender_id === user?.id 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isAdminTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full text-[11px] text-slate-400 italic shadow-sm border border-slate-100 dark:border-slate-700">
                  Admin sedang mengetik...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-6 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={handleTyping}
              onFocus={markAsRead}
              placeholder="Ketik pesan..."
              className="flex-1 px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition-all dark:text-white"
            />
            <button type="submit" className="bg-blue-600 text-white p-3.5 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-90">
              <Send size={20} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
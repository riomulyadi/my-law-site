"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, ShieldCheck, Gavel, Calendar, MessageSquare, Phone, Quote, ChevronDown, ChevronUp, X, LogIn, User as UserIcon, Briefcase, Handshake, BookOpen, Lightbulb, Award, Users, Globe, Mail, MapPin, CheckCircle, Menu } from 'lucide-react';
import { useAuth } from './AuthSessionProvider';
import { supabase } from './supabaseClient';
import { ThemeToggle } from './ThemeToggle';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// --- DATA ---
const testimonials = [
  {
    name: "Budi Santoso",
    role: "Pengusaha",
    text: "Sangat profesional. Masalah sengketa bisnis saya selesai lebih cepat dari perkiraan dengan hasil yang memuaskan."
  },
  {
    name: "Siti Aminah",
    role: "Ibu Rumah Tangga",
    text: "Penjelasan hukumnya sangat mudah dimengerti bagi orang awam seperti saya. Sangat membantu dalam urusan warisan."
  },
  {
    name: "Andi Wijaya",
    role: "Klien Pidana",
    text: "Pendampingan yang luar biasa. Saya merasa tenang karena hak-hak saya benar-benar diperjuangkan di pengadilan."
  }
];

const faqs = [
  {
    question: "Berapa biaya konsultasi awal?",
    answer: "Biaya konsultasi awal bervariasi tergantung durasi dan kerumitan kasus. Anda bisa melihat detail harga saat memilih layanan di menu booking."
  },
  {
    question: "Apakah konsultasi bisa dilakukan secara online?",
    answer: "Ya, kami menyediakan layanan konsultasi via Zoom atau WhatsApp Video Call untuk klien yang berada di luar kota."
  },
  {
    question: "Dokumen apa saja yang perlu saya bawa?",
    answer: "Tergantung kasus Anda. Umumnya kartu identitas (KTP) dan dokumen kontrak atau bukti-bukti terkait masalah hukum yang sedang dihadapi."
  }
];

const services = [
  {
    icon: Gavel,
    title: "Hukum Pidana",
    description: "Pendampingan hukum untuk kasus pidana, mulai dari penyelidikan hingga persidangan."
  },
  {
    icon: Scale,
    title: "Hukum Perdata",
    description: "Penanganan sengketa perdata seperti warisan, kontrak, dan perceraian."
  },
  {
    icon: Briefcase,
    title: "Hukum Korporasi",
    description: "Konsultasi dan pendampingan untuk masalah hukum bisnis dan perusahaan."
  },
  {
    icon: Handshake,
    title: "Mediasi & Arbitrase",
    description: "Penyelesaian sengketa di luar pengadilan melalui mediasi dan arbitrase."
  },
  {
    icon: BookOpen,
    title: "Hukum Keluarga",
    description: "Bantuan hukum untuk masalah keluarga seperti perceraian, hak asuh anak, dan harta gono-gini."
  },
  {
    icon: Lightbulb,
    title: "Konsultasi Umum",
    description: "Sesi konsultasi untuk memahami hak dan kewajiban hukum Anda dalam berbagai situasi."
  },
];

const features = [
  { icon: Award, title: "Pengacara Berpengalaman", description: "Tim kami terdiri dari pengacara dengan rekam jejak sukses." },
  { icon: Users, title: "Pendekatan Personal", description: "Setiap kasus ditangani dengan perhatian penuh dan strategi khusus." },
  { icon: ShieldCheck, title: "Integritas & Kerahasiaan", description: "Menjaga kepercayaan klien dengan profesionalisme tinggi." },
];

const statsData = [
  { icon: CheckCircle, value: "500+", label: "Kasus Selesai" },
  { icon: Users, value: "98%", label: "Kepuasan Klien" },
  { icon: Award, value: "15+", label: "Tahun Pengalaman" },
  { icon: Scale, value: "24/7", label: "Dukungan Hukum" },
];

const lawyers = [
  {
    name: "Drs. Ahmad Junaidi, S.H., M.H.",
    role: "Senior Partner",
    specialty: "Hukum Pidana & Perdata",
    bio: "Berpengalaman lebih dari 20 tahun dalam menangani kasus sengketa besar di tingkat nasional.",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=2070&auto=format&fit=crop"
  },
  {
    name: "Sarah Wijaya, S.H., LL.M.",
    role: "Managing Partner",
    specialty: "Hukum Korporasi",
    bio: "Spesialis dalam hukum bisnis dan merger akuisisi perusahaan multinasional.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
  },
  {
    name: "Bambang Heru, S.H.",
    role: "Associate Lawyer",
    specialty: "Hukum Keluarga",
    bio: "Berdedikasi membantu klien menyelesaikan masalah hukum keluarga dengan pendekatan humanis.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop"
  }
];

// --- VARIAN ANIMASI ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Jeda antar kartu
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

// --- KOMPONEN KECIL ---
const TestimonialCard = ({ name, role, text }: { name: string, role: string, text: string }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-slate-900">
    <Quote className="text-blue-900 w-8 h-8 mb-4 opacity-20" />
    <p className="text-slate-600 italic mb-6">"{text}"</p>
    <div className="border-t pt-4">
      <p className="font-bold text-slate-800">{name}</p>
      <p className="text-sm text-slate-500">{role}</p>
    </div>
  </div>
);

const AccordionItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 py-4">
      <button 
        className="w-full flex justify-between items-center text-left font-semibold text-lg text-slate-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        {isOpen ? <ChevronUp className="text-blue-900" /> : <ChevronDown className="text-slate-400" />}
      </button>
      {isOpen && <p className="mt-3 text-slate-600 leading-relaxed">{answer}</p>}
    </div>
  );
};

// --- KOMPONEN MODAL BOOKING ---
const BookingModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Hukum Perdata");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mengirim data ke tabel 'bookings' di Supabase
    const { error } = await supabase
      .from('bookings')
      .insert([{ 
        user_id: session?.user?.id,
        name, 
        phone,
        service, 
        appointment_date: date, 
        message,
        status: 'Pending'
      }]);

    setLoading(false);

    if (error) {
      alert("Gagal menyimpan data: " + error.message);
    } else {
      alert("Booking Berhasil! Kami akan menghubungi Anda segera.");
      setName("");
      setPhone("");
      setDate("");
      setMessage("");
      setService("Hukum Perdata");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Formulir Konsultasi</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input 
              required 
              type="text" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="Masukkan nama Anda" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp / Telepon</label>
            <input 
              required 
              type="tel" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="Contoh: 08123456789" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Layanan</label>
            <select 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option>Hukum Perdata</option>
              <option>Hukum Pidana</option>
              <option>Konsultasi Korporasi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Rencana</label>
            <input 
              required 
              type="date" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alasan / Detail Masalah</label>
            <textarea 
              required 
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none resize-none" 
              placeholder="Ceritakan singkat alasan Anda memerlukan jasa hukum..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:bg-slate-400"
          >
            {loading ? "Mengirim..." : "Kirim Jadwal"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA ---
export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  // Monitor scroll untuk menampilkan tombol Back to Top
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fungsi pelindung untuk mengecek login sebelum buka modal
  const handleBookingClick = () => {
    if (!session) {
      alert("Silakan login terlebih dahulu untuk menjadwalkan konsultasi.");
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  // Fungsi untuk WhatsApp (Ganti nomor 62812... dengan nomor asli pengacara)
  const openWhatsApp = () => {
    const phoneNumber = "628123456789"; 
    const message = encodeURIComponent("Halo Admin LawOffice, saya ingin berkonsultasi mengenai masalah hukum saya.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  // Fungsi untuk scroll ke atas
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300 selection:bg-blue-100 selection:text-blue-900">
      {/* Modal Booking */}
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* 1. NAVIGATION BAR */}
      <nav className="flex justify-between items-center px-8 py-6 bg-white dark:bg-slate-900/80 dark:backdrop-blur-md shadow-sm border-b dark:border-slate-800 sticky top-0 z-50 transition-colors">
        {/* Logo - Sisi Kiri */}
        <Link href="/" className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 min-w-[200px]">
          <Scale className="text-blue-900" />
          <span>LawOffice<span className="text-blue-900 dark:text-blue-400">Advokat</span></span>
        </Link>

        {/* Menu Navigasi - Tengah */}
        <div className="hidden lg:flex gap-8 font-medium absolute left-1/2 -translate-x-1/2 text-sm">
          <a href="#layanan" className="hover:text-blue-900 dark:hover:text-blue-400 transition">Layanan</a>
          <a href="#tentang" className="hover:text-blue-900 dark:hover:text-blue-400 transition">Tentang</a>
          <a href="#tim" className="hover:text-blue-900 dark:hover:text-blue-400 transition">Tim</a>
          <a href="#testimoni" className="hover:text-blue-900 dark:hover:text-blue-400 transition">Testimoni</a>
          <a href="#faq" className="hover:text-blue-900 dark:hover:text-blue-400 transition">FAQ</a>
        </div>

        {/* Actions - Sisi Kanan */}
        <div className="hidden md:flex items-center gap-4 min-w-[200px] justify-end">
          {session ? (
            <a href="/dashboard" className="text-blue-900 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline">
              <UserIcon size={18} /> Dashboard
            </a>
          ) : (
            <Link href="/login" className="text-blue-900 dark:text-blue-400 font-bold hover:underline flex items-center gap-2 text-sm">
               <LogIn size={18} /> Login / Daftar
            </Link>
          )}
          <ThemeToggle />
          <button 
            onClick={handleBookingClick} // Menggunakan handleBookingClick untuk validasi login
            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-800 transition-all active:scale-95 shadow-lg shadow-blue-200 text-sm"
          >Jadwalkan Konsultasi</button>
        </div>

        {/* Hamburger Mobile */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 dark:text-white">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[81px] bg-white dark:bg-slate-900 z-[49] border-b dark:border-slate-800 shadow-xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4 font-bold text-slate-800 dark:text-slate-200">
              <a href="#layanan" onClick={() => setIsMenuOpen(false)} className="py-2 border-b dark:border-slate-800">Layanan</a>
              <a href="#tentang" onClick={() => setIsMenuOpen(false)} className="py-2 border-b dark:border-slate-800">Tentang Kami</a>
              <a href="#tim" onClick={() => setIsMenuOpen(false)} className="py-2 border-b dark:border-slate-800">Tim Pengacara</a>
              <a href="#testimoni" onClick={() => setIsMenuOpen(false)} className="py-2 border-b dark:border-slate-800">Testimoni</a>
              <a href="#faq" onClick={() => setIsMenuOpen(false)} className="py-2 border-b dark:border-slate-800">FAQ</a>
              
              <div className="pt-4 flex flex-col gap-4">
                {session ? (
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <UserIcon size={20} /> Ke Dashboard
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <LogIn size={20} /> Login / Daftar Akun
                  </Link>
                )}
                <button 
                  onClick={() => { setIsMenuOpen(false); handleBookingClick(); }}
                  className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200"
                >
                  Jadwalkan Konsultasi
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION */}
      <header 
        className="relative min-h-[85vh] flex items-center justify-center bg-cover bg-fixed bg-center px-8 text-center text-white"
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6)), url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <span className="bg-blue-500/20 backdrop-blur-md text-blue-300 text-xs font-bold px-4 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span> Pengacara Sedang Online
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
            Keadilan & Kepastian Hukum <br className="hidden md:inline"/> Untuk Masa Depan Anda
          </h1>
          <p className="text-slate-200 max-w-2xl mx-auto mb-10 text-lg md:text-xl leading-relaxed drop-shadow">
            Konsultasikan masalah hukum Anda dengan tim pengacara berpengalaman. Kami siap memberikan solusi terbaik dengan pendekatan profesional dan transparan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={handleBookingClick}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-2xl shadow-blue-600/40"
            >
              Mulai Konsultasi Sekarang
            </button>
            <button 
              onClick={openWhatsApp}
              className="bg-white text-blue-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-slate-500/10"
            >
              <Phone className="inline-block mr-2" size={20} /> Hubungi via WhatsApp
            </button>
          </div>
        </div>
      </header>

      {/* 3. OUR SERVICES SECTION */}
      <section id="layanan" className="py-24 px-8 bg-slate-50 dark:bg-slate-900/50 scroll-mt-24">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Layanan Hukum Kami</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-3xl mx-auto mb-16">
            Kami menyediakan berbagai layanan hukum yang komprehensif untuk memenuhi kebutuhan Anda.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300 group">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <service.icon size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US SECTION */}
      <section id="tentang" className="py-24 px-8 bg-white dark:bg-slate-950 relative overflow-hidden scroll-mt-24">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Mengapa Memilih Kami?</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-3xl mx-auto mb-16">
            Komitmen kami adalah memberikan pelayanan hukum terbaik dengan integritas dan profesionalisme.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-slate-50 p-8 rounded-2xl shadow-md border border-slate-100 flex flex-col items-center text-center">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full w-fit mb-6">
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5 STATISTIK SECTION */}
      <section className="py-20 bg-blue-900 dark:bg-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-6xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {statsData.map((stat, index) => (
              <div key={index} className="flex flex-col items-center group">
                <div className="mb-4 text-blue-300 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon size={48} />
                </div>
                <div className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">{stat.value}</div>
                <div className="text-blue-100 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.6 OUR TEAM SECTION */}
      <section id="tim" className="py-24 px-8 bg-white dark:bg-slate-950 scroll-mt-24">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Tim Pengacara Kami</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-3xl mx-auto mb-16">
            Kenali para profesional hukum kami yang berdedikasi untuk memperjuangkan hak-hak Anda.
          </p>
          <motion.div 
            className="grid md:grid-cols-3 gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {lawyers.map((lawyer, index) => (
              <motion.div key={index} className="group" variants={itemVariants}>
                <div className="relative mb-6 overflow-hidden rounded-3xl aspect-[3/4] shadow-lg">
                  <img 
                    src={lawyer.image} 
                    alt={lawyer.name}
                    className="object-cover w-full h-full grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  {/* Overlay Bio saat Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-sm leading-relaxed italic">"{lawyer.bio}"</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{lawyer.name}</h3>
                <p className="text-blue-700 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-3">{lawyer.role}</p>
                <div className="inline-block px-4 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                  Bidang: {lawyer.specialty}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. TESTIMONIALS SECTION */}
      <section id="testimoni" className="py-20 px-8 bg-slate-50 scroll-mt-24">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Apa Kata Klien Kami</h2>
          <p className="text-slate-600 text-lg max-w-3xl mx-auto mb-12">
            Dengarkan pengalaman mereka yang telah merasakan langsung layanan hukum kami.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg text-slate-900 flex flex-col h-full">
                <Quote className="text-blue-700 w-10 h-10 mb-4 opacity-30" />
                <p className="text-slate-700 italic mb-6 flex-grow">"{item.text}"</p>
                <div className="border-t border-slate-100 pt-4 mt-auto">
                  <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-20 px-8 bg-white scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900">Pertanyaan Umum</h2>
            <p className="text-slate-600 text-lg mt-2">Temukan jawaban atas pertanyaan yang sering diajukan.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((item, index) => (
              <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm">
                <AccordionItem question={item.question} answer={item.answer} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section id="booking" className="bg-blue-800 py-20 px-8 text-white text-center">
        <h2 className="text-4xl font-extrabold mb-6 leading-tight">Siap Menyelesaikan Masalah Hukum Anda?</h2>
        <p className="text-blue-100 text-lg max-w-3xl mx-auto mb-10">
          Jangan biarkan masalah hukum menghambat Anda. Hubungi kami sekarang untuk konsultasi awal gratis!
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-5">
          <button 
            onClick={handleBookingClick} // Menggunakan handleBookingClick untuk validasi login
            className="bg-white text-blue-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            <Calendar size={20} /> Jadwalkan Konsultasi
          </button>
          <button 
            onClick={openWhatsApp}
            className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all active:scale-95 shadow-xl shadow-green-500/30 flex items-center justify-center gap-2"
          >
            <Phone size={20} /> Hubungi via WhatsApp
          </button>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <Scale className="text-blue-500" />
              <span>LawOffice<span className="text-blue-500">Advokat</span></span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Kami berkomitmen untuk memberikan layanan hukum terbaik dengan integritas dan profesionalisme tinggi.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-slate-400 hover:text-blue-500 transition"><Globe size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-blue-500 transition"><Mail size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Layanan</h3>
            <ul className="space-y-2">
              {services.map((service, index) => (
                <li key={index}><a href="#" className="text-slate-400 hover:text-blue-500 transition">{service.title}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Kontak Kami</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-slate-400"><MapPin size={18} /> Jl. Contoh No. 123, Jakarta</li>
              <li className="flex items-center gap-2 text-slate-400"><Phone size={18} /> (021) 1234567</li>
              <li className="flex items-center gap-2 text-slate-400"><Mail size={18} /> info@lawoffice.com</li>
              <li className="flex items-center gap-2 text-slate-400"><Globe size={18} /> www.lawoffice.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-10 pt-8 text-center text-slate-500 text-sm">
          © 2024 LawOffice. Semua hak dilindungi.
        </div>
      </footer>

      {/* Tombol Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 bg-blue-900 dark:bg-blue-700 text-white p-3 rounded-full shadow-2xl hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors focus:ring-4 focus:ring-blue-300 outline-none"
            aria-label="Kembali ke atas"
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

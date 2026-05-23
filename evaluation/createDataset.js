import { ChatOpenRouter } from "@langchain/openrouter";
import { Client } from "langsmith";
import 'dotenv/config';

const client = new Client();

const dataset = await client.createDataset(
    "UAJM Chatbot Evaluation",
    { description: "A dataset for evaluating the UAJM Chatbot." }
);

const inputs = [
     {
        question: "permisi, kak. saya mau nanya, apa saja dokumen yang diperlukan untuk mendaftar melalui jalur prestasi?",
        tag: "Prosedur dan Syarat Pendaftaran"
    },
    {
        question: "permisi, kak. Bagaimana cara mendaftar secara online?",
        tag: "Prosedur dan Syarat Pendaftaran"
    },
    {
        question: "kapan pendaftaran mahasiswa baru dibuka?",
        tag: "Jadwal Pendaftaran dan Seleksi PMB"
    },
    {
        question: "kapan pendaftaran mahasiswa baru ditutup?",
        tag: "Jadwal Pendaftaran dan Seleksi PMB",
    },
    {
        question: "kapan universitas atma jaya makassar didirikan?",
        tag: "Profil Universitas dan Program Studi ",
    },
    {
        question: "apa visi dan misi dari universitas atma jaya?",
        tag: "Profil Universitas dan Program Studi ",
    },
    {
        question: "dimana alamat universitas atma jaya?",
        tag: "Profil Universitas dan Program Studi ",
    },
    {
        question: "berikan saya informasi mengenai fakultas teknologi informasi",
        tag: "Profil Universitas dan Program Studi ",
    },
    {
        question: "apa itu fakultas teknologi informasi?",
        tag: "Profil Universitas dan Program Studi ",
    },
    {
        question: "apa saja fakultas yang tersedia di universitas atma jaya makassar?",
        tag: "Profil Universitas dan Program Studi ",
    },
    {
        question: "kapan jadwal kuliah dimulai?",
        tag: "Layanan Akademik dan Administrasi Mahasiswa Aktif",
    },
    {
        question: "kapan ujian akhir semester dimulai?",
        tag: "Layanan Akademik dan Administrasi Mahasiswa Aktif",
    },
    {
        question: "kapan ujian tengah semester dimulai?",
        tag: "Layanan Akademik dan Administrasi Mahasiswa Aktif",
    },
    {
        question: "apa apa saja hari libur di semester ini?",
        tag: "Layanan Akademik dan Administrasi Mahasiswa Aktif",
    },
    {
        question: "bagaimana cara mengisi kartu rencana studi?",
        tag: "Pengisian Kartu Rencana Studi (KRS)",
    },
    {
        question: "bagaimana cara membayar kartu rencana studi?",
        tag: "Pengisian Kartu Rencana Studi (KRS)",
    },
    {
        question: "kapan jadwal dan pendaftaran wisuda?",
        tag: "Layanan Akademik dan Administrasi Mahasiswa Aktif",
    },
    {
        question: "berapa jumlah sks yang diperlukan untuk dapat mengajukan tugas akhir?",
        tag: "Tugas Akhir dan Skripsi",
    },
    {
        question: "berapa biaya uang pangkal?",
        tag: "Informasi Biaya Studi",
    },
    {
        question: "berikan saya rincian biaya perkulihaan",
        tag: "Biaya Kuliah (UKT)",
    },
    {
        question: "berapa biaya per semester?",
        tag: "Biaya Kuliah (UKT)",
    },
    {
        question: "kapan tanggal pembayaran uang kuliah?",
        tag: "Kalender dan Administrasi",
    },
    {
        question: "apa langkah langkah untuk mendaftar seminar hasil pada program studi teknik informatika?",
        tag: "Tugas Akhir dan Skripsi",
    },
    {
        question: "apa langkah langkah untuk mendaftar ujian meja pada program studi teknik informatika?",
        tag: "Tugas Akhir dan Skripsi",
    },
    {
        question: "apa langkah langkah untuk mendaftar seminar proposal?",
        tag: "Tugas Akhir dan Skripsi",
    },
    {
        question: "apa saja beasiswa yang tersedia di universitas atma jaya makassar?",
        tag: "Fasilitas dan Layanan",
    },
    {
        question: "apa saja program studi yang ada di fakultas hukum?",
        tag: "Fakultas dan Program Studi",
    },
    {
        question: "apa saja program studi yang ada di fakultas Ekonomi dan Bisnis?",
        tag: "Fakultas dan Program Studi",
    },
    {
        question: "apa saja program studi yang ada di fakultas Teknik?",
        tag: "Fakultas dan Program Studi",
    },
    {
        question: "apa saja program studi yang ada di Teknologi Informasi?",
        tag: "Fakultas dan Program Studi",
    },
    {
        question: "apa saja program studi yang ada di psikologi?",
        tag: "Fakultas dan Program Studi",
    },
];


await client.createExamples({
    datasetId: dataset.id,
    inputs,
});

console.log("Created dataset:", dataset.name);
import { ChatOpenRouter } from "@langchain/openrouter";
import { Client } from "langsmith";
import 'dotenv/config';

const client = new Client();

const dataset = await client.createDataset(
    "UAJM Chatbot Evaluation",
    { description: "A dataset for evaluating the UAJM Chatbot." }
);

const inputs = [
    // {
    //     question: "permisi, kak. saya mau nanya, apa saja dokumen yang diperlukan untuk mendaftar melalui jalur prestasi?",
    // },
    // {
    //     question: "permisi, kak. Bagaimana cara mendaftar secara online?",
    // },
    // {
    //     question: "kapan pendaftaran mahasiswa baru dibuka?",
    // },
    // {
    //     question: "kapan pendaftaran mahasiswa baru ditutup?",
    // },
    // {
    //     question: "kapan universitas atma jaya makassar didirikan?",
    // },
    // {
    //     question: "apa visi dan misi dari universitas atma jaya?",
    // },
    // {
    //     question: "dimana alamat universitas atma jaya?",
    // },
    // {
    //     question: "berikan saya informasi mengenai fakultas teknologi informasi",
    // },
    // {
    //     question: "apa itu fakultas teknologi informasi?",
    // },
    // {
    //     question: "apa saja fakultas yang tersedia di universitas atma jaya makassar?",
    // },
    // {
    //     question: "kapan jadwal kuliah dimulai?",
    // },
    // {
    //     question: "kapan ujian akhir semester dimulai?",
    // },
    // {
    //     question: "kapan ujian tengah semester dimulai?",
    // },
    // {
    //     question: "apa apa saja hari libur di semester ini?",
    // },
    {
        question: "bagaimana cara mengisi kartu rencana studi?",
    },
    {
        question: "bagaimana cara membayar kartu rencana studi?",
    },
    {
        question: "bagaimana prosedur pengajuan cuti akademik dan syarat untuk aktif kembali?",
    },
    // {
    //     question: "bagaimana prosedur pengajuan cuti akademik?",
    // },
    // {
    //     question: "kapan jadwal dan pendaftaran wisuda?",
    // },
    {
        question: "berapa minimal jumlah sks yang diperlukan untuk dapat mengajukan tugas akhir?",
    },
    // {
    //     question: "berapa biaya uang pangkal?",
    // },
    // {
    //     question: "berapa biaya uang kuliah per semester?",
    // },
];

console.log(inputs.length);

await client.createExamples({
    datasetId: dataset.id,
    inputs,
});

console.log("Created dataset:", dataset.name);
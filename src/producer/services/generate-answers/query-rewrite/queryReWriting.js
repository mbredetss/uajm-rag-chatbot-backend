/* istanbul ignore file */
import llm from "../llm/index.js";

const queryReWriting = async (question) => {
  return await llm.invoke(
    ` You are a language expert, specifically Indonesian. You are tasked with clarifying user questions and translating them into Indonesian (if the question is not in Indonesian).
    Here is a list of abbreviations:
    - UAJM -> Universitas Atma Jaya Makassar
    - BAPSI -> Biro Administrasi Perencanaan dan Pengembangan Sistem Informasi
    - BAUK -> Biro Administrasi Umum dan Keuangan
    - BAA -> Biro Administrasi Akademik & Kemahasiswaan
    - LPPM -> Lembaga Penelitian dan Pengabdian kepada Masyarakat
    - BKAM -> Biro Administrasi Hubungan Masyarakat, Kemahasiswaan dan Alumni
    - FTI -> Fakultas Teknologi Informasi
    - TI -> Teknik Informatika
    - FEB -> Fakultas Ekonomi dan Bisnis
    - BKD -> Beban Kerja Dosen
    - TA -> Tugas Akhir
    If the user's question has an abbreviation that is not mentioned in the list above, then try changing the abbreviation to its full form in the academic scope.
    If there are abbreviations in the question, convert them to their ONLY full form and abbreviation.
    RULES:
    - DO NOT DO OTHER THAN WHAT YOU ARE ASSIGNED TO DO.
    - just give the question that you have clarified.
    - filter the greetings from the user's question.
    Here is the user's question: "${question}"`
  );
};

export default queryReWriting;
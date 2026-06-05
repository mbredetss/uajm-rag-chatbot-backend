import path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import pool from '../producer/utils/database.js';
import * as fs from "fs";

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-3-flash-preview',
});

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  model: 'LazarusNLP/all-indo-e5-small-v4',
  provider: "hf-inference",
});

const getVectorStore = async () => {
  return await PGVectorStore.initialize(embeddings, {
    pool,
    tableName: 'langchain_pg_embedding',
    collectionTableName: 'langchain_pg_collection',
    collectionName: 'uajm_documents',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
    },
  });
};

const vectorStore = await getVectorStore();

const loadDocument = async (source, type) => {
  if (type === 'url') {
    const loader = new CheerioWebBaseLoader(source, {
      selector: 'p, ol, h1, h2, h3, h4, h5, h6',
    });
    return await loader.load();
  }

  const ext = path.extname(source).toLowerCase();

  if (ext === '.pdf') {
    const loader = new PDFLoader(source, { splitPages: false });
    return await loader.load();
  }

  if (ext === '.csv') {
    const loader = new TextLoader(source);
    return await loader.load();
  }

  if (ext === '.docx') {
    const loader = new DocxLoader(source);
    return await loader.load();
  }

  if (ext === '.jpg' || ext === '.png' || ext === '.jpeg' || ext === '.webp') {
    const imageBase64 = fs.readFileSync(source, { encoding: "base64" });

    const prompt = `
    You are an AI assistant that analyzes document images.
    You are tasked with extracting information from images.
    The information you extract from the images will be fed into my knowledge base for the chatbot I am currently designing. If the image is a document, remove any unnecessary information and only extract the essential information.
    Here is a list of abbreviations may will appear in the documents:
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
    If the documents has an abbreviation that is not mentioned in the list above, then try changing the abbreviation to its full form in the academic scope.
    Provide it in Indonesian and in paragraph format.
    `;

    const message = new HumanMessage({
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: `data:image/${ext.slice(1)};base64,${imageBase64}`,
        }
      ],
    });

    const response = await model.invoke([message]);

    return [
      {
        pageContent: response.content,
        metadata: {
          source,
        },
      }
    ];
  }

  throw new Error(`Format dokumen tidak didukung: ${ext}`);
};

const updateDocumentStatus = async (documentId, status) => {
  await pool.query(
    'UPDATE documents SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, documentId],
  );
};

const docsCleaning = (docs) => {
  return docs.map(doc => ({
    ...doc, 
    pageContent: doc.pageContent.replace(/[\n\r\t]/g, ' '),
  }));
};

const extractDesiredInformation = async (docs, desiredInformation) => {
  const prompt = `
    You are an AI assistant that extracts information from documents.
    You are tasked with extracting information from documents based on the desired information.
    The results of your extraction will be entered into the knowledge base for my RAG chatbot. This is to ensure the knowledge base is of high quality (containing only the desired information).
    Therefore, do not extract any information other than the desired information. Make in Indonesian.
    Here is the desired information: "${desiredInformation}"
    Here is the document: "${docs[0].pageContent}"
    `;

  const message = new HumanMessage({
    content: [
      { type: "text", text: prompt },
    ],
  });

  const response = await model.invoke([message]);

  return [
    {
      ...docs[0],
      pageContent: response.content,
    }
  ];
}

const processIndexing = async ({ desiredInformation, source, type, documentId }) => {
  try {
    let docs = await loadDocument(source, type);
    if (desiredInformation) {
      docs = await extractDesiredInformation(docs, desiredInformation);
    }
    const cleanDocs = docsCleaning(docs);
    await vectorStore.addDocuments(cleanDocs);
    await updateDocumentStatus(documentId, 'completed');
    console.log(`Indexing selesai untuk dokumen ${documentId}`);
  } catch (error) {
    console.error(`Indexing gagal untuk dokumen ${documentId}:`, error);
    await updateDocumentStatus(documentId, 'failed');
  }
};

export { processIndexing, getVectorStore };
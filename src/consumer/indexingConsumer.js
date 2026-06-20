import path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { HumanMessage } from '@langchain/core/messages';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ParentDocumentRetriever } from "@langchain/classic/retrievers/parent_document";
import vectorStore from '../producer/utils/vectorStore.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import pool from '../producer/utils/database.js';
import * as fs from "fs";
import { traceable } from "langsmith/traceable";
import docStore from '../producer/services/generate-answers/doc-store/docStore.js'

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-3-flash-preview',
});

const _loadDocument = async (source, type) => {
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

const loadDocument = traceable(
  _loadDocument,
  {
    name: "loadDocument",
    run_type: "chain",
    tags: ["indexing", "document-loading"],
    metadata: { project: "uajm-rag-chatbot" },
  }
);

const updateDocumentStatus = async (documentId, status, errorMessage, content) => {
  await pool.query(
    'UPDATE documents SET status = $1, updated_at = NOW(), error_message = $2, content = $3 WHERE id = $4',
    [status, errorMessage, content, documentId],
  );
};

const embeddingDocs = async (parentConfig, childConfig, docs) => {
  const parentSplitter = parentConfig
    ? new RecursiveCharacterTextSplitter({
      chunkSize: parentConfig.chunkSize,
      chunkOverlap: parentConfig.chunkOverlap,
    })
    : undefined;
  const childSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: childConfig.chunkSize,
    chunkOverlap: childConfig.chunkOverlap,
  });
  const retriever = new ParentDocumentRetriever({
    vectorstore: vectorStore,
    docstore: docStore,
    parentSplitter,
    childSplitter,
  });

  await retriever.addDocuments(docs);
}

const processIndexing = async ({ source, type, documentId, isLongDocument }) => {
  try {
    let docs = await loadDocument(source, type);
    // inject createdAt Metadata
    docs = docs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        createdAt: new Date().toISOString(),
      },
    }));

    const childSplitter = {
      chunkSize: 300,
      chunkOverlap: 60,
    };

    if (isLongDocument) {
      // parent = dokumen utuh (tanpa splitting)
      await embeddingDocs(null, childSplitter, docs);
    } else {
      const parentSplitter = {
        chunkSize: 1100,
        chunkOverlap: 220,
      }

      await embeddingDocs(parentSplitter, childSplitter, docs);
    }

    const documents = docs.map(doc => doc.pageContent).join('\n\n');
    await updateDocumentStatus(documentId, 'completed', null, documents);

    console.log(`Indexing selesai untuk dokumen ${documentId}`);
  } catch (error) {
    console.error(`Indexing gagal untuk dokumen ${documentId}:`, error);
    await updateDocumentStatus(documentId, 'failed', error.message, null);
  }
};

export default processIndexing;
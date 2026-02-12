## AeroTech Agentic Hub

Bu proje, uçak bakım operasyonlarını yapay zeka ajanları (multi‑agent) ile destekleyen, Yönetim Bilişim Sistemleri (YBS) perspektifini ve havacılık standartlarını birleştiren bir **Karar Destek Sistemi (DSS)** prototipidir.

Amaç: Mülakatta “çalışan, gerçekçi ama hafif” bir demo sunabilmek.

---

## 1. Yüksek Seviye Mimari

- **Backend**
  - `FastAPI` tabanlı REST API
  - `LangChain` ile çoklu ajan (multi‑agent) orkestrasyonu
  - RAG (Retrieval-Augmented Generation) ile AMM benzeri dokümanlardan bilgi çekme
  - Basit veri katmanı (JSON/SQLite) ile personel, parça, tool verisi
- **Agent Yapısı**
  - **Search & RAG Agent**: AMM / teknik doküman + web search (Tavily/Serper) ile teknik analiz.
  - **Work Package Planner Agent**: İş paketi (work package) ve yüksek seviye bakım adımlarını üretir.
  - **Resource & Compliance Agent**: Personel, tool, parça ve basit Part‑145 kurallarını kontrol eder.
  - **Q&A Assistant Agent**: Genel sorular için sohbet tabanlı bakım/havacılık Q&A asistanı.
- **Frontend (AeroTech Intelligence UI)**
  - React + Vite + Tailwind CSS, THY Kırmızısı (#C8102E), Dark Mode
  - Sidebar: Bakım Planlama, Kaynak & Ekipman, İş Paketleri, Verimlilik Analizi
  - Akıllı sohbet + AMM/EASA/FAA referans kartları, YBS & Scrum Dashboard
- **Deployment**
  - Railway üzerinde tek bir web servisi (`uvicorn` ile FastAPI)
  - Frontend ayrı servis veya API ile birlikte deploy edilebilir.

---

## 2. Proje Klasör Yapısı

```text
THY/
├─ app/
│  ├─ __init__.py
│  ├─ main.py              # FastAPI entrypoint (Railway burayı çalıştıracak)
│  ├─ agents.py            # LangChain ajan tanımları (Search, Planner, Resource, QA)
│  ├─ chains.py            # Orkestrasyon fonksiyonları (planlama pipeline'ı vb.)
│  ├─ setup.py             # Retriever, veri tabanı bağlantıları, tool factory fonksiyonları
│  └─ config.py            # Ortam değişkenleri ve sabit konfigürasyonlar (LLM, API keys vb.)
│
├─ data/
│  ├─ amm_sample.pdf       # Örnek AMM/teknik doküman
│  ├─ personnel.json       # Personel ve yetki (licence/rating) mock verisi
│  ├─ tools.json           # Tool & ekipman mock verisi
│  └─ parts.json           # Parça/envanter mock verisi (AikanStock deneyimiyle uyumlu)
│
├─ frontend/               # React + Vite UI (Tailwind, Shadcn-style)
├─ requirements.txt        # Python bağımlılıkları
├─ Procfile                # (Opsiyonel) Railway için process tanımı
└─ README.md               # Bu dosya (mimari + geliştirme planı)
```

---

## 3. Ajanların Rol Tanımları

- **Search & RAG Agent**
  - Girdi: Arıza açıklaması, bileşen/parça adı.
  - Araçlar:
    - Vektör veritabanı (Chroma/FAISS) ile AMM/teknik doküman araması.
    - Web search aracı (Tavily/Serper) ile güncel havacılık literatürü taraması.
  - Çıktı: Teknik bağlam, ilgili task referansları, kritik güvenlik notları.

- **Work Package Planner Agent**
  - Girdi: Arıza açıklaması + Search & RAG çıktısı (teknik bağlam).
  - Görev:
    - Bakım adımlarını (steps) mantıklı sırada çıkarma.
    - Her adım için tahmini süre ve sorumlu rol.
    - JSON formatında iş paketi taslağı (sprint backlog item'larına benzer).

- **Resource & Compliance Agent**
  - Girdi: İş paketi taslağı.
  - Araçlar:
    - Personel/tool/parça mock veritabanı (JSON/SQLite).
    - Basit Part‑145/organizasyon kural seti (ör. flight control için gerekli rating).
  - Çıktı: Uygun teknisyen listesi, gerekli tool & parça listesi, uyum (compliance) notları.

- **Q&A Assistant Agent**
  - Girdi: Serbest formda soru (havacılık bakımı, prosedürler, Part‑145 vb.).
  - Araçlar: Aynı RAG altyapısı + web search, `ConversationBufferMemory` ile çok turlu sohbet.
  - Çıktı: Açıklayıcı, kaynak gösteren yanıtlar (teknik kesinlik vurgulu).

---

## 4. API Tasarımı (FastAPI)

Planlanan temel endpoint’ler:

- `POST /plan`
  - Amaç: Verilen arıza açıklaması için uçtan uca planlama pipeline’ını çalıştırmak.
  - Request body:
    ```json
    {
      "fault_description": "A320 left elevator jammed on ground check"
    }
    ```
  - Response (özet):
    ```json
    {
      "tech_context": "...",        // Search & RAG Agent çıktısı
      "work_package": "...",        // Planner Agent çıktısı (JSON veya structured)
      "resource_plan": "..."        // Resource & Compliance Agent çıktısı
    }
    ```

- `POST /qa`
  - Amaç: Q&A Assistant üzerinden genel soru‑cevap.
  - Request body:
    ```json
    {
      "question": "A320 elevator trim sisteminin temel çalışma prensibi nedir?"
    }
    ```
  - Response:
    ```json
    {
      "answer": "..."
    }
    ```

---

## 5. Geliştirme Planı (Adım Adım)

### A. Altyapı ve Bağımlılıklar

- `requirements.txt` içine aşağıdaki çekirdek paketleri ekle:
  - `fastapi`, `uvicorn[standard]`
  - `langchain`, `langchain-openai` (veya seçtiğin LLM provider)
  - `chromadb` veya `faiss-cpu` (vektör veritabanı)
  - `pydantic`, `python-dotenv`
  - Web araması için: `tavily-python` veya `google-serper` SDK’sı

### B. Veri Katmanı ve RAG

- `data/amm_sample.pdf` için:
  - `app/setup.py` içinde loader + splitter + embedding + vector store initializasyonu yaz.
  - `get_retriever()` fonksiyonu ile RAG retriever nesnesini dışa aktar.
- `data/*.json` dosyaları:
  - Basit JSON tabanlı mock verilerle başla (personel, tools, parts).
  - İleride bunları SQLite/SQLAlchemy ile genişletebilirsin.

### C. Agent Tanımları (`app/agents.py`)

- Her ajan için ayrı bir factory fonksiyonu:
  - `create_search_rag_agent(retriever, web_search_tool)`
  - `create_work_package_planner_agent()`
  - `create_resource_compliance_agent(resource_tool)`
  - `create_qa_assistant_agent(retriever, web_search_tool)`
- `LangChain` agent/chain’lerini burada konfigüre et, `main.py` içinde bunları kullan.

### D. Orkestrasyon (`app/chains.py`)

- `run_planning_pipeline(...)` fonksiyonunu yaz:
  1. Search & RAG Agent ile teknik bağlamı üret.
  2. Planner Agent ile iş paketi JSON taslağı oluştur.
  3. Resource Agent ile personel/tool/parça planını çıkar.
  4. Üç çıktıyı tek bir response objesinde topla.

### E. FastAPI Uygulaması (`app/main.py`)

- Global olarak:
  - `retriever`, `web_search_tool`, `resource_tool` oluştur.
  - Agent’leri init et (search, planner, resource, qa).
- Endpoint’ler:
  - `/plan` → `run_planning_pipeline` çağırır.
  - `/qa` → `qa_agent.run(question)` çağırır.
- Swagger UI (otomatik) → Mülakatta direkt tarayıcıdan canlı demo yapabilirsin.

### F. Frontend (AeroTech Intelligence UI)

- `frontend/` klasöründe: `npm install && npm run dev`
- Tarayıcıda `http://localhost:5173` — Vite proxy `/api` → `localhost:8000`
- Backend ayrı terminalde: `uvicorn app.main:app --reload`

### G. Railway Deploy

- Root’ta:
  - `Procfile` → `web: uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Railway:
  - GitHub repo’yu bağla.
  - Environment Variables:
    - `OPENAI_API_KEY` (veya kullandığın sağlayıcı)
    - `TAVILY_API_KEY` veya `SERPER_API_KEY` vb.
  - Deploy sonrası:
    - `https://<project>.up.railway.app/docs` üzerinden endpoint’leri test et.

---

## 6. Mülakat Sunum Hikâyesi (Kısa Özet)

- **Problem**: Uçak bakım planlaması; ağır dokümantasyon, bilgi asimetrisi, yüksek hata riski.
- **Çözüm**: AeroTech Agentic Hub — AMM, Part‑145 ve kaynak planlamayı tek bir agentik karar destek sistemi altında birleştiren “dijital planlama asistanı”.
- **Teknoloji**: LangChain ile multi‑agent mimari, RAG, FastAPI, Railway deploy.
- **Demo**: `/plan` ile gerçekçi bir arıza senaryosu üzerinden iş paketi + kaynak planlaması, `/qa` ile Q&A asistanı üzerinden teknik sorulara yanıt.


export type Locale = "en" | "tr";

export const translations = {
  en: {
    // Navigation
    overview: "Overview",
    about: "About",
    extension: "Extension",
    install: "Install",
    tools: "Tools",
    costCalculator: "Cost Calculator",
    contextOptimizer: "Context Optimizer",
    modelComparison: "Model Comparison",
    cachingRoi: "Caching ROI",
    conversationCost: "Conversation Cost",
    economicAnalysis: "Economic Analysis",
    pricingReference: "Pricing Reference",
    wiki: "Wiki",
    jargon: "Context Jargon",
    
    // About page
    aboutTitle: "About Tokalator",
    aboutTagline: "Token budget management tools for AI coding assistants",
    author: "Author",
    authorName: "Vahid Faraji",
    authorBio: "Creator and maintainer of Tokalator — building tools that help developers understand and optimize their AI context consumption.",
    project: "Project",
    projectDesc: "Tokalator is an open-source project. The codebase includes:",
    vsCodeExtension: "VS Code Extension",
    vsCodeExtensionDesc: "Real-time token budget dashboard, tab relevance scoring, and @tokens chat participant",
    webTools: "Web Tools",
    webToolsDesc: "Cost calculators, model comparison, caching ROI analysis, and context optimization guides",
    contextLibrary: "Context Engineering Library",
    contextLibraryDesc: "Curated agents, instructions, and prompts for better AI interactions",
    viewOnGithub: "View on GitHub",
    license: "License",
    licenseText: "MIT License — free for personal and commercial use.",
    
    // Wiki page
    wikiTitle: "Context Engineering Wiki",
    wikiTagline: "Essential jargon and concepts for AI coding assistants",
    
    // Sections
    jitContext: "IDE and Just-in-Time (JIT) Context",
    jitContextDesc: "Coding assistants typically operate via IDE extensions or CLI tools that utilize specific features like slash commands and IDE commands to interact with your environment.",
    progressiveDisclosure: "Progressive Disclosure",
    progressiveDisclosureDesc: "Instead of loading an entire codebase—which would immediately overwhelm the attention budget—modern agents use JIT context.",
    lightweightIdentifiers: "Lightweight Identifiers",
    lightweightIdentifiersDesc: "The assistant maintains references (file paths, stored queries) and dynamically loads only the necessary data at runtime using tools like grep, head, or tail.",
    
    longHorizon: "Managing Long-Horizon Tasks",
    longHorizonDesc: "Coding tasks often span \"tens of minutes to multiple hours,\" requiring specialized persistence strategies to avoid context rot.",
    compaction: "Compaction",
    compactionDesc: "When a session nears its token limit, the assistant summarizes critical details—such as architectural decisions and unresolved bugs—while discarding redundant tool outputs.",
    toolResultClearing: "Tool Result Clearing",
    toolResultClearingDesc: "A light touch form of compaction where the raw results of previous tool calls (like long terminal outputs) are cleared to save space.",
    structuredNoteTaking: "Structured Note-taking",
    structuredNoteTakingDesc: "The agent may maintain an external NOTES.md or a to-do list to track dependencies and progress across thousands of steps, which it can read back into its context after a reset.",
    
    contextPollution: "Avoiding Context Pollution",
    contextPollutionDesc: "In a coding context, precision is critical. Performance can be degraded by several factors.",
    distractors: "Distractors",
    distractorsDesc: "Files or code snippets that are topically related to the query but do not contain the answer can cause the model to lose focus or hallucinate.",
    contextRot: "Context Rot",
    contextRotDesc: "As more tokens (e.g., long histories or large files) are added, the model's ability to accurately retrieve \"needles\" of information from the \"haystack\" of the codebase decreases.",
    structuralPatterns: "Structural Patterns",
    structuralPatternsDesc: "Research suggests that models often perform better on shuffled or unstructured context than on logically structured haystacks, which may impact how they process long, coherent files.",
    
    promptStructure: "Prompt Structure for Coding Agents",
    promptStructureDesc: "For high-quality requests, system prompts should be organized into distinct sections using XML tagging or Markdown headers (e.g., <background_information>, ## Tool guidance). The objective is to provide the smallest possible set of high-signal tokens that maximize the likelihood of the correct code generation.",
  },
  tr: {
    // Navigation
    overview: "Genel Bakış",
    about: "Hakkında",
    extension: "Uzantı",
    install: "Kurulum",
    tools: "Araçlar",
    costCalculator: "Maliyet Hesaplayıcı",
    contextOptimizer: "Bağlam Optimize Edici",
    modelComparison: "Model Karşılaştırma",
    cachingRoi: "Önbellekleme ROI",
    conversationCost: "Konuşma Maliyeti",
    economicAnalysis: "Ekonomik Analiz",
    pricingReference: "Fiyat Referansı",
    wiki: "Wiki",
    jargon: "Bağlam Jargonu",
    
    // About page
    aboutTitle: "Tokalator Hakkında",
    aboutTagline: "Yapay zeka kodlama asistanları için token bütçe yönetim araçları",
    author: "Geliştirici",
    authorName: "Vahid Faraji",
    authorBio: "Tokalator'un yaratıcısı ve geliştiricisi — geliştiricilerin yapay zeka bağlam tüketimini anlamalarına ve optimize etmelerine yardımcı olan araçlar geliştiriyor.",
    project: "Proje",
    projectDesc: "Tokalator açık kaynaklı bir projedir. Kod tabanı şunları içerir:",
    vsCodeExtension: "VS Code Uzantısı",
    vsCodeExtensionDesc: "Gerçek zamanlı token bütçe panosu, sekme alaka puanlaması ve @tokens sohbet katılımcısı",
    webTools: "Web Araçları",
    webToolsDesc: "Maliyet hesaplayıcıları, model karşılaştırma, önbellekleme ROI analizi ve bağlam optimizasyon kılavuzları",
    contextLibrary: "Bağlam Mühendisliği Kütüphanesi",
    contextLibraryDesc: "Daha iyi yapay zeka etkileşimleri için seçilmiş ajanlar, talimatlar ve istemler",
    viewOnGithub: "GitHub'da Görüntüle",
    license: "Lisans",
    licenseText: "MIT Lisansı — kişisel ve ticari kullanım için ücretsiz.",
    
    // Wiki page
    wikiTitle: "Bağlam Mühendisliği Wiki",
    wikiTagline: "Yapay zeka kodlama asistanları için temel jargon ve kavramlar",
    
    // Sections
    jitContext: "IDE ve Anında (JIT) Bağlam",
    jitContextDesc: "Kodlama asistanları genellikle ortamınızla etkileşim kurmak için eğik çizgi komutları ve IDE komutları gibi belirli özellikleri kullanan IDE uzantıları veya CLI araçları aracılığıyla çalışır.",
    progressiveDisclosure: "Aşamalı Açıklama",
    progressiveDisclosureDesc: "Dikkat bütçesini hemen dolduracak olan tüm kod tabanını yüklemek yerine, modern ajanlar JIT bağlamını kullanır.",
    lightweightIdentifiers: "Hafif Tanımlayıcılar",
    lightweightIdentifiersDesc: "Asistan referansları (dosya yolları, saklanan sorgular) korur ve grep, head veya tail gibi araçları kullanarak çalışma zamanında yalnızca gerekli verileri dinamik olarak yükler.",
    
    longHorizon: "Uzun Ufuk Görevlerini Yönetme",
    longHorizonDesc: "Kodlama görevleri genellikle \"on dakikadan birkaç saate\" kadar sürer ve bağlam çürümesini önlemek için özel kalıcılık stratejileri gerektirir.",
    compaction: "Sıkıştırma",
    compactionDesc: "Bir oturum token sınırına yaklaştığında, asistan mimari kararlar ve çözülmemiş hatalar gibi kritik ayrıntıları özetlerken gereksiz araç çıktılarını atar.",
    toolResultClearing: "Araç Sonucu Temizleme",
    toolResultClearingDesc: "Önceki araç çağrılarının ham sonuçlarının (uzun terminal çıktıları gibi) yer kazanmak için temizlendiği hafif bir sıkıştırma biçimi.",
    structuredNoteTaking: "Yapılandırılmış Not Alma",
    structuredNoteTakingDesc: "Ajan, binlerce adım boyunca bağımlılıkları ve ilerlemeyi izlemek için harici bir NOTES.md veya yapılacaklar listesi tutabilir ve bunu sıfırlamadan sonra bağlamına geri okuyabilir.",
    
    contextPollution: "Bağlam Kirliliğinden Kaçınma",
    contextPollutionDesc: "Kodlama bağlamında hassasiyet kritiktir. Performans çeşitli faktörlerle düşürülebilir.",
    distractors: "Dikkat Dağıtıcılar",
    distractorsDesc: "Sorguyla konusal olarak ilgili ancak cevabı içermeyen dosyalar veya kod parçacıkları, modelin odağını kaybetmesine veya halüsinasyon görmesine neden olabilir.",
    contextRot: "Bağlam Çürümesi",
    contextRotDesc: "Daha fazla token eklendikçe (örn. uzun geçmişler veya büyük dosyalar), modelin kod tabanının \"samanlığından\" bilgi \"iğnelerini\" doğru bir şekilde alma yeteneği azalır.",
    structuralPatterns: "Yapısal Kalıplar",
    structuralPatternsDesc: "Araştırmalar, modellerin genellikle karıştırılmış veya yapılandırılmamış bağlamda mantıksal olarak yapılandırılmış samanlıklardan daha iyi performans gösterdiğini ve bunun uzun, tutarlı dosyaları nasıl işlediklerini etkileyebileceğini göstermektedir.",
    
    promptStructure: "Kodlama Ajanları için İstem Yapısı",
    promptStructureDesc: "Yüksek kaliteli istekler için, sistem istemleri XML etiketleme veya Markdown başlıkları (örn. <background_information>, ## Araç rehberliği) kullanılarak ayrı bölümlere düzenlenmelidir. Amaç, doğru kod üretimi olasılığını en üst düzeye çıkaran en küçük yüksek sinyalli token setini sağlamaktır.",
  },
} as const;

export function t(locale: Locale, key: keyof typeof translations.en): string {
  return translations[locale][key] || translations.en[key];
}

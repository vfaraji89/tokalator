"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WikiContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "tr" ? "tr" : "en";

  const content = {
    en: {
      title: "Context Engineering Wiki",
      tagline: "Essential jargon and concepts for AI coding assistants",
      sections: [
        {
          id: "jit",
          title: "1. IDE and Just-in-Time (JIT) Context",
          intro: "Coding assistants typically operate via IDE extensions or CLI tools that utilize specific features like slash commands and IDE commands to interact with your environment.",
          terms: [
            {
              term: "Progressive Disclosure",
              definition: "Instead of loading an entire codebase—which would immediately overwhelm the attention budget—modern agents use JIT context.",
            },
            {
              term: "Lightweight Identifiers",
              definition: "The assistant maintains references (file paths, stored queries) and dynamically loads only the necessary data at runtime using tools like grep, head, or tail.",
            },
          ],
        },
        {
          id: "long-horizon",
          title: "2. Managing Long-Horizon Tasks",
          intro: 'Coding tasks often span "tens of minutes to multiple hours," requiring specialized persistence strategies to avoid context rot:',
          terms: [
            {
              term: "Compaction",
              definition: 'When a session nears its token limit, the assistant summarizes critical details—such as architectural decisions and unresolved bugs—while discarding "redundant tool outputs".',
            },
            {
              term: "Tool Result Clearing",
              definition: 'This is a "light touch" form of compaction where the raw results of previous tool calls (like long terminal outputs) are cleared to save space.',
            },
            {
              term: "Structured Note-taking",
              definition: "The agent may maintain an external NOTES.md or a to-do list to track dependencies and progress across thousands of steps, which it can read back into its context after a reset.",
            },
          ],
        },
        {
          id: "pollution",
          title: "3. Avoiding Context Pollution",
          intro: "In a coding context, precision is critical. Performance can be degraded by several factors:",
          terms: [
            {
              term: "Distractors",
              definition: "Files or code snippets that are topically related to the query but do not contain the answer can cause the model to lose focus or hallucinate.",
            },
            {
              term: "Context Rot",
              definition: 'As more tokens (e.g., long histories or large files) are added, the model\'s ability to accurately retrieve "needles" of information from the "haystack" of the codebase decreases.',
            },
            {
              term: "Structural Patterns",
              definition: "Research suggests that models often perform better on shuffled or unstructured context than on logically structured haystacks, which may impact how they process long, coherent files.",
            },
          ],
        },
        {
          id: "prompt",
          title: "4. Prompt Structure for Coding Agents",
          intro: "For high-quality requests, system prompts should be organized into distinct sections using XML tagging or Markdown headers.",
          terms: [
            {
              term: "XML Tagging",
              definition: "Use tags like <background_information>, <tool_guidance>, <constraints> to clearly separate different types of instructions.",
            },
            {
              term: "High-Signal Tokens",
              definition: "The objective is to provide the smallest possible set of high-signal tokens that maximize the likelihood of the correct code generation.",
            },
          ],
        },
      ],
    },
    tr: {
      title: "Bağlam Mühendisliği Wiki",
      tagline: "Yapay zeka kodlama asistanları için temel jargon ve kavramlar",
      sections: [
        {
          id: "jit",
          title: "1. IDE ve Anında (JIT) Bağlam",
          intro: "Kodlama asistanları genellikle ortamınızla etkileşim kurmak için eğik çizgi komutları ve IDE komutları gibi belirli özellikleri kullanan IDE uzantıları veya CLI araçları aracılığıyla çalışır.",
          terms: [
            {
              term: "Aşamalı Açıklama",
              definition: "Dikkat bütçesini hemen dolduracak olan tüm kod tabanını yüklemek yerine, modern ajanlar JIT bağlamını kullanır.",
            },
            {
              term: "Hafif Tanımlayıcılar",
              definition: "Asistan referansları (dosya yolları, saklanan sorgular) korur ve grep, head veya tail gibi araçları kullanarak çalışma zamanında yalnızca gerekli verileri dinamik olarak yükler.",
            },
          ],
        },
        {
          id: "long-horizon",
          title: "2. Uzun Ufuk Görevlerini Yönetme",
          intro: '"On dakikadan birkaç saate" kadar süren kodlama görevleri, bağlam çürümesini önlemek için özel kalıcılık stratejileri gerektirir:',
          terms: [
            {
              term: "Sıkıştırma",
              definition: 'Bir oturum token sınırına yaklaştığında, asistan mimari kararlar ve çözülmemiş hatalar gibi kritik ayrıntıları özetlerken "gereksiz araç çıktılarını" atar.',
            },
            {
              term: "Araç Sonucu Temizleme",
              definition: 'Önceki araç çağrılarının ham sonuçlarının (uzun terminal çıktıları gibi) yer kazanmak için temizlendiği "hafif bir dokunuş" sıkıştırma biçimidir.',
            },
            {
              term: "Yapılandırılmış Not Alma",
              definition: "Ajan, binlerce adım boyunca bağımlılıkları ve ilerlemeyi izlemek için harici bir NOTES.md veya yapılacaklar listesi tutabilir ve bunu sıfırlamadan sonra bağlamına geri okuyabilir.",
            },
          ],
        },
        {
          id: "pollution",
          title: "3. Bağlam Kirliliğinden Kaçınma",
          intro: "Kodlama bağlamında hassasiyet kritiktir. Performans çeşitli faktörlerle düşürülebilir:",
          terms: [
            {
              term: "Dikkat Dağıtıcılar",
              definition: "Sorguyla konusal olarak ilgili ancak cevabı içermeyen dosyalar veya kod parçacıkları, modelin odağını kaybetmesine veya halüsinasyon görmesine neden olabilir.",
            },
            {
              term: "Bağlam Çürümesi",
              definition: 'Daha fazla token eklendikçe (örn. uzun geçmişler veya büyük dosyalar), modelin kod tabanının "samanlığından" bilgi "iğnelerini" doğru bir şekilde alma yeteneği azalır.',
            },
            {
              term: "Yapısal Kalıplar",
              definition: "Araştırmalar, modellerin genellikle karıştırılmış veya yapılandırılmamış bağlamda mantıksal olarak yapılandırılmış samanlıklardan daha iyi performans gösterdiğini göstermektedir.",
            },
          ],
        },
        {
          id: "prompt",
          title: "4. Kodlama Ajanları için İstem Yapısı",
          intro: "Yüksek kaliteli istekler için, sistem istemleri XML etiketleme veya Markdown başlıkları kullanılarak ayrı bölümlere düzenlenmelidir.",
          terms: [
            {
              term: "XML Etiketleme",
              definition: "Farklı talimat türlerini net bir şekilde ayırmak için <background_information>, <tool_guidance>, <constraints> gibi etiketler kullanın.",
            },
            {
              term: "Yüksek Sinyalli Tokenlar",
              definition: "Amaç, doğru kod üretimi olasılığını en üst düzeye çıkaran en küçük yüksek sinyalli token setini sağlamaktır.",
            },
          ],
        },
      ],
    },
  };

  const c = content[lang];

  return (
    <article className="article">
      <header>
        <h1>{c.title}</h1>
        <p className="tagline">{c.tagline}</p>
      </header>

      {c.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          <p>{section.intro}</p>
          <div className="wiki-terms">
            {section.terms.map((item) => (
              <div key={item.term} className="wiki-term">
                <h4>{item.term}</h4>
                <p>{item.definition}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}

export default function WikiPage() {
  return (
    <Suspense fallback={<div className="article"><p>Loading...</p></div>}>
      <WikiContent />
    </Suspense>
  );
}

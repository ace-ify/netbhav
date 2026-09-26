import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
  MapPin,
  Sprout,
  Database,
  Globe,
  Bell,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import Nav from "@/components/ui/Nav";
import PillButton from "@/components/ui/PillButton";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import AnalysisSection from "@/components/ui/AnalysisSection";
import WhatsAppSignup from "@/components/ui/WhatsAppSignup";

// Unsplash placeholders (design.md §6) — swap for real farm/mandi photos before demo.
const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  heroPill: "1500382017468-9049fed747ef",
  heroMain: "1595246140625-573b715d11dc",
  break: "1445264618000-f1e069c5920f",
  trust: "1464226184884-fa280b87c399",
  price: "1488459716781-31db52582fe9",
  transport: "1592982537447-7440770cbfc9",
  net: "1560493676-04071c5f467b",
  reco: "1523741543316-beb7fc7023d8",
};

const NAV_LINKS = [
  { label: "कैसे", href: "#kaise" },
  { label: "मंडी", href: "#mandi" },
  { label: "Pricing", href: "#pricing" },
  { label: "App", href: "/app" },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: "शुद्ध आय",
    body: "सिर्फ़ भाव नहीं — transport, commission और fee घटाकर असली हाथ-में-आने वाली रकम।",
  },
  {
    icon: MapPin,
    title: "24 मंडी की तुलना",
    body: "आपके इलाक़े की हर मंडी एक साथ — दूरी, भाव और कटौती के साथ रैंक।",
  },
  {
    icon: Sprout,
    title: "हिंदी वॉइस + WhatsApp",
    body: "बोलकर पूछें, हिंदी में जवाब पाएँ। वही जवाब WhatsApp पर भी।",
  },
  {
    icon: Database,
    title: "लाइव Agmarknet",
    body: "data.gov.in से लाइव भाव, reference fallback के साथ — कोई API key नहीं।",
  },
  {
    icon: Globe,
    title: "FPO / थोक",
    body: "गाँव की उपज मिलाकर पूरा ट्रक — प्रति क्विंटल भाड़ा तेज़ी से घटता है।",
  },
  {
    icon: Bell,
    title: "सक्रिय अलर्ट",
    body: "भाव चढ़ते ही या बेचने का सही दिन आते ही ख़ुद ख़बर।",
  },
];

const PIPELINE = [
  {
    title: "भाव",
    image: U(IMG.price),
    alt: "मंडी में बिकता अनाज",
    content: "हर मंडी का ताज़ा modal भाव — Agmarknet लाइव, वरना reference fallback।",
  },
  {
    title: "परिवहन",
    image: U(IMG.transport),
    alt: "खेत में ट्रैक्टर",
    content: "दूरी, सबसे सस्ता वाहन, फेरे और लदान — सब जोड़कर असली भाड़ा निकालते हैं।",
  },
  {
    title: "शुद्ध आय",
    image: U(IMG.net),
    alt: "हरा-भरा खेत",
    content: "भाव से commission, मंडी शुल्क, cess, हमाली और भाड़ा घटाकर हाथ-में रकम।",
  },
  {
    title: "सिफ़ारिश",
    image: U(IMG.reco),
    alt: "फ़सल की कतारें",
    content: "हर मंडी शुद्ध आय पर रैंक — और SELL / WAIT / MONITOR का साफ़ इशारा।",
  },
];

const PLANS = [
  {
    name: "फ़्री",
    price: "₹0",
    note: "किसान के लिए, हमेशा",
    popular: true,
    features: ["शुद्ध आय रैंकिंग", "24 मंडी तुलना", "हिंदी वॉइस + WhatsApp", "बेसिक अलर्ट"],
  },
  {
    name: "FPO / थोक",
    price: "संपर्क",
    note: "सहकारी व समितियाँ",
    popular: false,
    features: ["पूरे गाँव की पूलिंग", "मल्टी-विलेज डैशबोर्ड", "प्राथमिकता अलर्ट", "बल्क रूट प्लानिंग"],
  },
  {
    name: "Partner / API",
    price: "API",
    note: "एग्री-टेक व सरकार",
    popular: false,
    features: ["Net-realization API", "Webhook अलर्ट", "White-label विजेट", "SLA सपोर्ट"],
  },
];

export default function Home() {
  return (
    <>
      <Nav links={NAV_LINKS} cta={{ label: "App kholo", href: "/app" }} />
      <main>
        {/* 1 — Hero */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-16 pt-28 sm:px-8 md:pt-36 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="font-oswald text-5xl font-600 leading-[0.95] tracking-tighter text-neutral-900 md:text-7xl">
              स्मार्ट मंडी
              <span className="mx-2 inline-block h-12 w-28 overflow-hidden rounded-full align-middle md:h-16 md:w-48">
                <Image
                  src={U(IMG.heroPill, 400)}
                  alt="अनाज"
                  width={192}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </span>
              — असली कमाई
            </h1>

            <p className="mt-6 max-w-sm text-lg leading-relaxed text-neutral-600">
              सबसे ऊँचा भाव नहीं — सबसे ज़्यादा घर ले जाने वाली मंडी. Transport, commission,
              fee ke baad ki asli kamai.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PillButton href="/app" icon={ArrowRight}>
                App kholo
              </PillButton>
              <PillButton href="#kaise" variant="secondary">
                कैसे काम करता है
              </PillButton>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
              <Stat value="24" label="मंडी" />
              <Stat value="₹8,402" label="बचत (demo)" />
              <Stat value="0" label="keys" />
            </div>
          </div>

          <div className="relative h-[460px] sm:h-[560px] lg:col-span-5 lg:h-[600px]">
            <div className="clip-image absolute inset-0 overflow-hidden rounded-lg bg-neutral-200">
              <Image
                src={U(IMG.heroMain)}
                alt="अपने खेत पर किसान"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
                className="object-cover"
              />
            </div>

            <div className="absolute left-6 top-6 w-44 rounded-lg border border-neutral-200 bg-white/90 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
                </span>
                <span className="text-xs font-500 uppercase tracking-wide text-neutral-500">
                  लाइव भाव
                </span>
              </div>
              <div className="mt-2 text-sm text-neutral-500">गेहूँ · इंदौर</div>
              <div className="font-oswald text-2xl font-600 tracking-tight text-neutral-900">
                ₹2,150<span className="text-sm font-400 text-neutral-500">/क्विंटल</span>
              </div>
            </div>

            <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
              <Sprout className="h-4 w-4 text-neutral-900" aria-hidden />
              <span className="text-xs font-500 text-neutral-700">हिंदी वॉइस + WhatsApp</span>
            </div>
          </div>
        </section>
        {/* 2 — Visual break */}
        <section className="relative h-96 w-full overflow-hidden md:h-[600px]">
          <Image
            src={U(IMG.break, 1600)}
            alt="खुला खेत"
            fill
            sizes="100vw"
            className="object-cover opacity-90 grayscale"
          />
          <div className="absolute inset-0 bg-neutral-900/10" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-900/70 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-7xl items-end px-5 pb-16 sm:px-8">
            <p className="max-w-2xl font-oswald text-3xl font-500 leading-tight tracking-tight text-white md:text-5xl">
              वही फ़सल, वही दिन — सिर्फ़ समझदार मंडी, और ज़्यादा पैसा घर।
            </p>
          </div>
        </section>

        {/* 3 — Advantage / Features */}
        <section id="kaise" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-500 uppercase tracking-widest text-neutral-500">फ़ायदे</p>
            <h2 className="mt-3 font-oswald text-3xl font-500 tracking-tight text-neutral-900 md:text-5xl">
              भाव से आगे की पूरी कहानी
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} variant="grid" icon={f.icon} title={f.title}>
                {f.body}
              </Card>
            ))}
          </div>
        </section>

        {/* 4 — Analysis / Accordion pipeline */}
        <AnalysisSection eyebrow="पाइपलाइन" heading="भाव से सिफ़ारिश तक" steps={PIPELINE} />
        {/* 5 — Pricing (dark) */}
        <section id="pricing" className="bg-neutral-900 py-24 text-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-500 uppercase tracking-widest text-neutral-400">Pricing</p>
              <h2 className="mt-3 font-oswald text-3xl font-500 tracking-tight md:text-5xl">
                एक profile, तीन दरवाज़े
              </h2>
              <p className="mt-3 text-neutral-400">
                किसान के लिए हमेशा मुफ़्त। FPO और partner अपनी ज़रूरत के हिसाब से।
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-neutral-800 md:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col p-8 ${
                    plan.popular ? "rounded-r-lg bg-neutral-800/20" : "bg-neutral-900"
                  }`}
                >
                  {plan.popular && (
                    <span className="mb-3 text-xs font-500 uppercase tracking-wide text-yellow-500">
                      किसान के लिए
                    </span>
                  )}
                  <h3 className="font-oswald text-xl font-500 tracking-tight">{plan.name}</h3>
                  <div className="mt-2 font-oswald text-4xl font-600 tracking-tight">
                    {plan.price}
                  </div>
                  <div className="mt-1 text-sm text-neutral-400">{plan.note}</div>
                  <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="flex flex-col bg-neutral-900 p-8">
                <span className="mb-4 text-xs font-500 uppercase tracking-wide text-neutral-500">
                  कैसे शुरू करें
                </span>
                <ol className="space-y-4 text-sm text-neutral-300">
                  {["फ़ोन नंबर डालें", "फ़सल, मात्रा व जगह", "सबसे अच्छी मंडी देखें", "अलर्ट पाते रहें"].map(
                    (step, i) => (
                      <li key={step} className="flex gap-3">
                        <span className="font-oswald text-neutral-500">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {step}
                      </li>
                    )
                  )}
                </ol>
                <div className="mt-auto pt-8">
                  <PillButton href="/app" variant="onDark" icon={ArrowRight} className="w-full">
                    App kholo
                  </PillButton>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* 6 — Trust & CTA */}
        <section id="cta" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-200">
              <Image
                src={U(IMG.trust)}
                alt="खेत में उपज"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-80 grayscale"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-neutral-500">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                <span className="text-xs font-500 uppercase tracking-widest">भरोसा</span>
              </div>
              <h2 className="mt-3 font-oswald text-3xl font-500 tracking-tight text-neutral-900 md:text-5xl">
                भरोसे के साथ, बिना झंझट
              </h2>
              <ul className="mt-8 space-y-4">
                {[
                  ["AI-सहायता", "सवाल हिंदी में पूछें — वॉइस या टेक्स्ट, जवाब भी हिंदी में।"],
                  ["ज़ीरो-key", "कोई API key नहीं, कोई लॉगिन नहीं — खोलते ही चालू।"],
                  ["Reference-backed", "हर रुपया Agmarknet और पारदर्शी गणित से निकला।"],
                ].map(([title, desc]) => (
                  <li key={title} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gain" aria-hidden />
                    <div>
                      <div className="font-500 text-neutral-900">{title}</div>
                      <div className="text-neutral-600">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <WhatsAppSignup />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-200 py-10 text-center text-sm text-neutral-500">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex items-center justify-center gap-2 text-neutral-900">
              <Sprout className="h-4 w-4" aria-hidden />
              <span className="font-600 text-sm uppercase tracking-widest">NetBhav</span>
            </div>
            <p className="mx-auto mt-3 max-w-xl">
              भाव: Agmarknet (data.gov.in) reference fallback के साथ। गणना निश्चित है और पूरी दिखाई जाती है।
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

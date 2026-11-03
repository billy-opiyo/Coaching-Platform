import Link from "next/link";
import { PageFrame } from "@/components/site-shell";
import { getPublishedPaths } from "@/lib/published-content";

const questions = [
  ["Where should I begin?", "You can start with the free learning paths or request the 7-Day Blueprint. Choose the option that feels useful for you."],
  ["Is this professional treatment?", "No. These educational resources are self-help information and are not a diagnosis or substitute for professional care."],
  ["Do I need an account to read resources?", "No. Public learning resources are available without registration. Member tools will be clearly described when available."],
];

export default async function Home() {
  const learningPaths = await getPublishedPaths();
  return <PageFrame>
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> A thoughtful place to start</p>
          <h1>Small steps.<br /><em>Steadier days.</em></h1>
          <p className="hero-copy">Explore practical learning and supportive tools for building habits that feel more intentional. Begin privately, move at your own pace.</p>
          <div className="hero-actions"><Link className="button button-light" href="/blueprint">Explore the free 7-Day Blueprint <span aria-hidden="true">↗</span></Link><Link className="text-link text-link-light" href="/resources">Browse free resources <span aria-hidden="true">→</span></Link></div>
          <p className="hero-note">No pressure. Just a clear next step when you’re ready.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="sun-disc" /><div className="arc arc-one" /><div className="arc arc-two" /><div className="art-caption"><span className="art-caption-line" /> A moment to reset</div><div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" /></div>
      </section>

      <section className="intro-strip"><span className="strip-index">01 / A place to begin</span><p>Change can begin with understanding a pattern, creating a little space, and choosing one action that fits your life.</p><Link className="text-link" href="/about">Our approach <span aria-hidden="true">→</span></Link></section>

      <section className="section section-paths">
        <div className="section-top"><div><p className="eyebrow">Free learning library</p><h2>Learn at your own pace.</h2></div><Link className="text-link" href="/resources">Explore all resources <span aria-hidden="true">→</span></Link></div>
        {learningPaths.length ? <div className="path-grid">{learningPaths.map((path, index) => <article className="path-card" key={path.slug}><div className={`path-number path-number-${index + 1}`}>0{index + 1}</div><p className="path-kicker">Learning path</p><h3>{path.name}</h3><p>{path.description}</p><Link className="card-link" href={`/resources/${path.slug}`}>Explore {path.name.toLowerCase()} <span aria-hidden="true">↗</span></Link></article>)}</div> : <div className="empty-state"><h2>Learning paths are being prepared</h2><p>Free resources will appear here when the content team publishes them.</p></div>}
      </section>

      <section className="section blueprint-band"><div className="blueprint-mark" aria-hidden="true"><span>7</span><i>days<br />of focus</i><div className="blueprint-line" /></div><div className="blueprint-copy"><p className="eyebrow eyebrow-light">A free starting point</p><h2>One week.<br /><em>One day at a time.</em></h2><p>The 7-Day Blueprint is planned as a simple guide to help you take a first step. The owner’s approved PDF is not yet available, so requests are not open yet.</p><Link className="button button-outline" href="/blueprint">See Blueprint details <span aria-hidden="true">→</span></Link></div></section>

      <section className="section approach-section"><div className="approach-aside"><p className="eyebrow">A grounded approach</p><h2>Progress without pressure.</h2><p>There is no single path that fits everyone. Start with what feels manageable and seek qualified professional support when you need it.</p><Link className="text-link" href="/coaching">Learn about coaching <span aria-hidden="true">→</span></Link></div><div className="principles">{[["Notice", "Build a clearer picture of patterns and the situations around them."], ["Choose", "Try small, practical actions that suit your circumstances."], ["Continue", "Reflect on what helped and adjust without judgement."]].map(([title, body], index) => <div className="principle" key={title}><span className="principle-index">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div><span className="principle-arrow" aria-hidden="true">↗</span></div>)}</div></section>

      <section className="section faq-section"><div><p className="eyebrow">Good to know</p><h2>Questions, answered.</h2></div><div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="closing-cta"><p className="eyebrow eyebrow-light">Your next step, your choice</p><h2>Begin where you are.</h2><p>Explore free learning or learn what coaching may involve.</p><div><Link className="button button-light" href="/resources">Explore free resources</Link><Link className="text-link text-link-light" href="/contact">Get in touch <span aria-hidden="true">→</span></Link></div></section>
    </main>
  </PageFrame>;
}

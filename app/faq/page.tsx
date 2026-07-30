import type { ReactNode } from "react";

type Faq = {
  question: string;
  answer: ReactNode;
};

const faqs: Faq[] = [
  {
    question: "What will the weather be like?",
    answer:
      "It's Colorado in late October, so expect cold and expect the unexpected.",
  },
  {
    question: "Will the ceremony be outdoors?",
    answer:
      "Yes. The reception that follows will be indoors and warm.",
  },
  {
    question: "Is there parking?",
    answer: (
      <>
        Yes, though it is limited. There is on-site parking at the venue on a
        first-come basis, so we encourage carpooling or taking the shuttle from
        the hotels. See our{" "}
        <a
          className="text-accent-light hover:opacity-[80%]"
          href="/details"
        >
          details page
        </a>{" "}
        for venue locations and directions.
      </>
    ),
  },
  {
    question: "Can I wear a color other than black?",
    answer:
      "No. Black is the dress code, and we're serious about it. Deep black in any fabric or texture is welcome, and metallic or bone-white accents are fine, but please leave the color at home.",
  },
  {
    question: "Will transportation be provided?",
    answer: (
      <>
        On the wedding day, yes. Shuttles will run between our{" "}
        <a
          className="text-accent-light hover:opacity-[80%]"
          href="/details#room-blocks"
        >
          room block hotels
        </a>{" "}
        and the venue so nobody has to drive mountain roads in the dark.
        <br/>
        Shuttles to the wlecome party will not be provided.
      </>
    ),
  },
  {
    question: "Does this mean I need to buy or rent a suit?",
    answer: (
      <>
        Not at all. While formal attire is preferred, a nice black shirt and
        black slacks is completely appropriate. For inspiration rather than obligation, take a look at
        our{" "}
        <a className="text-accent-light hover:opacity-[80%]" href="/theme">
          theme page
        </a>
        .
      </>
    ),
  },
  {
    question: "Can I bring my children?",
    answer:
      "No. We love your kids, and we hope this gives you an excuse for a night off.",
  },
  {
    question: "Can I bring my pet?",
    answer:
      "Bats only.",
  },
];

export default function FaqPage() {
  return (
    <div className="relative min-h-screen bg-black pt-24 pb-16 px-6">
      <div className="relative max-w-4xl mx-auto">
        <section className="text-center mt-8">
          <h1 className="font-[var(--font-special-elite)] text-3xl md:text-4xl tracking-wider text-accent-light mb-8">
            Frequently Asked Questions
          </h1>
          <p className="text-muted leading-relaxed mb-16 max-w-xl mx-auto">
            A few things guests have asked us. If your question isn&apos;t here,
            please reach out and we&apos;ll happily answer it.
          </p>
          <ul className="space-y-12">
            {faqs.map((faq, idx) => (
              <li key={faq.question}>
                {idx > 0 && (
                  <hr className="border-0 border-t border-accent/40 w-24 mx-auto mb-12" />
                )}
                <h2 className="font-[var(--font-special-elite)] text-xl md:text-2xl tracking-wider text-foreground mb-4">
                  {faq.question}
                </h2>
                <p className="text-muted leading-relaxed mx-auto">
                  {faq.answer}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

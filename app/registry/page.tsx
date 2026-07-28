const charities = [
  {
    name: "Rocky Mountain Immigrant Advocacy Network",
    href: "https://www.rmian.org/donate",
    description:
      "RMIAN provides free legal services to immigrant children and adults in immigration detention in Colorado, ensuring due process and access to justice for all.",
  },
  {
    name: "The Delores Project",
    href: "https://secure.qgiv.com/for/thedeloresproject/",
    description:
      "The Delores Project provides safe, low-barrier shelter and personalized services for unhoused women and transgender individuals in Denver.",
  },
  {
    name: "Native American Rights Fund",
    href: "https://narf.org",
    description:
      "NARF provides legal assistance to Native American tribes, organizations, and individuals nationwide, defending tribal sovereignty, natural resources, and human rights.",
  },
];

export default function RegistryPage() {
  return (
    <div className="relative min-h-screen bg-black pt-24 pb-16 px-6">
      <div className="relative max-w-4xl mx-auto">
        <section className="text-center mt-8">
          <h2 className="font-[var(--font-special-elite)] text-2xl md:text-3xl tracking-wider text-accent-light mb-8">
            In Lieu of Gifts
          </h2>
          <p className="text-muted leading-relaxed mb-12 max-w-xl mx-auto">
            Your presence at our wedding is the greatest gift of all. In lieu of
            a gift, we would be honored if you made a donation to one of the
            following charities that are close to our hearts.
          </p>
          <ul className="space-y-12">
            {charities.map((charity, idx) => (
              <li key={charity.name}>
                {idx > 0 && (
                  <hr className="border-0 border-t border-accent/40 w-24 mx-auto mb-12" />
                )}
                <h3 className="font-[var(--font-special-elite)] text-2xl tracking-wider text-foreground mb-4">
                  {charity.name}
                </h3>
                <p className="text-muted leading-relaxed mb-6 max-w-xl mx-auto">
                  {charity.description}
                </p>
                <a
                  href={charity.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-6 py-3 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
                >
                  Donate
                </a>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-0 border-t border-accent/40 w-full mx-auto my-20" />

        <section className="text-center">
          <h2 className="font-[var(--font-special-elite)] text-2xl md:text-3xl tracking-wider text-accent-light mb-8">
            Prefer a Gift?
          </h2>
          <p className="text-muted leading-relaxed mb-8 max-w-xl mx-auto">
            If you would really prefer to get us a gift, we are registered at
            Zola.
          </p>
          <a
            href="https://www.zola.com/registry/karinaandnick2026"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-6 py-3 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
          >
            View Our Registry
          </a>
        </section>
      </div>
    </div>
  );
}

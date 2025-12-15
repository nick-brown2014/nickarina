import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <section className="hero-section bg-placeholder">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-bg.jpg')",
          }}
        />
        <div className="hero-overlay" />

        <div className="hero-content text-center px-6 max-w-4xl mx-auto">
          <p className="text-accent-light tracking-[0.3em] uppercase text-sm mb-6">
            Together with their families
          </p>

          <h1 className="font-[var(--font-cinzel)] text-5xl md:text-7xl lg:text-8xl tracking-wide text-foreground mb-6">
            Nick & Karina
          </h1>

          <div className="w-24 h-px bg-accent-light mx-auto mb-6" />

          <p className="font-[var(--font-cinzel)] text-xl md:text-2xl tracking-widest text-accent-light mb-4">
            Request the pleasure of your company
          </p>

          <p className="font-[var(--font-cinzel)] text-lg md:text-xl text-muted mb-8">
            at the celebration of their marriage
          </p>

          <div className="space-y-2 mb-12">
            <p className="font-[var(--font-cinzel)] text-3xl md:text-4xl tracking-wider text-foreground">
              October 31, 2026
            </p>
            <p className="text-muted text-lg">
              Halloween
            </p>
          </div>

          <div className="space-y-1 mb-12">
            <p className="font-[var(--font-cinzel)] text-xl text-accent-light">
              Della Terra Mountain Chateau
            </p>
            <p className="text-muted">
              Estes Park, Colorado
            </p>
          </div>

          <Link
            href="/rsvp"
            className="inline-block font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-10 py-4 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
          >
            RSVP
          </Link>
        </div>
      </section>

      <section className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-[var(--font-cinzel)] text-3xl md:text-4xl tracking-wider text-foreground mb-8">
            Join Us
          </h2>
          <div className="w-16 h-px bg-accent mx-auto mb-8" />
          <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            We invite you to celebrate with us as we begin our journey together.
            Nestled in the mountains of Colorado, Della Terra Mountain Chateau
            provides the perfect backdrop for our gothic-inspired celebration
            on All Hallows&apos; Eve.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-8 border border-accent/20 hover:border-accent-light/40 transition-colors">
              <h3 className="font-[var(--font-cinzel)] text-xl tracking-wider text-accent-light mb-4">
                Ceremony
              </h3>
              <p className="text-muted">
                4:00 PM
              </p>
            </div>

            <div className="p-8 border border-accent/20 hover:border-accent-light/40 transition-colors">
              <h3 className="font-[var(--font-cinzel)] text-xl tracking-wider text-accent-light mb-4">
                Reception
              </h3>
              <p className="text-muted">
                5:30 PM
              </p>
            </div>

            <div className="p-8 border border-accent/20 hover:border-accent-light/40 transition-colors">
              <h3 className="font-[var(--font-cinzel)] text-xl tracking-wider text-accent-light mb-4">
                Attire
              </h3>
              <p className="text-muted">
                Formal / Gothic
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-[var(--font-cinzel)] text-3xl md:text-4xl tracking-wider text-foreground mb-8">
            The Venue
          </h2>
          <div className="w-16 h-px bg-accent mx-auto mb-8" />

          <div className="relative aspect-video bg-placeholder mb-8 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/venue-bg.jpg')",
              }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted/50 text-sm tracking-wider uppercase">
                Venue image coming soon
              </p>
            </div>
          </div>

          <h3 className="font-[var(--font-cinzel)] text-2xl tracking-wider text-accent-light mb-4">
            Della Terra Mountain Chateau
          </h3>
          <p className="text-muted mb-2">
            3501 Fall River Road
          </p>
          <p className="text-muted mb-8">
            Estes Park, CO 80517
          </p>

          <a
            href="https://maps.google.com/?q=Della+Terra+Mountain+Chateau+Estes+Park+CO"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-[var(--font-cinzel)] text-sm tracking-[0.2em] uppercase px-8 py-3 border border-accent/40 text-muted hover:border-accent-light hover:text-accent-light transition-all duration-300"
          >
            Get Directions
          </a>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-accent/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-[var(--font-cinzel)] text-2xl tracking-wider text-accent-light mb-4">
            N & K
          </p>
          <p className="text-muted text-sm">
            October 31, 2026 &middot; Estes Park, Colorado
          </p>
        </div>
      </footer>
    </div>
  );
}

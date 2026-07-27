import Link from "next/link";
import Image from "next/image";
import starsBg from "@/app/assets/stars.png";
import nicholasBrown from "@/app/assets/nicholas brown.png";
import karinaErnst from "@/app/assets/karina ernst.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <section className="hero-section bg-placeholder !flex-col !justify-start pt-32 pb-16 gap-12">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${starsBg.src}')`,
          }}
        />
        <div className="hero-overlay" />

        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 px-6 z-10">
          <Image
            src={nicholasBrown}
            alt="Nicholas Brown"
            className="w-auto h-64 md:h-[26rem] lg:h-[32rem] object-contain"
            priority
          />
          <span className="font-[var(--font-special-elite)] md:text-xl text-white">
          </span>
          <Image
            src={karinaErnst}
            alt="Karina Ernst"
            className="w-auto h-64 md:h-[26rem] lg:h-[32rem] object-contain"
            priority
          />
        </div>

        <div className="hero-content text-center px-6 max-w-4xl mx-auto">

          <div className="space-y-1 mb-12">
            <p className="font-[var(--font-special-elite)] text-xl text-accent-light">
              October 31, 2026
            </p>
            <p className="font-[var(--font-special-elite)] text-xl text-accent-light">
              Della Terra Mountain Chateau
            </p>
            <p className="text-muted">
              Estes Park, Colorado
            </p>
          </div>

          <Link
            href="/rsvp"
            className="inline-block font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-12 py-2 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
          >
            RSVP
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-accent/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-[var(--font-special-elite)] text-2xl tracking-wider text-accent-light mb-4">
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

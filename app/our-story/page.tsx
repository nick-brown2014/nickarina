import knBackground from "@/app/assets/kn+background.png";

export default function OurStoryPage() {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="fixed inset-0 bg-black bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${knBackground.src}')` }}
      />
      <div aria-hidden className="fixed inset-0 bg-black/50" />

      <section className="relative min-h-screen flex items-start justify-center pt-[25vh]">
        <div className="text-center px-6">
          <h1 className="font-[var(--font-special-elite)] text-6xl md:text-[6rem] lg:text-[9rem] tracking-widest text-foreground drop-shadow-lg">
            Our Story
          </h1>
          <div className="w-24 h-px bg-accent-light mx-auto mt-6" />
        </div>
      </section>

      <section className="relative px-6 py-24 md:py-32">
        <p className="font-[var(--font-special-elite)] text-2xl md:text-3xl tracking-wider text-white text-center max-w-2xl mx-auto pb-[400px]">
          Our story is still being written...
        </p>
      </section>
    </div>
  );
}

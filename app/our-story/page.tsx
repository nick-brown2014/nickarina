import knBackground from "@/app/assets/kn+background.png";

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-black">
      <section
        className="relative min-h-screen flex items-start justify-center bg-cover bg-center bg-no-repeat pt-[25vh]"
        style={{ backgroundImage: `url('${knBackground.src}')` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-[var(--font-special-elite)] text-6xl md:text-[6rem] lg:text-[9rem] tracking-widest text-foreground drop-shadow-lg">
            Our Story
          </h1>
          <div className="w-24 h-px bg-accent-light mx-auto mt-6" />
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect } from "react";

const boards = [
    {
    title: "\u201CGoth Surrealist Inspo\u201D",
    description:
      "heeheeheeheeheeheeheeheeheheehehheehee",
    url: "https://www.pinterest.com/krackerbarrel/goth-surrealist-inspiration/",
  },
  {
    title: "\u201CI hate themed weddings, don't make me do this\u201D",
    description:
      "No theme required. Black formal attire is all we ask.",
    url: "https://www.pinterest.com/krackerbarrel/i-hate-themed-weddings-dont-make-me-do-this/",
  }
];

export default function ThemePage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.pinterest.com/js/pinit.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black pt-24 pb-16 px-6">
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="font-[var(--font-special-elite)] text-3xl md:text-4xl tracking-wider text-accent-light mt-8 mb-4">
          Theme
        </h1>
        <p className="text-muted leading-relaxed mb-16 max-w-[800px] mx-auto">
          Guests are warmly encouraged (but not required) to interpret the theme through their attire. Our inspiration is Gothic Surrealism - see pinterest board for inspiration (here you combine both themed pinterest boards where there are varying levels of theme)
          The theme is entirely optional; a classic formal black outfit is perfectly appropriate.
        </p>

        <div className="space-y-20">
          {boards.map((board, idx) => (
            <section key={board.title}>
              {idx > 0 && (
                <hr className="border-0 border-t border-accent/40 w-24 mx-auto mb-20" />
              )}
              <h2 className="font-[var(--font-special-elite)] text-2xl tracking-wider text-foreground mb-3">
                {board.title}
              </h2>
              <p className="text-muted mb-8 max-w-xl mx-auto">
                {board.description}
              </p>
              <div className="flex justify-center">
                <a
                  data-pin-do="embedBoard"
                  data-pin-board-width="900"
                  data-pin-scale-height="600"
                  data-pin-scale-width="115"
                  href={board.url}
                >
                  {board.title} Pinterest Board
                </a>
              </div>
            </section>
          ))}
          <h2 className="font-[var(--font-special-elite)] text-2xl tracking-wider text-foreground mb-3">
            Still have questions?
          </h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            For more information on attire or general questions, please reach out to our maid of honor at <a className="text-accent-light hover:opacity-[80%]" href='mailto:helenawernst@gmail.com'>helenawernst@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

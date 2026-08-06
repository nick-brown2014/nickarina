import type { ReactNode } from "react";
import Image from "next/image";
import dellaterra from "@/app/assets/dellaterra.png";
import ragnatela from "@/app/assets/ragnatela.png";
import bat1 from "@/app/assets/bat1.png";

function MapLink({
  query,
  children,
}: {
  query: string;
  children: ReactNode;
}) {
  return (
    <a
      className="text-accent-light hover:opacity-[80%] underline decoration-accent/40 underline-offset-4"
      href={`https://maps.google.com/?q=${encodeURIComponent(query)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

type ScheduleEvent = {
  date: string;
  title: string;
  time: ReactNode;
  location: ReactNode;
  transportation: ReactNode;
  attire: ReactNode;
  description: ReactNode;
};

const schedule: ScheduleEvent[] = [
  {
    date: "Friday, October 30, 2026",
    title: "Costumed Welcome Party",
    time: "6:00 - 9:00 PM",
    location: (
      <>
        <MapLink query="The Bull Pin, 555 S St Vrain Ave, Estes Park, CO 80517">
          The Bull Pin
        </MapLink>
      </>
    ),
    transportation: "Provided (shuttles from the designated hotels)",
    attire: (
      <>
        Halloween costumes Mandatory (No rules)
      </>
    ),
    description: (
      <>
        <span className='text-accent-light'>Description</span>
        <br/>
        Join us for a festive Hallow's Eve soiree with bowling, games, and merriment.
        <br/>
        Food and drink will be provided. 
        <br/>
        <br/>
        But I don't like costumes!
        <br/>
        No problem! Here are some <a className='text-accent-light hover:opacity-[80%]' href='https://lifehacker.com/best-lazy-last-minute-halloween-costumes' target='_blank' rel='noopener noreferrer'>costumes for people who don't like costumes</a>.
      </>
    ),
  },
  {
    date: "Saturday, October 31, 2026",
    title: "Ceremony & Reception",
    time: (<>
      Please arrive no later than 5:00 PM
      <br/>
      Sunset ceremony will begin promptly at 5:30 PM, dinner and dancing to follow.
      </>),
    location: (<>
      <MapLink query="Della Terra Mountain Chateau, 3501 Fall River Rd, Estes Park, CO 80517">
        Della Terra Mountain Chateau
      </MapLink>
      </>
    ),
    transportation: "Provided (shuttles from the designated hotels)",
    attire: (<>Formal attire in strictly the color <span className='font-bold'>BLACK</span>.
    <br/>
      Optional (but encouraged) theme: GOTH SURREALIST.
    </>),
    description: (<>
      For more information on preferred attire, please go to our <a className='text-accent-light hover:opacity-[80%]' href='/theme'>theme page</a>
    </>),
  },
  {
    date: "Sunday, November 1, 2026",
    title: "Farewell Brunch",
    time: "Details to come",
    location: "TBD",
    transportation: "Not provided",
    attire: "Casual",
    description: "It's a farewell brunch! What more do you need to know?.",
  },
];

const roomBlocks = [
  {
    name: "Estes Park Resort",
    href: "https://res.windsurfercrs.com/ibe/details.aspx?propertyid=15912&nights=2&checkin=10/30/2026&group=Ernst&lang=en-us&adults=1&childAges=",
    note: "Lakeside resort minutes from downtown Estes Park.",
  },
  {
    name: "Holiday Inn Estes Park",
    href: "https://www.ihg.com/holidayinn/hotels/us/en/find-hotels/select-roomrate?fromRedirect=true&qSrt=sBR&qIta=99801505&icdv=99801505&qSlH=DENEP&qCiD=30&qCiMy=092026&qCoD=01&qCoMy=102026&qGrpCd=EBW&setPMCookies=true&qSHBrC=HI&qDest=101%20S%20Saint%20Vrain%20Ave,%20Estes%20Park,%20CO,%20US&showApp=true&adjustMonth=false&srb_u=1",
    note: "Conveniently located on Estes Park's main avenue.",
  },
];

export default function DetailsPage() {
  return (
    <div className="relative min-h-screen bg-black pt-24 pb-16 px-6">
      <Image
        src={ragnatela}
        alt=""
        aria-hidden
        priority
        className="pointer-events-none select-none absolute top-16 right-0 w-48 md:w-72 lg:w-96 h-auto opacity-80"
      />
      <div className="relative max-w-4xl mx-auto">

        <nav
          aria-label="Page sections"
          className="sticky top-16 z-40 -mx-6 px-6 py-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 font-[var(--font-special-elite)] text-xs md:text-sm tracking-[0.2em] uppercase bg-black/80 backdrop-blur-sm border-b border-accent/20"
        >
          {[
            { href: "#schedule", label: "Schedule" },
            { href: "#venues", label: "Venues" },
            { href: "#room-blocks", label: "Room Blocks" },
          ].map((link, i, arr) => (
            <span key={link.href} className="flex items-center gap-x-2">
              <a
                href={link.href}
                className="text-accent-light hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
              {i < arr.length - 1 && (
                <span aria-hidden className="h-px w-6 bg-accent/40" />
              )}
            </span>
          ))}
        </nav>

        <div className="flex justify-center mt-8">
          <Image
            src={bat1}
            alt=""
            aria-hidden
            className="w-32 md:w-48 h-auto"
          />
        </div>

        <section id="schedule" className="text-center mt-4 scroll-mt-40">
          <ol className="space-y-12">
            {schedule.map((event, idx) => (
              <li key={event.title}>
                {idx > 0 && (
                  <hr className="border-0 border-t border-accent/40 w-24 mx-auto mb-12" />
                )}
                <p className="font-[var(--font-special-elite)] text-xl tracking-[0.2em] uppercase text-accent-light mb-2">
                  {event.date}
                </p>
                <h3 className="font-[var(--font-special-elite)] text-2xl tracking-wider text-foreground mb-3">
                  {event.title}
                </h3>
                <div className="text-muted space-y-1 mb-6">
                  <p>
                    <span className="text-accent-light">Time:</span> {event.time}
                  </p>
                  <p>
                    <span className="text-accent-light">Location:</span>{" "}
                    {event.location}
                  </p>
                  <p>
                    <span className="text-accent-light">Transportation:</span>{" "}
                    {event.transportation}
                  </p>
                  <p>
                    <span className="text-accent-light">Attire:</span>{" "}
                    {event.attire}
                  </p>
                </div>
                <p className="text-muted leading-relaxed">{event.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <hr className="border-0 border-t border-accent/40 w-full mx-auto my-20" />

        <section id="venues" className="text-center scroll-mt-40">
          <h2 className="font-[var(--font-special-elite)] text-2xl md:text-3xl tracking-wider text-accent-light mb-12">
            Venues
          </h2>
          <div className="relative aspect-[16/9] max-w-3xl mx-auto mb-8 overflow-hidden">
            <Image
              src={dellaterra}
              alt="Della Terra Mountain Chateau"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="font-[var(--font-special-elite)] text-2xl tracking-wider text-foreground mb-4">
            Della Terra Mountain Chateau
          </h3>
          <p className="text-muted mb-6">
            <MapLink query="Della Terra Mountain Chateau, 3501 Fall River Rd, Estes Park, CO 80517">
              3501 Fall River Road
              <br />
              Estes Park, CO 80517
            </MapLink>
          </p>
          <p className="text-muted leading-relaxed mb-8 max-w-xl mx-auto">
            Nestled in the mountains of Colorado, Della Terra provides a
            breathtaking backdrop for the ceremony and reception on All
            Hallows&apos; Eve.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://maps.google.com/?q=Della+Terra+Mountain+Chateau+Estes+Park+CO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-6 py-3 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
            >
              Directions
            </a>
          </div>

          <h3 className="font-[var(--font-special-elite)] mt-24 text-2xl tracking-wider text-foreground mb-4">
            The Bull Pin
          </h3>
          <p className="text-muted mb-6">
            <MapLink query="The Bull Pin, 555 S St Vrain Ave, Estes Park, CO 80517">
              555 S St Vrain Ave
              <br />
              Estes Park, CO 80517
            </MapLink>
          </p>
          <p className="text-muted leading-relaxed mb-8 max-w-xl mx-auto">
            Join us in your Halloween costume for a fun and relaxed gathering
            at The Bull Pin in Estes Park, CO. Food and drinks will be provided,
            alongside bowling, games, s&apos;mores, and other assorted mischeif.
          </p>
          <a
            href="https://maps.google.com/?q=The+Bull+Pin+Estes+Park+CO"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-6 py-3 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
          >
            Directions
          </a>
        </section>

        <hr className="border-0 border-t border-accent/40 w-full mx-auto my-20" />

        <section id="room-blocks" className="text-center scroll-mt-40">
          <h2 className="font-[var(--font-special-elite)] text-2xl md:text-3xl tracking-wider text-accent-light mb-4">
            Room Blocks
          </h2>
          <p className="text-muted mb-12 max-w-xl mx-auto">
            We&apos;ve reserved blocks of rooms at the following hotels.
            If you prefer, AirBnB and other hotels are available in the area as well.
          </p>
          <div className="space-y-10">
            {roomBlocks.map((hotel, idx) => (
              <div key={hotel.name}>
                {idx > 0 && (
                  <hr className="border-0 border-t border-accent/40 w-24 mx-auto mb-10" />
                )}
                <h3 className="font-[var(--font-special-elite)] text-xl tracking-wider text-foreground mb-3">
                  {hotel.name}
                </h3>
                <p className="text-muted mb-6">{hotel.note}</p>
                <a
                  href={hotel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-[var(--font-special-elite)] text-sm tracking-[0.2em] uppercase px-6 py-3 border border-accent-light text-accent-light hover:bg-accent-light hover:text-background transition-all duration-300"
                >
                  Reserve
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

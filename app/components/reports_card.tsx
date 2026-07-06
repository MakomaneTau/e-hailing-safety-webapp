import { Car, Calendar, User, CalendarClock, ImageOff } from "lucide-react";

export default function Report_Card() {
  return (
    <main className="w-full max-w-2xl mb-10 mx-auto rounded-2xl border border-neutral-900 shadow-[6px_6px_0_0_#1A1A18] relative overflow-hidden">
      <div className="flex items-stretch">
        {/* image */}
        <div className="w-36 shrink-0 border-r border-dashed border-neutral-400 flex items-center justify-center bg-neutral-200/60 aspect-square">
          <div className="flex flex-col items-center gap-1 text-neutral-400">
            <ImageOff size={22} strokeWidth={1.5} />
            <span className="text-[9px] font-mono uppercase tracking-widest">
              No photo
            </span>
          </div>
        </div>

        {/* details */}
        <div className="flex-1 px-6 py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h1 className="font-serif text-xl text-neutral-900 leading-tight">
              John Doe
            </h1>
            <span>Platform</span>
          </div>

          <div className="p-3 border rounded-2xl border-gray-500 my-4">
            <h3 className="text-lg font-semibold mb-1">Assault</h3>
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit.
              Asperiores ipsam inventore animi doloribus perspiciatis adipisci,
              iste unde culpa ea molestias placeat libero impedit vero, est quis
              magni nisi? Sint, suscipit!
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-300 pt-3">
            <div>
              <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-0.5">
                <User size={11} /> Province
              </dt>
              <dd className="text-sm text-neutral-900">Gauteng</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-0.5">
                <Car size={11} /> Car model
              </dt>
              <dd className="text-sm text-neutral-900">Blue Green Car 2025</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-0.5">
                <Calendar size={11} /> Date reported
              </dt>
              <dd className="text-sm text-neutral-900 font-mono">01/01/2025</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-0.5">
                <CalendarClock size={11} /> Date of offense
              </dt>
              <dd className="text-sm text-neutral-900 font-mono">01/01/2025</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}

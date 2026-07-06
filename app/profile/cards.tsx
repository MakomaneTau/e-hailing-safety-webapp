export default function Cards() {
  return (
    <main className="grid grid-cols-4 gap-x-2 border-y border-neutral-300 mx-2 py-2 px-4">
      <div className="flex items-center gap-1.5">
        <label className="font-semibold">Name: </label>
        <span className="">John Doe</span>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="font-semibold">Car:</label>
        <span className="">Toyota Camry</span>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="font-semibold">Offense:</label>
        <span className="">Speeding</span>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="font-semibold">Date Reported:</label>
        <span className="">01/01/2025</span>
      </div>
    </main>
  );
}

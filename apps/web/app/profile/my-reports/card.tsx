export default function Cards() {
  return (
    <main className="grid grid-cols-4 gap-x-2 border-y border-neutral-300 mx-2 py-6 px-4">
      {" "}
      {/*Darker shade if odd, lighter if even */}
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
      <div className="flex flex-col col-span-4 w-full gap-1.5 mt-8">
        <label className="font-semibold">Details of incident:</label>
        <span className="">
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Earum cumque
          velit quos alias provident odit dolores ullam amet facere quaerat
          expedita consequatur, laudantium facilis laboriosam, hic qui aut,
          adipisci quo!
        </span>
      </div>
    </main>
  );
}

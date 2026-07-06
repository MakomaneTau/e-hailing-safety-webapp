import Navbar from "@/app/components/navbar";
import Card from "./card";

export default function MyReportsPage() {
  return (
    <main className="flex-col w-full bg-gray-100">
      <div className="w-full flex">
        <Navbar />
      </div>

      <div className="flex flex-col bg-white w-1/2 rounded-2xl shadow-2xl items-center justify-center my-10 mx-auto">
        <h2 className="text-3xl font-bold text-blue-400 mt-8 mb-2">
          Your Reports in Detail
        </h2>
        <div className="border-2 w-10 border-blue-400 inline-block mb-8"></div>
        <Card />
        <Card />
        <Card />
        <Card />
      </div>
    </main>
  );
}

'use client';

import { useRouter } from "next/navigation";

import Card from "../components/file_report_card";
import Navbar from "../components/navbar";

export default function Report() {
  return (
    <main className="flex-col w-full bg-gray-100">
        <div className="w-full flex">
          <Navbar />
        </div>
      <Card />
    </main>
  );
}

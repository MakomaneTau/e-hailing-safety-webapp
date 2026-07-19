'use client';

import Navbar from "../components/navbar";
import Report_Card from "../components/reports_card";
import { AuthGuard } from "../components/AuthGuard";

export default function Reports() {
  return (
    <AuthGuard>
      <main className="bg-gray-100">
        <div className="w-full flex">
          <Navbar />
        </div>
        <div className="my-10 grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          <Report_Card />
          <Report_Card />
          <Report_Card />
          <Report_Card />
          <Report_Card />
        </div>
      </main>
    </AuthGuard>
  );
}

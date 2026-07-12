"use client";


import React from "react";
import Navbar from "../components/navbar";
import Report_Card from "../components/reports_card";
import Card from "../components/file_report_card";
import dashboardbackground from "../../public/dashboard_background.jpg";

export default function Dashboard() {
  return (
    <main className="flex-col w-full bg-gray-100">
      <div>
        <div className="relative h-[60vh] w-full">
          <img
            src={dashboardbackground.src}
            alt="Dashboard Background"
            className="w-full h-full object-cover"
          />

          <div className="absolute justify-center items-center top-0 left-0 w-full h-full flex flex-col text-white mt-10">
            <h2 className="text-5xl font-bold">Ride with more confidence</h2>

            <p className="text-xl mt-4">
              Report unsafe trips and learn from local rider experiences.
            </p>

            <a
              href="#"
              className="mt-4 inline-block rounded-3xl border-2 border-blue-400 bg-blue-400 px-12 py-2 font-semibold text-white transition-all duration-300 ease-in-out hover:bg-transparent hover:text-white"
            >
              Get Started
            </a>
          </div>
        </div>

        <div className="absolute top-0 w-full flex">
          <Navbar />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-white shadow-2xl rounded-2xl w-1/2 max-w-4xl p-8 mx-auto ">
        <h2 className="text-3xl font-bold text-black text-center mb-8">
          Latest rider reports
        </h2>

        <Report_Card/>
      </div>

      <div>
        <Card/>
      </div>
    </main>
  );
}

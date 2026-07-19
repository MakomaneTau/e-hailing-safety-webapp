"use client";

import Navbar from "@/app/components/navbar";
import Cards from "./cards";
import { AuthGuard } from "../components/AuthGuard";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <main className="flex-col w-full bg-gray-100">
        <div className="w-full flex">
          <Navbar />
        </div>
        <div className="flex flex-col items-center justify-center bg-white shadow-2xl rounded-2xl w-1/2 max-w-4xl p-8 mx-auto my-8">
          <h1 className="text-3xl font-bold mb-2 text-blue-400">Profile</h1>
          <div className="border-2 w-10 border-blue-400 inline-block mb-8"></div>

          <div className="flex flex-col items-center mb-8">
            <label className="text-lg font-semibold mb-2">Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="bg-gray-100 rounded-2xl outline-none text-xl flex-1 p-4"
            />
          </div>

          <div className="flex flex-col items-center mb-8">
            <label className="text-lg font-semibold mb-2">Email:</label>
            <input
              type="text"
              name="email"
              placeholder="Email"
              className="bg-gray-100 rounded-2xl outline-none text-xl flex-1 p-4"
            />
          </div>

          <button>
            <span className="bg-blue-400 text-white rounded-full px-6 py-3 font-semibold hover:bg-transparent hover:text-blue-400 hover:border-blue-400 hover:border-2 transition-all duration-300 ease-in-out">
              Edit Profile
            </span>
          </button>
        </div>

        <div className="flex flex-col bg-white rounded-2xl items-center justify-center my-10 shadow-2xl w-1/2 mx-auto">
          <h2 className="text-3xl font-bold text-blue-400 mt-8 mb-2">
            Your Reports
          </h2>
          <div className="border-2 w-10 border-blue-400 inline-block"></div>

          <div className="flex flex-col items-center mt-8">
            {/* Dynamic content for reports */}
            <div className="flex w-full justify-start pl-4 gap-1.5 mb-4 text-gray-400">
              <label>Total Reports:</label>
              <span>1</span>
            </div>

            <Cards />
            <Cards />
            <Cards />
          </div>

          <p className="text-lg font-semibold mt-8">
            Click here to view your reports
          </p>

          <a href="/profile/my-reports" className="my-8">
            <span className=" rounded-full bg-blue-400 text-white px-6 py-3 font-semibold hover:bg-transparent hover:text-blue-400 hover:border-blue-400 hover:border-2 transition-all duration-300 ease-in-out">
              View reports
            </span>
          </a>
        </div>
      </main>
    </AuthGuard>
  );
}

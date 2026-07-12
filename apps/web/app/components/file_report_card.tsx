"use client";

import { useState } from "react";
import { IoIosAdd } from "react-icons/io";
import {
  Car,
  Calendar,
  MapPin,
  AlertTriangle,
  FileText,
  User,
} from "lucide-react";

const fieldBase =
  "w-full bg-transparent border-0 border-b border-neutral-300 focus:border-blue-400 outline-none py-2 text-sm text-black placeholder:text-neutral-400 transition-colors";

const labelBase =
  "flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-1";

const ISSUE_TYPES = [
  { value: "driver_behaviour", label: "Driver behaviour" },
  { value: "safety_concerns", label: "Safety concerns" },
  { value: "route_deviation", label: "Route deviation" },
  { value: "vehicle_condition", label: "Vehicle condition" },
  { value: "other", label: "Other" },
];

export default function Card() {
  const [fileName, setFileName] = useState("");
  const [issueTypes, setIssueTypes] = useState<string[]>([]);

  const toggleIssueType = (value: string) => {
    setIssueTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  return (
    <main className="flex flex-col items-center justify-center bg-white shadow-2xl rounded-2xl w-1/2 max-w-4xl p-8 mx-auto my-8">
      {/* header strip, matches report card */}
      <div className="flex items-center gap-2 text-blue-400 px-6 py-2">
        <h2 className="text-2xl tracking-[0.35em] uppercase">
          Incident Report
        </h2>
        <span className="ml-auto text-lg opacity-60">New submission</span>
      </div>

      <div className="px-8 py-8">
        <h2 className="font-serif text-2xl text-black mb-1">Submit a report</h2>
        <p className="text-xs font-mono text-neutral-500 uppercase tracking-wide mb-6">
          After an unsafe trip
        </p>

        <div className="border-t border-dashed border-neutral-400 pt-5 mb-6">
          <p className="text-sm text-neutral-700 mb-4">
            Note the following details to report effectively:
          </p>
          <ul className="space-y-3 mb-4">
            <li className="flex gap-3 text-sm">
              <MapPin size={15} className="mt-0.5 shrink-0 text-blue-400" />
              <span>
                <span className="font-semibold text-black">Location — </span>
                <span className="text-neutral-600">
                  exact place the incident occurred
                </span>
              </span>
            </li>
            <li className="flex gap-3 text-sm">
              <AlertTriangle
                size={15}
                className="mt-0.5 shrink-0 text-blue-400"
              />
              <span>
                <span className="font-semibold text-black">Issue type — </span>
                <span className="text-neutral-600">
                  nature of the problem, e.g. driver behaviour, safety
                </span>
              </span>
            </li>
            <li className="flex gap-3 text-sm">
              <FileText size={15} className="mt-0.5 shrink-0 text-blue-400" />
              <span>
                <span className="font-semibold text-black">
                  What happened —{" "}
                </span>
                <span className="text-neutral-600">
                  brief description with key facts
                </span>
              </span>
            </li>
          </ul>
          <p className="text-sm text-neutral-700">
            This practical guide helps ensure your report is clear and expresses
            your experience accurately.
          </p>
        </div>

        <form className="space-y-5">
          <label className="flex items-center justify-between gap-2 rounded-none border-2 border-dashed border-neutral-400 hover:border-blue-400 px-5 py-3 cursor-pointer transition-colors group">
            <span className="text-sm font-medium text-neutral-700 group-hover:text-blue-400">
              {fileName || "Upload screenshot of ride"}
            </span>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black text-white group-hover:bg-blue-400 transition-colors">
              <IoIosAdd size={16} />
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
          </label>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
            <span className="flex-1 h-px bg-neutral-300" />
            or fill in the details below
            <span className="flex-1 h-px bg-neutral-300" />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelBase}>
                <User size={11} /> Driver&apos;s name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Full name"
                className={fieldBase}
              />
            </div>
            <div>
              <label className={labelBase}>
                <Calendar size={11} /> Date of incident
              </label>
              <input type="date" name="date" className={fieldBase} />
            </div>
            <div>
              <label className={labelBase}>
                <MapPin size={11} /> Location
              </label>
              <input
                type="text"
                name="location"
                placeholder="Where it happened"
                className={fieldBase}
              />
            </div>
            <div>
              <label className={labelBase}>
                <Car size={11} /> Car model
              </label>
              <input
                type="text"
                name="car_model"
                placeholder="Model, year & colour"
                className={fieldBase}
              />
            </div>
          </div>

          <div>
            <label className={labelBase}>
              <AlertTriangle size={11} /> Issue type
              <span className="normal-case tracking-normal text-neutral-400">
                (select all that apply)
              </span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {ISSUE_TYPES.map(({ value, label }) => {
                const active = issueTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleIssueType(value)}
                    aria-pressed={active}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-blue-400 bg-blue-400 text-white"
                        : "border-neutral-300 bg-transparent text-neutral-600 hover:border-blue-400 hover:text-blue-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* keeps the selection submittable with a plain <form> */}
            <input
              type="hidden"
              name="issue_type"
              value={issueTypes.join(",")}
            />
          </div>

          <div>
            <label className={labelBase}>
              <FileText size={11} /> What happened
            </label>
            <textarea
              name="incident_description"
              placeholder="Describe the incident in detail"
              rows={4}
              className={`${fieldBase} resize-none`}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 rounded-full border-2 border-black bg-black px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 ease-in-out hover:bg-blue-400 hover:border-blue-400"
          >
            Submit report
          </button>
        </form>
      </div>
    </main>
  );
}

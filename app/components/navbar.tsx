import { IoExitOutline } from "react-icons/io5";

export default function Navbar() {
  return (
    <nav className="w-full mt-4 mx-5 flex items-center justify-between text-gray-400">
      <div className="text-left font-bold text-2xl text-gray-400">
        <span className="">Your Company</span>
      </div>
      <ul className="bg-white p-4 flex list-none items-center gap-2 rounded-3xl text-lg sm:gap-4 px-4">
        <li>
          <a
            href="/dashboard"
            className="rounded-2xl bg-blue-400 px-3 py-4 text-white transition-colors hover:bg-blue-500"
          >
            Dashboard
          </a>
        </li>
        <li>
          <a
            href="/reports"
            className="rounded-2xl px-3 py-4 transition-colors hover:bg-blue-400 hover:text-white"
          >
            Reports
          </a>
        </li>
        <li>
          <a
            href="/file-report"
            className="rounded-2xl px-3 py-4  transition-colors hover:bg-blue-400 hover:text-white"
          >
            File Report
          </a>
        </li>
        <li>
          <a
            href="/profile"
            className="rounded-2xl px-3 py-4 transition-colors hover:bg-blue-400 hover:text-white"
          >
            Profile
          </a>
        </li>
        <li>
          <a
            href="/logout"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-600 hover:text-white"
          >
            <IoExitOutline className="text-2xl" />
          </a>
        </li>
      </ul>
    </nav>
  );
}

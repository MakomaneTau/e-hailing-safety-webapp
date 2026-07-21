"use client";

import { useState, type FormEvent } from "react";
import { signup } from "../lib/auth/api";

import { CiUser } from "react-icons/ci";
import {
  FaFacebook,
  FaGoogle,
  FaLinkedin,
  FaRegEnvelope,
} from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";

export default function Signup() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password,
      });

      window.location.href = "/dashboard";
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create account",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center w-full px-20 text-center">
      <div className="bg-white rounded-2xl shadow-2xl flex items-center justify-center w-2/3 max-w-4xl p-8">
        <div className="w-3/5 p-5">
          <div className="text-left font-bold">
            <span className="text-blue-400">Your</span> Company
          </div>

          <div className="py-10">
            <h2 className="text-3xl font-bold text-blue-400 mb-2">
              Create Account
            </h2>

            <div className="border-2 w-10 border-blue-400 inline-block mb-2"></div>

            <div className="flex justify-center my-2">
              <a
                href="#"
                className="border-2 border-gray-200 rounded-full p-3 mx-1 hover:bg-blue-400 hover:text-white"
              >
                <FaFacebook className="text-sm" />
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/google/start`}
                className="border-2 border-gray-200 rounded-full p-3 mx-1 hover:bg-blue-400 hover:text-white"
                title="Sign up with Google"
              >
                <FaGoogle className="text-sm" />
              </a>
              <a
                href="#"
                className="border-2 border-gray-200 rounded-full p-3 mx-1 hover:bg-blue-400 hover:text-white"
              >
                <FaLinkedin className="text-sm" />
              </a>
            </div>

            <p className="mb-5">
              Please fill in this form to create an account!
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center"
            >
              <div className="bg-gray-100 w-64 p-2 flex items-center mb-3">
                <CiUser className="text-gray-400 m-2" />
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="bg-gray-100 outline-none text-sm flex-1"
                />
              </div>

              <div className="bg-gray-100 w-64 p-2 flex items-center mb-3">
                <FaRegEnvelope className="text-gray-400 m-2" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="bg-gray-100 outline-none text-sm flex-1"
                />
              </div>

              <div className="bg-gray-100 w-64 p-2 flex items-center mb-3">
                <MdLockOutline className="text-gray-400 m-2" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="bg-gray-100 outline-none text-sm flex-1"
                />
              </div>

              <div className="bg-gray-100 w-64 p-2 flex items-center mb-3">
                <MdLockOutline className="text-gray-400 m-2" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="bg-gray-100 outline-none text-sm flex-1"
                />
              </div>

              <div className="flex justify-between w-64 mb-5">
                <a href="#" className="text-xs">
                  Forgot Password?
                </a>
              </div>

              {error && (
                <p className="mb-3 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="border-2 border-blue-400 text-blue-400 rounded-full px-12 py-2 inline-block font-semibold hover:bg-blue-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

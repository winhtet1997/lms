'use client'
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Dashboard = () => {
  const loginAdmin = useAuthStore((state) => state.loginSuperAdmin);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginAdmin(username, password);
      toast.success("Login successful!");
      router.push("/dashboard/home");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
 
  

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          <form onSubmit={handleLoginSubmit}>
            <h1 className="text-2xl font-semibold text-center text-black my-2">
              Super Admin
            </h1>
            <p className="text-center text-sm text-gray-500">
              Welcome to the Dashboard!
            </p>

            <div className="form-control my-3">
              <span className="label-text font-medium text-black">Username or Email</span>
              <label className="input w-full">
                <User size={16} color="#737373" />
                <input
                  type="text"
                  required
                  placeholder="Enter username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
            </div>

            <div className="form-control my-3">
              <span className="label-text font-medium text-black">Password</span>
              <label className="input w-full">
                <Lock size={16} color="#737373" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </label>
            </div>
            {
              error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )
            }
            <button
              type="submit"
              disabled={loading}
              className="btn bg-[#0052b4] w-full text-white rounded-lg shadow-none my-3"
            >
              {loading ? <span className="loading loading-spinner loading-xs" /> : "Login"}
            </button>

            <div className="text-center">
              <Link href="/" className="text-[#0052b4] text-sm">
                ← Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

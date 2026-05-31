"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().min(1, "Name is required").max(80),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Must be at least 8 characters"),
    confirm: z.string(),
    workspaceName: z.string().min(1, "Workspace name is required").max(80),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          workspaceName: values.workspaceName,
          workspaceSlug: slugify(values.workspaceName),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Registration failed");
      }

      await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-sm text-neutral-400">Start your AEC Digital Twin workspace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(
            [
              { id: "name", label: "Name", type: "text", placeholder: "Jane Smith" },
              { id: "email", label: "Email", type: "email", placeholder: "jane@example.com" },
              { id: "workspaceName", label: "Workspace name", type: "text", placeholder: "Acme Engineering" },
              { id: "password", label: "Password", type: "password", placeholder: "••••••••" },
              { id: "confirm", label: "Confirm password", type: "password", placeholder: "••••••••" },
            ] as const
          ).map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                {...register(field.id)}
              />
              {errors[field.id] && (
                <p className="text-xs text-red-400">{errors[field.id]?.message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 transition-colors"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

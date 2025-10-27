"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type ClassRecord = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  day_of_week: string | null;
  time: string | null;
  category: string | null;
  image_urls: string[] | null;
};

const schema = z.object({
  name: z.string().min(2, "Class name is required"),
  description: z.string().min(10, "Description required"),
  price: z.string().optional(),
  day_of_week: z.string().optional(),
  time: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  name: "",
  description: "",
  price: "",
  day_of_week: "",
  time: "",
  category: "",
};

export default function ProviderClasses() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getSupabaseBrowserClient();
  }, []);

  const [userId, setUserId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const formResolver = zodResolver(schema) as Resolver<FormValues>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: formResolver, defaultValues: emptyForm });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    async function init() {
      const client = supabase;
      if (!client) return;
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        router.push("/provider/login");
        return;
      }
      if (!cancelled) {
        setUserId(user.id);
        await fetchClasses(user.id);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  const fetchClasses = async (providerId: string) => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    const { data, error } = await client
      .from("classes")
      .select("*")
      .eq("providerId", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchClasses", error);
      setServerError("Unable to load classes.");
      setClasses([]);
    } else {
      setClasses((data as ClassRecord[]) ?? []);
      setServerError(null);
    }
    setLoading(false);
  };

  const resetForm = () => {
    reset(emptyForm);
    setEditing(null);
    setImageUrl(null);
  };

  const onSubmit = async (values: FormValues) => {
    if (!userId || !supabase) return;
    setSubmitting(true);
    setServerError(null);

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      price: values.price?.trim() || null,
      day_of_week: values.day_of_week?.trim() || null,
      time: values.time?.trim() || null,
      category: values.category?.trim() || null,
      providerId: userId,
      image_urls: imageUrl ? [imageUrl] : (editing?.image_urls ?? []),
    };

    const client = supabase;
    if (!client) {
      setSubmitting(false);
      return;
    }

    if (editing) {
      const { error } = await client.from("classes").update(payload).eq("id", editing.id);
      if (error) {
        console.error("update class", error);
        setServerError(error.message ?? "Unable to update class.");
      }
    } else {
      const { error } = await client.from("classes").insert([payload]);
      if (error) {
        console.error("insert class", error);
        setServerError(error.message ?? "Unable to add class.");
      }
    }

    setSubmitting(false);
    resetForm();
    await fetchClasses(userId);
  };

  const handleEdit = (cls: ClassRecord) => {
    setEditing(cls);
    reset({
      name: cls.name ?? "",
      description: cls.description ?? "",
      price: cls.price ?? "",
      day_of_week: cls.day_of_week ?? "",
      time: cls.time ?? "",
      category: cls.category ?? "",
    });
    setImageUrl(cls.image_urls?.[0] ?? null);
  };

  const handleDelete = async (id: number) => {
    if (!userId || !supabase) return;
    const client = supabase;
    if (!client) return;
    const { error } = await client.from("classes").delete().eq("id", id).eq("providerId", userId);
    if (error) {
      console.error("delete class", error);
      setServerError(error.message ?? "Unable to delete class.");
      return;
    }
    await fetchClasses(userId);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !supabase) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const extension = file.name.split(".").pop();
      const filePath = `class-images/${userId}-${Date.now()}.${extension}`;
      const client = supabase;
      if (!client) throw new Error("Supabase client unavailable");
      const { error } = await client.storage.from("public").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (error) throw error;
      const { data } = client.storage.from("public").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (uploadError) {
      console.error("upload image", uploadError);
      setServerError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-brand-textMuted">
        <Loader2 className="h-5 w-5 animate-spin" /> Checking authentication…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-brand-teal">Manage Your Classes</h1>
        {editing ? (
          <Button
            variant="outline"
            onClick={resetForm}
            className="border-brand-coral text-brand-coral hover:bg-brand-coral/10"
          >
            Cancel edit
          </Button>
        ) : null}
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-teal">
            {editing ? "Edit Class" : "Add New Class"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" autoComplete="off">
            <div>
              <Input placeholder="Class name" {...register("name")} />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <Textarea placeholder="Description" rows={3} {...register("description")} />
              {errors.description ? (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Day (e.g. Monday)" {...register("day_of_week")} />
              <Input placeholder="Time (e.g. 10:00am)" {...register("time")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Price" {...register("price")} />
              <Input placeholder="Category" {...register("category")} />
            </div>
            <div className="flex items-center gap-4">
              <input
                id="class-image"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              <label
                htmlFor="class-image"
                className="flex cursor-pointer items-center gap-2 text-brand-teal transition hover:text-brand-coral"
              >
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload image"}
              </label>
              {imageUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-md border border-brand-sage/60">
                  <Image src={imageUrl} alt="Class preview" fill className="object-cover" />
                </div>
              ) : null}
            </div>
            {serverError ? <p className="text-sm text-red-500">{serverError}</p> : null}
            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 w-fit bg-brand-teal text-white transition hover:bg-brand-coral"
            >
              {submitting ? "Saving…" : editing ? "Update Class" : "Add Class"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold text-brand-teal">Your classes</h2>
        {loading ? (
          <div className="mt-3 flex items-center gap-2 text-brand-textMuted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading classes…
          </div>
        ) : classes.length === 0 ? (
          <p className="mt-3 text-sm text-brand-textMuted">
            No classes yet. Add your first class above.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            <AnimatePresence initial={false}>
              {classes.map((cls) => (
                <motion.div
                  key={cls.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="flex items-center justify-between rounded-lg border border-brand-sage/60 bg-brand-cream/70 p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {cls.image_urls?.[0] ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border border-brand-sage/60">
                        <Image
                          src={cls.image_urls[0]}
                          alt={cls.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div>
                      <h3 className="text-lg font-semibold text-brand-teal">{cls.name}</h3>
                      <p className="text-sm text-brand-textMuted">{cls.description}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-brand-textMuted">
                        {cls.day_of_week ? <span>{cls.day_of_week}</span> : null}
                        {cls.time ? <span>{cls.time}</span> : null}
                        {cls.price ? <span>£{cls.price}</span> : null}
                        {cls.category ? <span>{cls.category}</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(cls)}
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(cls.id)}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

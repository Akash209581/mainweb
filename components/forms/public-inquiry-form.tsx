"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/buttons/button";
import { submitContactAction } from "@/actions/contact.actions";

const inquirySchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  category: z.enum(["delegate", "author", "sponsor", "committee"]),
  message: z.string().min(12, "Add a little more detail")
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export function PublicInquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      category: "delegate"
    }
  });

  const onSubmit = async (data: InquiryFormValues) => {
    setServerError(null);
    setSubmitted(false);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("category", data.category);
      formData.append("message", data.message);

      const res = await submitContactAction({ ok: false, message: "" }, formData);
      if (res.ok) {
        setSubmitted(true);
        reset();
      } else {
        setServerError(res.message);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again later.";
      setServerError(errMsg);
    }
  };

  return (
    <form
      className="glass-panel grid gap-5 rounded-lg p-6 border-border/30 bg-surface/30"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {submitted && (
        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle className="size-4 shrink-0" />
          <span>Your message has been successfully submitted to the ICGIT Secretariat.</span>
        </div>
      )}

      {serverError && (
        <div className="flex items-center gap-2 rounded-md border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid gap-2">
        <label htmlFor="name" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Full Name
        </label>
        <input
          id="name"
          className="focus-ring rounded-lg border border-border/45 bg-surface/75 px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition duration-200"
          placeholder="Enter your name"
          {...register("name")}
        />
        {errors.name ? <p className="text-xs text-danger font-medium">{errors.name.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          className="focus-ring rounded-lg border border-border/45 bg-surface/75 px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition duration-200"
          placeholder="name@example.com"
          {...register("email")}
        />
        {errors.email ? <p className="text-xs text-danger font-medium">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="category" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Inquiry Type
        </label>
        <select
          id="category"
          className="focus-ring rounded-lg border border-border/45 bg-surface/75 px-4 py-2.5 text-sm text-foreground"
          {...register("category")}
        >
          <option value="delegate">Delegate</option>
          <option value="author">Author</option>
          <option value="sponsor">Sponsor</option>
          <option value="committee">Committee</option>
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="message" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className="focus-ring resize-none rounded-lg border border-border/45 bg-surface/75 px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition duration-200"
          placeholder="How can the organizing team help?"
          {...register("message")}
        />
        {errors.message ? <p className="text-xs text-danger font-medium">{errors.message.message}</p> : null}
      </div>

      <Button type="submit" isLoading={isSubmitting} className="hover-lift justify-center mt-2">
        <Send className="size-4 mr-2" aria-hidden="true" />
        Submit Inquiry
      </Button>
    </form>
  );
}

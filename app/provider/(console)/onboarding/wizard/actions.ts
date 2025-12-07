"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembershipForUser } from "@/app/provider/_lib/membership";
import type { OnboardingFormState } from "../_lib/types";
import {
  getOnboardingState,
  saveStepData,
  markStepComplete,
  updateCurrentStep,
  type WizardStepId,
} from "@/lib/provider/onboarding";
import { z } from "zod";
import { WIZARD_STEPS as WIZARD_STEPS_FROM_LIB } from "@/lib/provider/onboarding";

// Re-export WIZARD_STEPS for use in components
export const WIZARD_STEPS = WIZARD_STEPS_FROM_LIB;

// Validation schemas for each step
export const step1AccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});

export const step2BusinessSchema = z.object({
  providerName: z.string().min(1, "Provider name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  town: z.string().min(1, "Town is required"),
  county: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required"),
  category: z.string().optional(),
});

export const step3ClassSchema = z.object({
  className: z.string().min(1, "Class name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  ageGroupMin: z.coerce.number().min(0).max(216),
  ageGroupMax: z.coerce.number().min(0).max(216),
  category: z.string().min(1, "Category is required"),
  venue: z.string().min(1, "Venue is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  time: z.string().min(1, "Time is required"),
  price: z.string().optional(),
});

export const step4MediaSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  imageUrls: z.array(z.string().url()).optional(),
});

/**
 * Get saved data for a specific step (re-exported from helper)
 */
export async function getSavedStepData(providerId: number, stepId: WizardStepId) {
  const state = await getOnboardingState(providerId);
  return state.savedData[stepId] || null;
}

/**
 * Get current wizard step for provider (re-exported from helper)
 */
export async function getCurrentWizardStep(providerId: number): Promise<WizardStepId> {
  const state = await getOnboardingState(providerId);
  return state.currentStep || "step-1-account";
}

/**
 * Save Step 1: Account & Contact
 * 
 * Updates provider name, email, phone
 * Saves step data and advances to step-2-business
 */
export async function saveStep1Account(
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", nextStep: null };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership?.providers) {
    return { success: false, error: "No provider membership found", nextStep: null };
  }

  const providerId = membership.provider_id;

  // Parse and validate
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
  };

  let validated;
  try {
    validated = step1AccountSchema.parse(rawData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed", nextStep: null };
    }
    return { success: false, error: "Validation failed", nextStep: null };
  }

  // Update provider record
  const { error: providerError } = await supabase
    .from("providers")
    .update({
      name: validated.name,
      contact_email: validated.email,
      contact_phone: validated.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", providerId);

  if (providerError) {
    return { success: false, error: providerError.message, nextStep: null };
  }

  // Save step data
  const saveResult = await saveStepData(providerId, "step-1-account", validated);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error || "Failed to save step data", nextStep: null };
  }

  // Mark step complete and advance
  const completeResult = await markStepComplete(providerId, "step-1-account");
  if (!completeResult.success) {
    return { success: false, error: completeResult.error || "Failed to advance step", nextStep: null };
  }

  revalidatePath("/provider/onboarding");
  
  if (completeResult.nextStep) {
    redirect(`/provider/onboarding/wizard/${completeResult.nextStep}`);
  }

  return { success: true, error: null, nextStep: "step-2-business" };
}

/**
 * Save Step 2: Business Basics
 * 
 * Updates provider address fields
 * Auto-geocodes if coordinates missing (future enhancement)
 * Saves step data and advances to step-3-class
 */
export async function saveStep2Business(
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", nextStep: null };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership?.providers) {
    return { success: false, error: "No provider membership found", nextStep: null };
  }

  const providerId = membership.provider_id;

  // Parse and validate
  const rawData = {
    providerName: formData.get("providerName") as string,
    addressLine1: formData.get("addressLine1") as string,
    addressLine2: formData.get("addressLine2") as string,
    town: formData.get("town") as string,
    county: formData.get("county") as string,
    postcode: formData.get("postcode") as string,
    category: formData.get("category") as string,
  };

  let validated;
  try {
    validated = step2BusinessSchema.parse(rawData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed", nextStep: null };
    }
    return { success: false, error: "Validation failed", nextStep: null };
  }

  // Get existing metadata first
  const { data: existingProvider } = await supabase
    .from("providers")
    .select("metadata, latitude, longitude")
    .eq("id", providerId)
    .single();

  const existingMetadata = (existingProvider?.metadata as Record<string, unknown>) || {};
  const newMetadata = validated.category
    ? { ...existingMetadata, category: validated.category }
    : existingMetadata;

  // Auto-geocode if coordinates missing (future: use Google Places API or similar)
  // For now, we'll leave lat/lng as null if not already set
  // TODO: Add geocoding utility when available

  // Update provider record
  const updateData: {
    name: string;
    address_line1: string;
    address_line2: string | null;
    town: string;
    county: string | null;
    postcode: string;
    metadata: Record<string, unknown>;
    updated_at: string;
    latitude?: number | null;
    longitude?: number | null;
  } = {
    name: validated.providerName,
    address_line1: validated.addressLine1,
    address_line2: validated.addressLine2 || null,
    town: validated.town,
    county: validated.county || null,
    postcode: validated.postcode,
    metadata: newMetadata,
    updated_at: new Date().toISOString(),
  };

  // Only update lat/lng if they're missing (preserve existing geocoded data)
  if (!existingProvider?.latitude || !existingProvider?.longitude) {
    // Leave as null for now - can be geocoded later
    // updateData.latitude = null;
    // updateData.longitude = null;
  }

  const { error: providerError } = await supabase
    .from("providers")
    .update(updateData)
    .eq("id", providerId);

  if (providerError) {
    return { success: false, error: providerError.message, nextStep: null };
  }

  // Save step data
  const saveResult = await saveStepData(providerId, "step-2-business", validated);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error || "Failed to save step data", nextStep: null };
  }

  // Mark step complete and advance
  const completeResult = await markStepComplete(providerId, "step-2-business");
  if (!completeResult.success) {
    return { success: false, error: completeResult.error || "Failed to advance step", nextStep: null };
  }

  revalidatePath("/provider/onboarding");

  if (completeResult.nextStep) {
    redirect(`/provider/onboarding/wizard/${completeResult.nextStep}`);
  }

  return { success: true, error: null, nextStep: completeResult.nextStep || null };
}

/**
 * Save Step 3: Class Template
 * 
 * Creates or updates a draft class
 * Maps to existing classes schema
 * Saves step data and advances to step-4-media
 */
export async function saveStep3ClassTemplate(
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", nextStep: null };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership?.providers) {
    return { success: false, error: "No provider membership found", nextStep: null };
  }

  const providerId = membership.provider_id;

  // Parse and validate
  const rawData = {
    className: formData.get("className") as string,
    description: formData.get("description") as string,
    ageGroupMin: formData.get("ageGroupMin") as string,
    ageGroupMax: formData.get("ageGroupMax") as string,
    category: formData.get("category") as string,
    venue: formData.get("venue") as string,
    dayOfWeek: formData.get("dayOfWeek") as string,
    time: formData.get("time") as string,
    price: formData.get("price") as string,
  };

  let validated;
  try {
    validated = step3ClassSchema.parse(rawData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed", nextStep: null };
    }
    return { success: false, error: "Validation failed", nextStep: null };
  }

  // Get provider's address for the class
  const { data: provider } = await supabase
    .from("providers")
    .select("town, address_line1, postcode")
    .eq("id", providerId)
    .single();

  if (!provider) {
    return { success: false, error: "Provider not found", nextStep: null };
  }

  // Check if class already exists from previous step
  const step3Data = await getSavedStepData(providerId, "step-3-class");
  const existingClassId = (step3Data as { classId?: number })?.classId;

  let classId: number;

  if (existingClassId) {
    // Update existing draft class
    const { data: updatedClass, error: updateError } = await supabase
      .from("classes")
      .update({
        name: validated.className,
        description: validated.description,
        age_group_min: validated.ageGroupMin,
        age_group_max: validated.ageGroupMax,
        category: validated.category,
        venue: validated.venue,
        address: provider.address_line1 || "",
        postcode: provider.postcode || "",
        town: provider.town || "",
        day_of_week: validated.dayOfWeek,
        time: validated.time,
        price: validated.price || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingClassId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message, nextStep: null };
    }

    classId = updatedClass.id;
  } else {
    // Create new draft class (not published yet)
    const { data: newClass, error: classError } = await supabase
      .from("classes")
      .insert({
        name: validated.className,
        description: validated.description,
        age_group_min: validated.ageGroupMin,
        age_group_max: validated.ageGroupMax,
        category: validated.category,
        venue: validated.venue,
        address: provider.address_line1 || "",
        postcode: provider.postcode || "",
        town: provider.town || "",
        day_of_week: validated.dayOfWeek,
        time: validated.time,
        price: validated.price || null,
        provider_id: providerId,
        is_active: false, // Draft, not published yet
        is_published: false,
      })
      .select()
      .single();

    if (classError) {
      return { success: false, error: classError.message, nextStep: null };
    }

    classId = newClass.id;
  }

  // Save step data with class ID
  const stepData = {
    ...validated,
    classId,
  };

  // Save step data
  const saveResult = await saveStepData(providerId, "step-3-class", stepData);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error || "Failed to save step data", nextStep: null };
  }

  // Mark step complete and advance
  const completeResult = await markStepComplete(providerId, "step-3-class");
  if (!completeResult.success) {
    return { success: false, error: completeResult.error || "Failed to advance step", nextStep: null };
  }

  revalidatePath("/provider/onboarding");

  if (completeResult.nextStep) {
    redirect(`/provider/onboarding/wizard/${completeResult.nextStep}`);
  }

  return { success: true, error: null, nextStep: "step-4-media" };
}

/**
 * Save Step 4: Media
 * 
 * Accepts logo + gallery uploads (URLs for now, file uploads can be added later)
 * Uses existing upload pipeline if available
 * Stores URLs in DB
 * Saves step data and advances to step-5-preview
 */
export async function saveStep4Media(
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", nextStep: null };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership?.providers) {
    return { success: false, error: "No provider membership found", nextStep: null };
  }

  const providerId = membership.provider_id;

  // Get class ID from saved data
  const step3Data = await getSavedStepData(providerId, "step-3-class");
  const classId = (step3Data as { classId?: number })?.classId;

  if (!classId) {
    return { success: false, error: "Class not found. Please complete Step 3 first.", nextStep: null };
  }

  // Parse media URLs (from uploaded files or manual URLs)
  const logoUrl = formData.get("logoUrl") as string;
  const imageUrlsStr = formData.get("imageUrls") as string;
  let imageUrls: string[] = [];

  try {
    if (imageUrlsStr) {
      imageUrls = JSON.parse(imageUrlsStr);
      if (!Array.isArray(imageUrls)) {
        imageUrls = [];
      }
    }
  } catch {
    // Invalid JSON, ignore
    imageUrls = [];
  }

  // Filter out empty URLs
  imageUrls = imageUrls.filter(url => url && url.trim());

  // Validate minimum 3 gallery images
  if (imageUrls.length < 3) {
    return { success: false, error: "Please upload at least 3 class photos to continue.", nextStep: null };
  }

  // Update provider metadata with logo
  if (logoUrl && logoUrl.trim()) {
    const { data: provider } = await supabase
      .from("providers")
      .select("metadata")
      .eq("id", providerId)
      .single();

    const metadata = (provider?.metadata as Record<string, unknown>) || {};
    metadata.logo_url = logoUrl.trim();

    const { error: metadataError } = await supabase
      .from("providers")
      .update({ metadata })
      .eq("id", providerId);

    if (metadataError) {
      return { success: false, error: `Failed to save logo: ${metadataError.message}`, nextStep: null };
    }
  }

  // Update class with images
  if (imageUrls.length > 0) {
    const { error: imageError } = await supabase
      .from("classes")
      .update({ image_urls: imageUrls.join(",") })
      .eq("id", classId);

    if (imageError) {
      return { success: false, error: `Failed to save images: ${imageError.message}`, nextStep: null };
    }
  }

  // Save step data
  const stepData = {
    logoUrl: logoUrl?.trim() || null,
    imageUrls,
  };

  const saveResult = await saveStepData(providerId, "step-4-media", stepData);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error || "Failed to save step data", nextStep: null };
  }

  // Mark step complete and advance
  const completeResult = await markStepComplete(providerId, "step-4-media");
  if (!completeResult.success) {
    return { success: false, error: completeResult.error || "Failed to advance step", nextStep: null };
  }

  revalidatePath("/provider/onboarding");

  if (completeResult.nextStep) {
    redirect(`/provider/onboarding/wizard/${completeResult.nextStep}`);
  }

  return { success: true, error: null, nextStep: "step-5-preview" };
}

/**
 * Save Step 5: Preview
 * 
 * Marks step-5-preview as complete
 * Moves to step-6-publish
 * FormData is accepted but not used (for useFormState compatibility)
 */
export async function saveStep5Preview(
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", nextStep: null };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership?.providers) {
    return { success: false, error: "No provider membership found", nextStep: null };
  }

  const providerId = membership.provider_id;

  // Mark step complete and advance
  const completeResult = await markStepComplete(providerId, "step-5-preview");
  if (!completeResult.success) {
    return { success: false, error: completeResult.error || "Failed to advance step", nextStep: null };
  }

  revalidatePath("/provider/onboarding");

  if (completeResult.nextStep) {
    redirect(`/provider/onboarding/wizard/${completeResult.nextStep}`);
  }

  return { success: true, error: null, nextStep: "step-6-publish" };
}

// Alias for backward compatibility with existing UI
export const saveStep3Class = saveStep3ClassTemplate;

// Backward compatibility aliases
export const acknowledgePreview = async (
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> => saveStep5Preview(prevState, formData);

export const completeOnboardingAndPublish = async (
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> => saveStep6Publish(prevState, formData);

/**
 * Save Step 6: Publish
 * 
 * Sets provider_onboarding.is_complete = true
 * Sets provider_onboarding.current_step = 'complete'
 * Publishes provider's class (is_published = true, is_active = true)
 * Redirects to /provider
 * FormData is accepted but not used (for useFormState compatibility)
 */
export async function saveStep6Publish(
  prevState: OnboardingFormState | null,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", nextStep: null };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership?.providers) {
    return { success: false, error: "No provider membership found", nextStep: null };
  }

  const providerId = membership.provider_id;

  // Get class ID from saved data
  const step3Data = await getSavedStepData(providerId, "step-3-class");
  const classId = (step3Data as { classId?: number })?.classId;

  if (!classId) {
    return { success: false, error: "Class not found. Please complete Step 3 first.", nextStep: null };
  }

  // Publish the class
  const { error: classError } = await supabase
    .from("classes")
    .update({
      is_active: true,
      is_published: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId);

  if (classError) {
    return { success: false, error: `Failed to publish class: ${classError.message}`, nextStep: null };
  }

  // Mark onboarding as complete
  const { error: onboardingError } = await supabase
    .from("provider_onboarding")
    .update({
      is_complete: true,
      current_step: "complete",
      progress: 100,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_id", providerId);

  if (onboardingError) {
    return { success: false, error: `Failed to complete onboarding: ${onboardingError.message}`, nextStep: null };
  }

  revalidatePath("/provider");
  revalidatePath("/provider/onboarding");
  redirect("/provider");
}


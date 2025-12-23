"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NutritionStageContent, NutritionFood, NutritionEquipment, NutritionStage } from "@/lib/wellness/types";

interface AdminNutritionClientProps {
  initialStages: NutritionStageContent[];
  initialFoods: NutritionFood[];
  initialEquipment: NutritionEquipment[];
}

type TabType = "stages" | "foods" | "equipment";

const STAGE_OPTIONS: { value: NutritionStage; label: string }[] = [
  { value: "pregnancy", label: "Pregnancy" },
  { value: "breastfeeding", label: "Breastfeeding" },
  { value: "bottle-feeding", label: "Bottle Feeding" },
  { value: "weaning", label: "Weaning" },
];

export default function AdminNutritionClient({
  initialStages,
  initialFoods,
  initialEquipment,
}: AdminNutritionClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("stages");
  const [stages, setStages] = useState(initialStages);
  const [foods, setFoods] = useState(initialFoods);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSave = async (type: TabType, action: "create" | "update", data: any) => {
    setSaveStatus("saving");
    
    try {
      const response = await fetch("/api/admin/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action, data }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const result = await response.json();
      
      // Update local state
      if (type === "stages") {
        if (action === "create") {
          setStages([...stages, result.data]);
        } else {
          setStages(stages.map(s => s.id === result.data.id ? result.data : s));
        }
      } else if (type === "foods") {
        if (action === "create") {
          setFoods([...foods, result.data]);
        } else {
          setFoods(foods.map(f => f.id === result.data.id ? result.data : f));
        }
      } else if (type === "equipment") {
        if (action === "create") {
          setEquipment([...equipment, result.data]);
        } else {
          setEquipment(equipment.map(e => e.id === result.data.id ? result.data : e));
        }
      }

      setSaveStatus("success");
      setEditingItem(null);
      setShowForm(false);
      
      // Refresh the page data
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleDelete = async (type: TabType, id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setSaveStatus("saving");
    
    try {
      const response = await fetch("/api/admin/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action: "delete", data: { id } }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      // Update local state
      if (type === "stages") {
        setStages(stages.filter(s => s.id !== id));
      } else if (type === "foods") {
        setFoods(foods.filter(f => f.id !== id));
      } else if (type === "equipment") {
        setEquipment(equipment.filter(e => e.id !== id));
      }

      setSaveStatus("success");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Delete error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-sage/20 pb-2">
        {(["stages", "foods", "equipment"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowForm(false);
              setEditingItem(null);
            }}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-sage text-white"
                : "bg-white text-charcoal hover:bg-sage/10"
            }`}
          >
            {tab === "stages" ? "Stages" : tab === "foods" ? "Foods" : "Equipment"}
          </button>
        ))}
      </div>

      {/* Status Message */}
      {saveStatus !== "idle" && (
        <div
          className={`rounded-lg p-3 text-sm ${
            saveStatus === "saving"
              ? "bg-blue-50 text-blue-800"
              : saveStatus === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
          }`}
        >
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "success" && "✓ Saved successfully"}
          {saveStatus === "error" && "✗ Failed to save. Please try again."}
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingItem(null);
          }}
          className="rounded-full bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage/90"
        >
          + Add {activeTab === "stages" ? "Stage" : activeTab === "foods" ? "Food" : "Equipment"}
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
          {activeTab === "stages" && (
            <StageForm
              item={editingItem}
              onSave={(data) => handleSave("stages", editingItem ? "update" : "create", data)}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
            />
          )}
          {activeTab === "foods" && (
            <FoodForm
              item={editingItem}
              onSave={(data) => handleSave("foods", editingItem ? "update" : "create", data)}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
            />
          )}
          {activeTab === "equipment" && (
            <EquipmentForm
              item={editingItem}
              onSave={(data) => handleSave("equipment", editingItem ? "update" : "create", data)}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
            />
          )}
        </div>
      )}

      {/* Content Lists */}
      {!showForm && (
        <div className="space-y-4">
          {activeTab === "stages" && (
            <div className="space-y-3">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between rounded-xl border border-sage/20 bg-white p-4"
                >
                  <div>
                    <h3 className="font-semibold text-charcoal">{stage.title}</h3>
                    <p className="text-sm text-charcoal/60">Stage: {stage.stage}</p>
                    <p className="text-sm text-charcoal/60">
                      {stage.is_active ? "✓ Active" : "✗ Inactive"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(stage);
                        setShowForm(true);
                      }}
                      className="rounded-lg bg-sage/10 px-3 py-1 text-sm text-sage hover:bg-sage/20"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "foods" && (
            <div className="space-y-3">
              {foods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between rounded-xl border border-sage/20 bg-white p-4"
                >
                  <div>
                    <h3 className="font-semibold text-charcoal">{food.name}</h3>
                    <p className="text-sm text-charcoal/60">
                      Stages: {food.stage_tags.join(", ")}
                    </p>
                    <p className="text-sm text-charcoal/60">
                      Rating: {"★".repeat(food.nutrition_star_rating)}{"☆".repeat(5 - food.nutrition_star_rating)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(food);
                        setShowForm(true);
                      }}
                      className="rounded-lg bg-sage/10 px-3 py-1 text-sm text-sage hover:bg-sage/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete("foods", food.id)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="space-y-3">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-sage/20 bg-white p-4"
                >
                  <div>
                    <h3 className="font-semibold text-charcoal">{item.name}</h3>
                    <p className="text-sm text-charcoal/60">
                      Stages: {item.stage_tags.join(", ")}
                    </p>
                    <p className="text-sm text-charcoal/60 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                      className="rounded-lg bg-sage/10 px-3 py-1 text-sm text-sage hover:bg-sage/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete("equipment", item.id)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Stage Form Component
function StageForm({
  item,
  onSave,
  onCancel,
}: {
  item: NutritionStageContent | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    id: item?.id,
    stage: item?.stage || "pregnancy",
    title: item?.title || "",
    intro_text: item?.intro_text || "",
    key_guidance: item?.key_guidance?.join("\n") || "",
    cheats_and_tips: item?.cheats_and_tips?.join("\n") || "",
    linked_blog_tags: item?.linked_blog_tags?.join(", ") || "",
    safety_disclaimers: item?.safety_disclaimers?.join("\n") || "",
    display_order: item?.display_order || 0,
    is_active: item?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      key_guidance: formData.key_guidance.split("\n").filter(Boolean),
      cheats_and_tips: formData.cheats_and_tips.split("\n").filter(Boolean),
      linked_blog_tags: formData.linked_blog_tags.split(",").map(s => s.trim()).filter(Boolean),
      safety_disclaimers: formData.safety_disclaimers.split("\n").filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal">
        {item ? "Edit Stage" : "Add Stage"}
      </h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Stage</label>
        <select
          value={formData.stage}
          onChange={(e) => setFormData({ ...formData, stage: e.target.value as NutritionStage })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          disabled={!!item} // Can't change stage for existing items
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Intro Text</label>
        <textarea
          value={formData.intro_text}
          onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Key Guidance (one per line)
        </label>
        <textarea
          value={formData.key_guidance}
          onChange={(e) => setFormData({ ...formData, key_guidance: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          rows={5}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Cheats & Tips (one per line)
        </label>
        <textarea
          value={formData.cheats_and_tips}
          onChange={(e) => setFormData({ ...formData, cheats_and_tips: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          rows={5}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Safety Disclaimers (one per line)
        </label>
        <textarea
          value={formData.safety_disclaimers}
          onChange={(e) => setFormData({ ...formData, safety_disclaimers: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          rows={4}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Linked Blog Tags (comma-separated)
        </label>
        <input
          type="text"
          value={formData.linked_blog_tags}
          onChange={(e) => setFormData({ ...formData, linked_blog_tags: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          placeholder="pregnancy, nutrition, weaning"
        />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="w-24 rounded-lg border border-sage/30 px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <span className="text-sm text-charcoal">Active</span>
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="rounded-full bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-charcoal/10 px-6 py-2 font-medium text-charcoal hover:bg-charcoal/20"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Food Form Component
function FoodForm({
  item,
  onSave,
  onCancel,
}: {
  item: NutritionFood | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    id: item?.id,
    name: item?.name || "",
    stage_tags: item?.stage_tags || [],
    why_it_helps: item?.why_it_helps || "",
    allergens: item?.allergens || "",
    nutrition_star_rating: item?.nutrition_star_rating || 3,
    display_order: item?.display_order || 0,
    is_active: item?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleStage = (stage: NutritionStage) => {
    const current = formData.stage_tags;
    if (current.includes(stage)) {
      setFormData({ ...formData, stage_tags: current.filter(s => s !== stage) });
    } else {
      setFormData({ ...formData, stage_tags: [...current, stage] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal">
        {item ? "Edit Food" : "Add Food"}
      </h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Food Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Stages</label>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.stage_tags.includes(opt.value)}
                onChange={() => toggleStage(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Why It Helps</label>
        <textarea
          value={formData.why_it_helps}
          onChange={(e) => setFormData({ ...formData, why_it_helps: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Allergens/Cautions (optional)
        </label>
        <input
          type="text"
          value={formData.allergens}
          onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          placeholder="e.g., Dairy, Nuts"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Nutrition Rating (1-5 stars)
        </label>
        <select
          value={formData.nutrition_star_rating}
          onChange={(e) => setFormData({ ...formData, nutrition_star_rating: parseInt(e.target.value) as 1|2|3|4|5 })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5-n)} ({n})</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="w-24 rounded-lg border border-sage/30 px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <span className="text-sm text-charcoal">Active</span>
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="rounded-full bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-charcoal/10 px-6 py-2 font-medium text-charcoal hover:bg-charcoal/20"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Equipment Form Component
function EquipmentForm({
  item,
  onSave,
  onCancel,
}: {
  item: NutritionEquipment | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    id: item?.id,
    name: item?.name || "",
    stage_tags: item?.stage_tags || [],
    description: item?.description || "",
    buying_guidance: item?.buying_guidance || "",
    affiliate_url: item?.affiliate_url || "",
    image_url: item?.image_url || "",
    display_order: item?.display_order || 0,
    is_active: item?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleStage = (stage: NutritionStage) => {
    const current = formData.stage_tags;
    if (current.includes(stage)) {
      setFormData({ ...formData, stage_tags: current.filter(s => s !== stage) });
    } else {
      setFormData({ ...formData, stage_tags: [...current, stage] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal">
        {item ? "Edit Equipment" : "Add Equipment"}
      </h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Equipment Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Stages</label>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.stage_tags.includes(opt.value)}
                onChange={() => toggleStage(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          rows={3}
          required
          placeholder="What it's used for"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">Buying Guidance</label>
        <textarea
          value={formData.buying_guidance}
          onChange={(e) => setFormData({ ...formData, buying_guidance: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          rows={3}
          required
          placeholder="What to look for when buying"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Affiliate URL (optional)
        </label>
        <input
          type="url"
          value={formData.affiliate_url}
          onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-charcoal">
          Image URL (optional)
        </label>
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          className="w-full rounded-lg border border-sage/30 px-3 py-2"
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="w-24 rounded-lg border border-sage/30 px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <span className="text-sm text-charcoal">Active</span>
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="rounded-full bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-charcoal/10 px-6 py-2 font-medium text-charcoal hover:bg-charcoal/20"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


"use client";

import { useState } from "react";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import type { TagData } from "@/components/dashboard/up-next-card";

type EventItemInput = {
  name: string;
  type: "MEAL" | "DRINK" | "MERCH" | "OTHER";
};

type EventFormProps = {
  /** Selectable category tags (the colorful pills). */
  tags: TagData[];
  defaultValues?: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    capacity?: string;
    visibility?: string;
    status?: string;
    tags?: string[];
    items?: EventItemInput[];
  };
};

export function EventForm({ tags, defaultValues }: EventFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultValues?.tags ?? []);
  const [eventItems, setEventItems] = useState<EventItemInput[]>(defaultValues?.items ?? []);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const addItem = () => {
    setEventItems((current) => [...current, { name: "", type: "MEAL" }]);
  };

  const removeItem = (index: number) => {
    setEventItems((current) => current.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof EventItemInput, value: string) => {
    setEventItems((current) => {
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="flex min-w-px flex-1 flex-col gap-[24px] rounded-[16px] border border-border-soft bg-white p-[31px]">
      <input type="hidden" name="tags" value={selectedTags.join(",")} />
      <input type="hidden" name="status" value={defaultValues?.status ?? "UPCOMING"} />
      <input type="hidden" name="visibility" value={defaultValues?.visibility ?? "public"} />
      <input type="hidden" name="eventItems" value={JSON.stringify(eventItems)} />

      <FormField
        label="Event title"
        height={46}
        placeholder="e.g. Fall Kickoff"
        name="title"
        defaultValue={defaultValues?.title ?? ""}
        required
      />

      <FormTextarea
        label="Description"
        name="description"
        defaultValue={defaultValues?.description ?? ""}
        required
      />

      <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
        <FormField
          label="Start time"
          placeholder="2026-09-10T19:00"
          type="datetime-local"
          name="startTime"
          defaultValue={defaultValues?.startTime ?? ""}
          required
        />
        <FormField
          label="End time"
          placeholder="2026-09-10T20:30"
          type="datetime-local"
          name="endTime"
          defaultValue={defaultValues?.endTime ?? ""}
          required
        />
        <FormField
          label="Location"
          placeholder="ECSW 1.315"
          name="location"
          defaultValue={defaultValues?.location ?? ""}
          required
        />
        <FormField
          label="Capacity"
          placeholder="150"
          inputMode="numeric"
          name="capacity"
          type="number"
          min="1"
          defaultValue={defaultValues?.capacity ?? ""}
        />
      </div>

      {/* Event Items / Perks Section */}
      <div className="flex flex-col gap-3 border-t border-border-soft pt-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-body text-[14px] font-bold leading-[20.3px] text-ink">
              Event Items / Perks (Meals, Drinks, Merch)
            </span>
            <p className="font-mono text-xs text-ink-faint">
              Configure items that can be scanned/claimed during the event.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            + Add Item
          </Button>
        </div>

        {eventItems.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            {eventItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-border-soft bg-background p-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Pizza Slice, T-Shirt)"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  className="flex-1 rounded-lg border border-border-soft bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-brand"
                  required
                />
                <select
                  value={item.type}
                  onChange={(e) => updateItem(index, "type", e.target.value as EventItemInput["type"])}
                  className="rounded-lg border border-border-soft bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-brand"
                >
                  <option value="MEAL">MEAL</option>
                  <option value="DRINK">DRINK</option>
                  <option value="MERCH">MERCH</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="flex w-full flex-col gap-[7px] border-t border-border-soft pt-5">
        <span className="font-body text-[14px] font-bold leading-[20.3px] text-ink-muted">
          Tags
        </span>
        <div className="flex flex-wrap gap-[8px]">
          {tags.map((t) => {
            const isActive = selectedTags.includes(t.label.toUpperCase());
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => toggleTag(t.label.toUpperCase())}
                className="rounded-full"
              >
                <Tag
                  label={t.label}
                  bg={t.bg}
                  color={t.color}
                  border={t.border}
                  className={isActive ? "ring-2 ring-brand/50" : ""}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}